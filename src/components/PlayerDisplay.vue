<template>
  <div class="col">
    <div
      class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pb-2 mb-3 border-bottom"
    >
      <h1 class="h2">Видеопроигрыватель</h1>
      <div class="btn-toolbar mb-2 mb-md-0">
        <div class="btn-group mr-2">
          <button class="btn btn-sm btn-outline-secondary">
            Экспорт служебной информации
          </button>
        </div>
      </div>
    </div>
    <!--  -->
    <div class="col">
      <video ref="video" class="video-height" controls></video>
    </div>
    <!--  -->
    <div class="row">
      <h2>Мета информация</h2>
      <p v-if="buffered">buffered = {{ timeRangesToString(buffered) }}</p>
      <p v-if="played">played = {{ timeRangesToString(played) }}</p>
      <p>currentPosition = {{ currentPosition }}</p>
      <p>totalLength = {{ totalLength }}</p>

      <p>qualityLevels = {{ qualityLevels.length }}</p>
    </div>
    <!--  -->
  </div>
</template>

<script lang="ts">
import { Vue } from "vue-class-component";
import Hls, { Level } from "hls.js";

export default class PlayerDisplay extends Vue {
  hlsSource =
    "https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_ts/master.m3u8";
  buffered: TimeRanges | null = null;
  played: TimeRanges | null = null;
  currentPosition = 0;
  totalLength = 0;
  qualityLevels: Level[] = [];
  //
  video: HTMLMediaElement | null = null;
  //
  mounted() {
    this.setupHlsConsumer();
  }
  setupHlsConsumer() {
    // list of events to listen
    // https://nochev.github.io/hls.js/docs/html/file/src/events.js.html

    // list of values to read from hls object itself
    // https://github.com/video-dev/hls.js/blob/master/docs/API.md

    if (Hls.isSupported()) {
      this.video = this.$refs.video as HTMLMediaElement;
      var hls = new Hls();
      hls.on(Hls.Events.MEDIA_ATTACHED, function () {
        // console.log("video and hls.js are now bound together !");
      });

      hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
        console.log(
          `manifest loaded, found ${data.levels.length} quality level`
        );
        this.qualityLevels = data.levels;
        console.log(data);
      });
      // BUFFER_APPENDED
      hls.on(Hls.Events.BUFFER_APPENDED, (_event, _data) => {
        if (this.video) {
          this.buffered = this.video.buffered;
          this.played = this.video.played;
          this.currentPosition = this.video.currentTime;
          //
          this.totalLength = this.getVideoEnd(); // TODO: dont recalc
        }
      });

      hls.on(Hls.Events.ERROR, function (_event, data) {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log("fatal media error encountered, try to recover");
              hls.recoverMediaError();
              break;
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error("fatal network error encountered", data);
              // All retries and media options have been exhausted.
              // Immediately trying to restart loading could cause loop loading.
              // Consider modifying loading policies to best fit your asset and network
              // conditions (manifestLoadPolicy, playlistLoadPolicy, fragLoadPolicy).
              break;
            default:
              // cannot recover
              hls.destroy();
              break;
          }
        }
      });

      hls.loadSource(this.hlsSource);
      // bind them together
      if (this.video) {
        hls.attachMedia(this.video);
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
}
</script>

<style scoped lang="less">
.video-height {
  height: 600px;
}
</style>
