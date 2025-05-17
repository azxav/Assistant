
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || supabaseUrl.trim() === "") {
  throw new Error("Missing or empty env.NEXT_PUBLIC_SUPABASE_URL. Please ensure it is set in your .env.local file and is a valid URL.");
}
if (!supabaseAnonKey || supabaseAnonKey.trim() === "") {
  throw new Error("Missing or empty env.NEXT_PUBLIC_SUPABASE_ANON_KEY. Please ensure it is set in your .env.local file.");
}

// Attempt to validate the URL structure before creating the client
try {
  new URL(supabaseUrl);
} catch (e) {
  throw new Error(`Invalid URL format for NEXT_PUBLIC_SUPABASE_URL: '${supabaseUrl}'. Please check your .env.local file.`);
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);
