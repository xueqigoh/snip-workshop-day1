# Snip Design Language

A dark, quiet interface with generous space, warm color energy, and one obvious action. This borrows a visual mood from modern AI product builders without using their branding or copy.

## Tokens

- **Background:** `#0b0b0d`; elevated surface `#151519`; raised input `#1d1d22`
- **Text:** `#f7f4ef`; muted text `#9b9793`; faint text `#6f6b69`
- **Accent:** coral `#ff806d`, pink `#f15ca5`, orange `#ffb36b`
- **Accent gradient:** `linear-gradient(110deg, #ff806d 0%, #f15ca5 55%, #ffb36b 100%)`
- **Font:** `"Avenir Next", "Segoe UI", sans-serif`; bold display scale 4.5rem to 6.5rem; body 1rem; labels 0.72rem uppercase
- **Spacing:** 0.5rem base rhythm; page padding 2rem mobile / 4rem desktop; sections 4rem apart
- **Radii:** 12px cards; 18px surfaces; 22px composer; 999px input and action button
- **Borders:** 1px solid `rgba(255,255,255,.10)`; focus ring in translucent coral
- **Shadows:** `0 24px 80px rgba(0,0,0,.32)` on the composer; glow uses blurred radial gradients

## Snip Mapping

- **Page header:** centered hero with a small eyebrow, bold headline, and muted subline.
- **URL form:** the centerpiece chat-style composer; a pill input and attached gradient action.
- **Result notice:** quiet green-tinted success line inside the composer.
- **Error notice:** warm red line inside the composer without shifting the layout dramatically.
- **Links table:** a single raised card below the hero, with subtle rows and accent short-code links.
- **Hero glow:** a fixed, full-viewport-width, pointer-free band behind the hero, never constrained by the content column.
