import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages는 "https://아이디.github.io/저장소이름/" 경로로 서비스됩니다.
// swpopol 저장소용으로 고정되어 있습니다.
export default defineConfig({
  plugins: [react()],
  base: "/swpopol/",
});
