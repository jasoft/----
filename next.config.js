/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.mjs";

/** @type {import("next").NextConfig} */
const config = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8090",
        pathname: "/api/files/**",
      },
    ],
  },
  productionBrowserSourceMaps: true,
  // 禁用开发工具

  // 配置 React 选项
  reactStrictMode: false, // 在生产环境中禁用严格模式
};

export default config;
