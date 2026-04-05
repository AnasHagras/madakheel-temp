/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";
const withTM = require("next-transpile-modules")([]);
const nextConfig = withTM({
  reactStrictMode: true,
  trailingSlash: true,
  swcMinify: true,
  basePath: "",
  assetPrefix: "",
  images: {
    loader: "akamai",
    path: "",
  },
});

module.exports = nextConfig;
