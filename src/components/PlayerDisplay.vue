<template>
  <div class="col">
    <div
      class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pb-2 mb-3 border-bottom"
    >
      <h1 class="h2">Видеопроигрыватель</h1>
      <div class="btn-toolbar mb-2 mb-md-0">
        <div class="btn-group mr-2">
          <button
            class="btn btn-sm btn-outline-secondary"
            @click="exportMetaData"
          >
            Экспорт служебной информации
          </button>
        </div>
      </div>
    </div>
    <!--  -->
    <div class="row m-2 mx-1">
      <input
        class="form-control w-75"
        type="text"
        placeholder="Ссылка на поток (m3u8)"
        aria-label="Ссылка на поток (m3u8)"
        v-model="hlsSource"
        @change="setupHlsConsumer()"
      />
    </div>
    <!--  -->
    <div class="col">
      <video ref="video" class="video-height" controls></video>
    </div>
    <div class="row">
      <button
        type="button"
        class="btn btn-primary col-1"
        data-bs-toggle="button"
        aria-pressed="false"
        autocomplete="off"
        @click="toggleStartVideo"
      >
        Play / Stop
      </button>
    </div>
    <div class="col-8">
      <input type="range" class="form-range" />
    </div>
    <!--  -->
    <div class="row" ref="meta">
      <h2>Мета информация</h2>
      <div v-if="canSeeBuffered">
        <p v-if="buffered">
          Находится в буфере: {{ timeRangesToString(buffered) }}
        </p>

        <div class="row m-1 p-1 col-12 col-lg-8">
          <div class="progress" style="height: 5px">
            <div
              v-for="(barChunk, index) in bufferedProgressBarChunks"
              :key="index"
              class="progress-bar"
              :class="barChunk.isFilled ? 'bg-secondary' : 'bg-transparent'"
              role="progressbar"
              :style="`width: ${barChunk.end - barChunk.start}%`"
              :aria-valuenow="barChunk.end - barChunk.start"
              aria-valuemin="0"
              aria-valuemax="100"
            ></div>
          </div>
        </div>
      </div>

      <p v-if="played">Проиграно: {{ timeRangesToString(played) }}</p>
      <div class="row m-1 p-1 col-12 col-lg-8">
        <div class="progress" style="height: 5px">
          <div
            v-for="(barChunk, index) in playedProgressBarChunks"
            :key="index"
            class="progress-bar"
            :class="barChunk.isFilled ? 'bg-secondary' : 'bg-transparent'"
            role="progressbar"
            :style="`width: ${barChunk.end - barChunk.start}%`"
            :aria-valuenow="barChunk.end - barChunk.start"
            aria-valuemin="0"
            aria-valuemax="100"
          ></div>
        </div>
      </div>
      <p>Тек. позиция: {{ ~~currentPosition }} сек.</p>
      <p>Полная длина: {{ totalLength }} сек.</p>
      <div v-if="canSeeQuality">
        <p>Список доступных качеств: {{ qualityLevels.length }}</p>
        <ul class="list-inline">
          <li v-for="(qualityLevel, index) in qualityLevels" :key="index">
            {{ qualityLevel._attrs[0]["RESOLUTION"] }}
            {{ qualityLevel._attrs[0]["FRAME-RATE"] }}
          </li>
        </ul>
      </div>
      <p class="d-none visible-print">video JSON: {{ videoInfo }}</p>
    </div>
    <!--  -->
  </div>
</template>

<script lang="ts">
import { Vue } from "vue-class-component";
import Hls, { Level, ManifestParsedData } from "hls.js";
import EventBus from "@/lib/EventBus";
import { Export2Word } from "@/lib/Export";

class ProgressBarChunk {
  isFilled: boolean;
  start: number;
  end: number;

  constructor(isFilled: boolean, start: number, end: number) {
    this.isFilled = isFilled;
    this.start = start;
    this.end = end;
  }
}

