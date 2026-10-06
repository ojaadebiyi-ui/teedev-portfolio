// ============================================================
// TEEDEV PORTFOLIO — SUPABASE CONFIGURATION
// ============================================================
// This file is safe to use in the frontend.
//
// IMPORTANT:
// - The publishable key can be exposed in frontend code.
// - NEVER put a Supabase service-role/secret key here.
// - Security is enforced with Supabase Row Level Security (RLS).
// ============================================================

window.TEEDEV_SUPABASE_URL =
    "https://zlaaevwecisxawzevxcn.supabase.co";

window.TEEDEV_SUPABASE_ANON_KEY =
    "sb_publishable_qtYxwZqR6uyn7aubm8GFUQ_hfKff75N";

// Create one shared Supabase client
window.teeDevSupabase = null;

if (
    window.supabase &&
    window.TEEDEV_SUPABASE_URL &&
    window.TEEDEV_SUPABASE_ANON_KEY
) {
    window.teeDevSupabase = window.supabase.createClient(
        window.TEEDEV_SUPABASE_URL,
        window.TEEDEV_SUPABASE_ANON_KEY
    );
}