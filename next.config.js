const withNextIntl = require("next-intl/plugin")("./src/i18n/request.ts");
const { version } = require("./version.json");

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    APP_VERSION: version,
  },
};

module.exports = withNextIntl(nextConfig);
