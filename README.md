# FreshNest — Couch, Sofa &amp; Carpet Cleaning

A modern, fully animated single-page marketing site for a furniture &amp; carpet
cleaning business. Built with plain HTML, CSS and JavaScript — **no build step,
no dependencies, works offline.**

## ✨ Highlights

- **Interactive 360° sofa viewer** — a sofa rendered procedurally on `<canvas>`
  that you can **drag to rotate**, auto-spins on its own, and is wired to a
  slider + play/pause control. No image assets required.
- **Before / After reveal slider** — drag (or arrow-key) the handle to compare a
  dirty vs. freshly-cleaned cushion.
- **Animated hero** — floating 3D sofa, glow pulse, drifting bubble particles and
  count-up statistics.
- **Scroll-reveal** sections, spotlight-follow service cards, and a scrolling
  trust marquee.
- **Instant-quote form** with inline validation.
- Fully **responsive** with a mobile menu, and respects
  `prefers-reduced-motion` for accessibility.

## 🚀 Run it

Just open `index.html` in any browser, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## 📁 Structure

| File         | Purpose                                             |
|--------------|-----------------------------------------------------|
| `index.html` | Markup and page content                             |
| `styles.css` | All styling, animations and responsive layout       |
| `script.js`  | Bubbles, counters, 360° viewer, slider, form logic  |

## 🎨 Customising

- Brand colours live in the `:root` CSS variables (`--mint`, `--violet`, …).
- Services, prices and reviews are plain markup in `index.html`.
- The 360° sofa geometry is assembled from boxes in the `viewer360()` function
  in `script.js` — tweak colours or proportions there.

> Content (business name, phone, email, prices) is placeholder — swap in your
> real details before going live.
