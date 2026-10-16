import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  const appId = new URL(
    "/",
    process.env.APP_BASE_URL || "http://localhost:3000"
  ).href;

  return {
    id: "/",
    name: "Atiyya",
    short_name: "Atiyya",
    description: "Digital Support Portal for Atiyya Group",
    start_url: "/member/dashboard?source=pwa",
    scope: "/",
    display: "fullscreen",
    display_override: ["fullscreen", "standalone"],
    launch_handler: {
      client_mode: "focus-existing",
    },
    prefer_related_applications: false,
    related_applications: [
      {
        platform: "webapp",
        url: "/manifest.webmanifest",
        id: appId,
      },
    ],
    protocol_handlers: [
      {
        protocol: "web+atiyya",
        url: "/member/dashboard?source=protocol&launch=%s",
      },
    ],
    background_color: "#F6F8FC",
    theme_color: "#F6F8FC",
    orientation: "portrait-primary",
    categories: ["finance", "productivity"],
    icons: [
      {
        src: "/icons/pwa-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/pwa-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/pwa-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
