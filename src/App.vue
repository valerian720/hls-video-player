<template>
  <nav><router-link to="/">Home</router-link> |</nav>
  <router-view />
  <VersionDisplay />
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import VersionDisplay from "@/components/VersionDisplay.vue"; // @ is an alias to /src

@Options({
  components: {
    VersionDisplay,
  },
})
export default class HomeView extends Vue {}
</script>

<style lang="less">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

nav {
  padding: 30px;

  a {
    font-weight: bold;
    color: #2c3e50;

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
</style>