export default class PlayerDisplay extends Vue {
  hlsSource =
    "https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_ts/master.m3u8";
  buffered: TimeRanges | null = null;
  played: TimeRanges | null = null;
  currentPosition = 0;
  totalLength = 0;
  qualityLevels: Level[] = [];
  videoInfo = "";
  //
  video: HTMLMediaElement | null = null;
  hls: Hls | null = null;
  //
  bufferedProgressBarChunks: ProgressBarChunk[] = [];
  playedProgressBarChunks: ProgressBarChunk[] = [];
  //
  canSeeBuffered = false;
  canSeeQuality = false;
  //
  mounted() {
    this.setupHlsConsumer();
    //
    EventBus.on("toggle-current-buffer-size", () => {
      this.canSeeBuffered = !this.canSeeBuffered;
    });
    EventBus.on("toggle-quality-list", () => {
      this.canSeeQuality = !this.canSeeQuality;
    });
  }
  isVideoPlaying() {
    let ret = false;
    if (this.video) {
      ret = !!(
        this.video.currentTime > 0 &&
        !this.video.paused &&
        !this.video.ended &&
        this.video.readyState > 2
      );
    }
    return ret;
  }
  toggleStartVideo() {
    if (this.video) {
      if (this.isVideoPlaying()) {
        this.video.pause();
      } else {
        this.video.play();
      }
    }
  }
  onManifestParsed(e: any, data: ManifestParsedData) {
    console.log(`manifest loaded, found ${data.levels.length} quality level`);
    this.qualityLevels = data.levels;

    let tmpData = { ...data };
    this.videoInfo = JSON.stringify(tmpData);
  }
  onFragmentChanged() {
    if (this.video) {
      this.played = this.video.played;
      this.playedProgressBarChunks = this.convertTimeRangesToBarChunks(
        this.played
      );
      this.currentPosition = this.video.currentTime;
    }
  }
  onFragmentBuffered() {
    if (this.video) {
      this.buffered = this.video.buffered;
      this.bufferedProgressBarChunks = this.convertTimeRangesToBarChunks(
        this.buffered
      );
      //
      if (this.played) {
        // additional tick
        this.playedProgressBarChunks = this.convertTimeRangesToBarChunks(
          this.played
        );
      }
    }
  }
  onLevelLoaded() {
    if (this.video) {
      this.totalLength = this.getVideoEnd();
    }
  }

  onHlsError(e: any, data: { fatal: any; type: any }) {
    if (this.hls) {
      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.MEDIA_ERROR:
            console.log("fatal media error encountered, try to recover");
            this.hls.recoverMediaError();
            break;
          case Hls.ErrorTypes.NETWORK_ERROR:
            console.error("fatal network error encountered", data);
            break;
          default:
            // cannot recover

            this.hls.destroy();

            break;
        }
      }
    }
  }
  setupHlsConsumer() {
    // list of events to listen
    // https://nochev.github.io/hls.js/docs/html/file/src/events.js.html

    // list of values to read from hls object itself
    // https://github.com/video-dev/hls.js/blob/master/docs/API.md

    // also you can read from Html object itself

    if (Hls.isSupported()) {
      this.video = this.$refs.video as HTMLMediaElement;
      this.hls = new Hls();
      this.hls.on(Hls.Events.MEDIA_ATTACHED, function () {
        return;
      });
      // events link up
      this.hls.on(Hls.Events.MANIFEST_PARSED, this.onManifestParsed);
      this.hls.on(Hls.Events.FRAG_CHANGED, this.onFragmentChanged);
      this.hls.on(Hls.Events.BUFFER_APPENDED, this.onFragmentBuffered);
      this.hls.on(Hls.Events.LEVEL_LOADED, this.onLevelLoaded);

      this.hls.on(Hls.Events.ERROR, this.onHlsError);

      this.hls.loadSource(this.hlsSource);
      // bind them together
      if (this.video) {
        this.hls.attachMedia(this.video);
      }
    }
  }
  timeRangesToString(range: TimeRanges): string {
    let ret = "";
    if (range) {
      for (let i = 0; i < range.length; i++) {
        ret += "[" + range.start(i) + ", " + range.end(i) + "]";
        ret += " ";
      }
    }

    return ret;
  }
  getVideoEnd() {
    if (this.video) {
      if (isFinite(this.video.duration)) {
        return this.video.duration;
      }
      if (this.video.seekable.length) {
        return this.video.seekable.end(this.video.seekable.length - 1);
      }
    }
    return 0;
  }
  convertTimeRangesToBarChunks(inputChunks: TimeRanges) {
    let ret = [];
    let secPercent = (1 / this.totalLength) * 100;
    let lastBufferEnd = 0;

    if (inputChunks) {
      for (let i = 0; i < inputChunks.length; i++) {
        // add empty bar
        if (inputChunks.start(i) > lastBufferEnd) {
          ret.push({
            isFilled: false,
            start: lastBufferEnd,
            end: inputChunks.start(i) * secPercent,
          });
        }
        // add normal bar
        ret.push({
          isFilled: true,
          start: inputChunks.start(i) * secPercent,
          end: inputChunks.end(i) * secPercent,
        });
        lastBufferEnd = inputChunks.end(i) * secPercent;
      }
    }
    return ret;
  }

  exportMetaData() {
    Export2Word("", this.$refs.meta as HTMLElement, "meta-video-info.doc");
  }
}
</script>

<style scoped lang="less">
.video-height {
  height: 600px;
}
</style>
