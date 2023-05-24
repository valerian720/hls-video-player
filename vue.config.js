const { defineConfig } = require("@vue/cli-service");
module.exports = defineConfig({
  publicPath:
    process.env.NODE_ENV === "production" ? "/hls-video-player/" : "/",
  transpileDependencies: true,
  // auto fix on save
  chainWebpack: (config) => {
    config.plugin("eslint").tap((args) => {
      args[0].fix = true;
      return args;
    });
  },
});
