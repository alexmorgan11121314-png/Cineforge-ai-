# CINEFORGE AI — Documentary Studio (MVP)

A mobile-first static web app. No paid hosting, GPU or API is required to run the editor and renderer.

## What works
- Topic input and editable script draft.
- Optional topic-specific script generation through Groq's free developer tier (quota/model availability can change).
- Historical image lookup through Wikimedia Commons.
- Automatic scene board with cinematic title cards, pan/zoom motion, subtitles and progress.
- Browser rendering to WebM using MediaRecorder.
- Optional narration/music upload; supported browsers can include it in the rendered WebM.

## Honest limitations
- This is an MVP, not an unlimited one-click text-to-video model.
- Without a Groq key, the script is a generic starter outline and must be researched/re-written.
- Wikimedia image search can return irrelevant images. Verify every image, date, caption and usage license before publishing. Keep attribution for each selected asset; this MVP does not yet generate an attribution sheet.
- The renderer uses a moving still-image documentary style, not fully generated character animation.
- Android Chrome generally exports WebM, not MP4. Convert WebM to MP4 in a free editor such as CapCut if needed.
- A 10–15 minute render runs in real time. Keep the page open, plugged in if possible, and prevent the phone from sleeping. Large videos may exceed phone memory.
- Browser TTS is not embedded in the video. Upload an audio narration track if you want spoken narration.

## Run locally
Open `index.html` in a modern browser. For service worker/PWA features use a static HTTPS host.

## Free hosting from Android
1. Create a GitHub account and a new public repository named `cineforge-ai`.
2. Upload all five files: `index.html`, `styles.css`, `app.js`, `manifest.webmanifest`, `sw.js`.
3. In repository Settings → Pages, choose Deploy from a branch, select `main` and `/root`, then Save.
4. Wait for GitHub Pages to publish the URL. Open it in Chrome on Android.
5. Chrome menu → Add to Home screen.

## Optional free AI script key
1. Visit https://console.groq.com/keys and create a key if free access is available in your region/account.
2. In the app, tap ⚙ Settings, paste the key, save.
3. Key is stored in local browser storage on this device. Do not use on a shared device; remove it from Settings when finished.
4. Free-tier limits and model availability may change. Do not share the key or publish it in a public repository.

## Next improvements
- Fact-check/research source panel, citations, image licensing/attribution export, per-scene image selection, narration generation integration, FFmpeg-based MP4 export, and resumable rendering.
