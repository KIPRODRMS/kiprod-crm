import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  SUPABASE_PUBLIC_KEY,
  SUPABASE_URL,
} from "./public-config";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    SUPABASE_URL,
    SUPABASE_PUBLIC_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(
              ({ name, value, options }) => {
                cookieStore.set(name, value, options);
              }
            );
          } catch {
            // Server Components cannot always write cookies.
            // The session proxy will handle refreshing them.
          }
        },
      },
    }
  );
}
