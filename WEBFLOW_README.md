# Hero Mouse Tilt – Webflow Integration

## What's included

- **heroMouseTilt.js** – Animation script (upload to Webflow Assets or your CDN)
- **Logo-s.png** – Logo image (upload and replace with your own if needed)

## Setup

### 1. Upload files

1. In Webflow: **Project Settings → Hosting → Custom Code**, or use **Assets**.
2. Upload `heroMouseTilt.js` and your logo image.
3. Copy the public URL for each file.

### 2. Add the embed

1. Add an **Embed** element where you want the animation (e.g. hero section).
2. Paste this code and replace the URLs with yours:

```html
<div id="hero-mouse-tilt-container" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; min-height: 100vh; pointer-events: none;"></div>
<script src="YOUR_heroMouseTilt.js_URL"></script>
<script>
  (function() {
    initHeroMouseTilt({
      container: document.getElementById('hero-mouse-tilt-container'),
      imageUrl: 'YOUR_LOGO_IMAGE_URL',
      spacing: 6,
      scale: 3
    });
  })();
</script>
```

### 3. Layout

Place the Embed inside a section or div with a defined height (e.g. full viewport). The animation will fill that container.

## Options

- **spacing** (1–20): Lower = more particles. Default: 6
- **scale** (0.1–10): Logo size. Default: 3

## Troubleshooting

- **Blank or grid instead of logo**: The logo image must be from the same domain or served with CORS headers (e.g. `Access-Control-Allow-Origin: *`).
- **Nothing appears**: Ensure the parent container has a height (e.g. 100vh).
