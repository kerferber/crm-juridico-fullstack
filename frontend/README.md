<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1E1n-hET_UP1kjhLeX8iE6nnE-09VzQbu

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Configure [.env.local](.env.local) com:
   ```bash
   GEMINI_API_KEY=PLACEHOLDER_API_KEY
   VITE_API_BASE_URL=http://localhost:8000/api
   VITE_REVERB_APP_KEY=local
   VITE_REVERB_HOST=127.0.0.1
   VITE_REVERB_PORT=8080
   VITE_REVERB_SCHEME=http
   VITE_REVERB_USE_TLS=false
   VITE_REVERB_CLUSTER=mt1
   ```
3. Run the app:
   `npm run dev`
