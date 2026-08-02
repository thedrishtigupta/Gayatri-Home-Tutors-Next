/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow images from any domain you host tutor photos on
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  // Expose only safe public env vars to the browser
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || "https://gayatrihometutors.com",
    NEXT_PUBLIC_PHONE:    process.env.NEXT_PUBLIC_PHONE    || "+918505952700",
  },
};

module.exports = nextConfig;
