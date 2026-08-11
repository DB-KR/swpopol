import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages는 "https://아이디.github.io/저장소이름/" 경로로 서비스됩니다.
// 아래 base 값을 본인의 저장소 이름과 동일하게 맞춰주세요.
// 예: 저장소 이름이 "my-portfolio" 라면 base: "/my-portfolio/"
export default defineConfig({
  plugins: [react()],
  base: "/portfolio-dashboard/",
});
