import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "SSF Alparamba Unit - Digital Varisankhya",
    short_name: "SSF Alparamba",
    description: "Digital Varisankhya Collection Portal for SSF Alparamba Unit",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#F6F8FC",
    theme_color: "#2563EB",
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
