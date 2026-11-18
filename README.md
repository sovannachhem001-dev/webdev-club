# WebDev Club

WebDev Club is a React and Vite website backed by Supabase.

## Local development

1. Copy `.env.example` to `.env`.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` using your Supabase project API settings.
3. Install dependencies with `npm install`.
4. Start the development server with `npm run dev`.

## Deploying on Vercel

In the Vercel project, open **Settings → Environment Variables** and add:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Use the values from the Supabase project API settings. Apply them to Production (and Preview/Development if needed), then redeploy the latest commit. Vite embeds these variables during the build, so changing them requires a new deployment.

`vercel.json` includes a single-page-app rewrite so direct navigation and refreshes on routes such as `/admin/gallery` resolve to the React app.
