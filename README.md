# Supabase Iteration (GitHub Pages + Shared Billing Data)

This folder is the Supabase-backed version of your site.

## What changed
- Billing data now syncs through Supabase table `billing_sessions`.
- If `supabase-config.js` is not configured, app falls back to local browser storage.

## Setup
1. Create a Supabase project.
2. In Supabase SQL Editor, run `supabase-schema.sql`.
3. Edit `supabase-config.js` with your project URL + anon key:
   - `url`: `https://YOUR-PROJECT.supabase.co`
   - `anonKey`: your `anon` public key
4. Deploy this folder to GitHub Pages.

## Notes
- First load seeds Supabase from `billing-logs.csv` (or built-in fallback data) if the table is empty.
- Bulk payment updates are synced to Supabase in FIFO order.
- Password for billing screen is still managed in `script.js` (`BILLING_PASSWORD`).
