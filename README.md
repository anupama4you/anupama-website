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

## Code challenge ("The lost commit")

The `#challenge` section checks answers against a salted SHA-256 hash (`data-hash` on the form),
so the answer is never in the site. `challenge/input.txt` and `challenge/sample.txt` are the puzzle files.

The generator and claim checker live in `.challenge/` (gitignored). The secret phrase is never written
to disk; keep it in a password manager.

```bash
# New puzzle (prints the new data-hash to paste into index.html)
node .challenge/generate.mjs "<secret phrase>" [seed]

# Check a claim code someone emailed you
node .challenge/verify-claim.mjs "<secret phrase>" ABCD-1234-EF56
```

Add solvers to the Hall of fame by adding an `<li>` to the `[data-wall]` list in `index.html`
(and removing the "No solvers yet" item).

**Netlify drag-and-drop:** drag a copy without the `.challenge/` folder, or deploy from Git so ignored files stay out.
