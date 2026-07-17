import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "KIPROD CRM â€” Institutional Growth Hub",
    short_name: "KIPROD CRM",
    description:
      "KIPROD institutional engagement, partnerships, acquisition and reporting platform.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#071426",
    theme_color: "#071426",
    orientation: "any",
    categories: [
      "business",
      "productivity",
    ],
    prefer_related_applications: false,
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/maskable-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}