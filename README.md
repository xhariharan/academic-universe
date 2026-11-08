# Academic Universe

Interactive 3D map of academic disciplines with local knowledge profiles, workspace layers, profile comparison, and optional AI assistance.

## Run locally

1. Install Node.js 20 or newer.
2. Run `npm install` and `npm.cmd run dev`.
3. Open the local URL printed by Vite.

The map, manual profiles, layers, and preferences work without an AI key. For AI requests, deploy to Vercel and configure `OPENAI_API_KEY` in the server environment. `OPENAI_MODEL` is optional and defaults to `gpt-4.1-mini`. Do not put either secret in a `VITE_` variable.

## Deploy

Import this project into Vercel. The `api/ai.ts` serverless function handles OpenAI calls; `vercel.json` routes the rest of the site to the Vite application. Add the environment variables above in the Vercel project settings.

## Data and privacy

Profile records and workspace layers are saved in this browser's local storage. They are not uploaded to the app server. Profile text is sent to OpenAI only when the user selects AI analysis or sends a chat request. The included discipline placements and cluster assignments are illustrative, not authoritative similarity measurements.

## Build

Run `npm run build` to type-check and build the production frontend.
