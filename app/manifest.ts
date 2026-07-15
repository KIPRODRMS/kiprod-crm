import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KIPROD CRM — Institutional Growth Hub",
    short_name: "KIPROD CRM",
    description:
      "KIPROD institutional engagement, partnerships, acquisition and reporting platform.",
    start_url: "/",
    display: "standalone",
    background_color: "#071426",
    theme_color: "#071426",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
