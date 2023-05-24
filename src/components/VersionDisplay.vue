<!-- eslint-disable vue/no-parsing-error -->
<template>
  <div class="row">
    <div class="">Version: {{ version }}</div>
    <div class="">Build at: {{ buidDateTime }}</div>
  </div>
</template>

<script lang="ts">
import { Vue } from "vue-class-component";

export default class VersionDisplay extends Vue {
  version: string | undefined = "";
  buidDateTime: string | undefined = "";
  mounted() {
    this.version = process.env.VUE_APP_GIT_HASH;
    this.buidDateTime = process.env.VUE_APP_BUILD_DATETIME;
  }
}
</script>

<style lang="less"></style>
