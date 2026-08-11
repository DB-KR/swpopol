import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // eslint-disable-next-line no-console
  console.warn("Supabase 환경변수가 설정되지 않았어요. .env 파일을 확인해주세요.");
}

export const supabase = createClient(url, anonKey);
