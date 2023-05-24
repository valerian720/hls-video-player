import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "video",
    components: {
      default: () => import("../views/VideoplayerView.vue"),
      sidePanel: () => import("../views/StatisticsNav.vue"),
    },
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
