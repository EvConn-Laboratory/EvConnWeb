import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EvConn Laboratory",
    short_name: "EvConn Lab",
    description:
      "The integrated digital platform for EvConn Laboratory — practical learning, study groups, and laboratory management.",
    start_url: "/",
    display: "standalone",
    background_color: "#080C10",
    theme_color: "#2ABFBF",
    orientation: "portrait-primary",
    scope: "/",
    lang: "id",
    categories: ["education", "productivity"],
    icons: [
      {
        src: "/evconn-light.png",
        sizes: "any",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/evconn-light.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Dashboard",
        short_name: "Dashboard",
        description: "Go to your LMS dashboard",
        url: "/lms/dashboard",
        icons: [{ src: "/evconn-light.png", sizes: "any", type: "image/png" }],
      },
      {
        name: "Programs",
        short_name: "Programs",
        description: "Browse lab programs",
        url: "/programs",
        icons: [{ src: "/evconn-light.png", sizes: "any", type: "image/png" }],
      },
      {
        name: "News",
        short_name: "News",
        description: "Read lab news and updates",
        url: "/news",
        icons: [{ src: "/evconn-light.png", sizes: "any", type: "image/png" }],
      },
    ],
    screenshots: [],
  };
}
