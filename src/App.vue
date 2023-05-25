<template>
  <div>
    <nav class="navbar navbar-dark sticky-top bg-dark flex-md-nowrap p-0">
      <router-link to="/" class="navbar-brand col-sm-3 col-md-2 mr-0" href="#"
        >Video stream consumer</router-link
      >
    </nav>
    <div class="container-fluid">
      <div class="row">
        <nav class="col-md-2 d-none d-md-block bg-light sidebar">
          <div class="sidebar-sticky">
            <ul class="nav flex-column">
              <li class="nav-item">
                <router-link to="/" class="nav-link active" href="#">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="feather feather-file"
                  >
                    <path
                      d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"
                    ></path>
                    <polyline points="13 2 13 9 20 9"></polyline>
                  </svg>
                  Видео <span class="sr-only"></span>
                </router-link>
              </li>
            </ul>
            <router-view name="sidePanel" />
          </div>
        </nav>

        <main role="main" class="col-md-9 ml-sm-auto col-lg-10 pt-3 px-4">
          <router-view />
        </main>
        <footer
          class="d-flex flex-wrap justify-content-between align-items-center py-3 my-4 border-top"
        >
          <div class="col-md-4 d-flex align-items-center">
            <a
              href="/"
              class="mb-3 me-2 mb-md-0 text-muted text-decoration-none lh-1"
            >
            </a>
            <span class="text-muted">© 2023 Incert company name here</span>
          </div>
          <VersionDisplay />
        </footer>
      </div>
    </div>
  </div>
  <!-- <nav><router-link to="/">Home</router-link></nav>
  <router-view />
   -->
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import VersionDisplay from "@/components/VersionDisplay.vue";

@Options({
  components: {
    VersionDisplay,
  },
})
export default class App extends Vue {}
</script>
