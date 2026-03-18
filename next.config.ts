import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@tiptap/react",
    "@tiptap/starter-kit",
    "@tiptap/extension-link",
    "@tiptap/extension-placeholder",
    "@tiptap/extension-image",
    "@tiptap/core",
    "@tiptap/pm",
  ],
};

export default nextConfig;
