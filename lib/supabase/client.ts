import { createBrowserClient } from "@supabase/ssr";
import {
  SUPABASE_PUBLIC_KEY,
  SUPABASE_URL,
} from "./public-config";

export function createClient() {
  return createBrowserClient(
    SUPABASE_URL,
    SUPABASE_PUBLIC_KEY
  );
}
