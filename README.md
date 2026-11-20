# anupama.dev (v2)

Personal portfolio of Anupama Dilshan, told as a git log: Sri Lanka → IFS → Devest → Adelaide → DIT SA.

Static site, no build step: `index.html`, `styles.css`, `main.js`, and `assets/`.
Scroll animations use GSAP + ScrollTrigger from cdnjs. Without JS, or with
"reduce motion" turned on, every section still renders in its final, readable state.

## Run locally

```bash
python -m http.server 8000
# open http://localhost:8000
```

## Editing content

All copy lives in `index.html`:

- **Story chapters**: `<li class="commit">` items inside `#story`. The `commit--leap` chapter gets the highlighted card.
- **Projects**: `<article class="card">` items inside `#work`. Images go in `assets/img/` (WebP, ~1400px wide).
- **Stack**: the `stack.ts` code block inside `#stack`.
- **Hobbies**: the three `.hobby` articles inside `#life`.

## Deploy

Drag the folder into Netlify, or push to a repo and point Netlify/GitHub Pages at the root.
