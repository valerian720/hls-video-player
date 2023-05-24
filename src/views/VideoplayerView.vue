<template>
  <div class="home">
    <PlayerDisplay />
  </div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import PlayerDisplay from "@/components/PlayerDisplay.vue"; // @ is an alias to /src

@Options({
  components: {
    PlayerDisplay,
  },
})
export default class VideoplayerView extends Vue {}
</script>
