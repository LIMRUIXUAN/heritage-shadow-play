# Heritage Shadow Play

Browser-based interactive Chinese shadow theatre built with Vite, TypeScript and MediaPipe Gesture Recognizer.

## Run locally

```bash
npm install
npm run dev
```

Open the localhost URL shown by Vite and allow camera access. Make a fist to open the curtain, use both hands to control the puppet, then cross both hands into an X and hold for three seconds to close it.

The camera requires localhost or HTTPS. If camera or model loading fails, the interface provides manual puppet rods as a fallback.

## Verification

```bash
npm test
npm run build
npm audit --audit-level=high
```
