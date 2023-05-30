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
      <figure ref="videoContainer" @fullscreenchange="onChangedFullscreen()">
        <video
          @timeupdate="onVideoUpdated()"
          ref="video"
          class="video-dark video-height"
          :class="{
            'video-max': !restrictVideoSize,
          }"
        ></video>
        <div
          :class="{
            'fixed-bottom': !restrictVideoSize,
            'bg-dark': !restrictVideoSize,
            'video-controlls': !restrictVideoSize,
          }"
        >
          <div class="col" :class="{ 'col-8': restrictVideoSize }">
            <div class="row m-1 p-1">
              <button
                @click="toggleStartVideo"
                type="button"
                class="btn btn-outline-secondary col-1 m-1 p-0"
              >
                Play / pause
              </button>
              <button
                @click="stopVideo"
                type="button"
                class="btn btn-outline-secondary col-1 m-1 p-0"
              >
                Stop
              </button>
              <div class="col"></div>
              <button
                @click="toggleVideoMute"
                type="button"
                class="btn btn-outline-secondary col-1 m-1 p-0"
              >
                Mute / Unmute
              </button>
              <button
                @click="changeVolume(0.1)"
                type="button"
                class="btn btn-outline-secondary col-1 m-1 p-0"
              >
                Vol+
              </button>
              <button
                @click="changeVolume(-0.1)"
                type="button"
                class="btn btn-outline-secondary col-1 m-1 p-0"
              >
                Vol-
              </button>
              <button
                @click="toggleFullscreen"
                type="button"
                class="btn btn-outline-secondary col-1 m-1 p-0"
              >
                Fullscreen
              </button>
              <div
                class="col-1 m-1 p-0"
                :class="{
                  'text-light': !restrictVideoSize,
                }"
              >
                {{ `${~~(currentPosition / 60)}`.padStart(2, "0") }}:{{
                  `${~~(currentPosition % 60)}`.padStart(2, "0")
                }}
              </div>
            </div>
          </div>

          <div class="row m-1 p-0">
            <div :class="{ 'col-8': restrictVideoSize }">
              <input
                type="range"
                v-model="currentPosition"
                :max="totalLength"
                class="form-range"
                @change="playbackChanged()"
              />
            </div>
          </div>
        </div>

        <!--  -->
      </figure>
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
import { clamp } from "@/lib/util";
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
  restrictVideoSize = true;
  //
  videoControlValue = 0;
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
    // add watcher for more smooth experience
    // this.$watch("currentPosition", this.playbackChanged); // creates error with feedback loop and choppy video
  }
  //
  playbackChanged() {
    if (this.video) {
      this.video.currentTime = this.currentPosition;
    }
  }
  //
  onChangedFullscreen() {
    this.restrictVideoSize = !this.restrictVideoSize;
  }
  toggleFullscreen() {
    if (document.fullscreenElement !== null) {
      // The document is in fullscreen mode
      document.exitFullscreen();
      // this.restrictVideoSize = true;
    } else {
      // The document is not in fullscreen mode
      (this.$refs.videoContainer as HTMLElement).requestFullscreen();
      // this.restrictVideoSize = false;
    }
  }
  //
  changeVolume(volumeDelta: number) {
    if (this.video) {
      const currentVolume = ~~(this.video.volume * 10) / 10;

      this.video.volume = clamp(this.video.volume + volumeDelta, 0, 1);
      this.video.muted = currentVolume <= 0;
    }
  }
  //
  toggleVideoMute() {
    if (this.video) {
      this.video.muted = !this.video.muted;
    }
  }
  //
  stopVideo() {
    if (this.video) {
      this.video.pause();
      this.video.currentTime = 0;
    }
  }
  //
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
  onVideoUpdated() {
    if (this.video) {
      this.currentPosition = this.video.currentTime;
    }
  }
  //
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
.video-container-height {
  max-height: 700px;
}
.video-max {
  height: 100%;
}
.video-controlls {
  opacity: 0.1;
}
.video-controlls:hover {
  opacity: 1;
}
</style>
