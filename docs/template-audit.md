# Template Audit & Migration Plan

**Scope:** `index.html`, `about-us.html`, `services.html`, `contact.html` and everything under `assets/` (currently branded "Oshone Geosurveys Limited"). Every page and shared asset was inspected. **No code was changed** — this is analysis only, feeding the implementation plan for the Burgenton rebuild described in `template-blueprint.md`/the approved website blueprint.

---

## 1. Project Architecture

- **Stack:** plain static HTML5 + Bootstrap 5 + jQuery. No build tool, no bundler, no framework, no templating/include system of any kind.
- **File structure:** 4 root-level `.html` files; all shared assets under `assets/{css,js,fontawsome,img}`. No `/components`, `/partials`, or `/includes` directory — there is no mechanism for sharing markup between pages.
- **Critical finding — zero componentization:** the header and footer are **copy-pasted verbatim into every page** (footer alone is 154 identical lines × 4 files). Confirmed byte-for-byte identical across all 4 files. At Burgenton's target scale (~35–40 pages per the approved blueprint), hand-maintaining duplicated header/footer/nav markup across every file is not viable — a single content or nav change means editing 35–40 files by hand, and drift between pages is already visible today (see §3).
- **CSS bloat:** `style.css` is 4,802 lines; a spot-check of section-prefixes not present in any of the 4 shipped pages (`banner-area-one`, `about-us-area-one`, `active-employes`, `news-area`, `blog-classic`, `blog-details`, `faq-area`, `get-updates`, `all-team`, unused testimonial sliders) accounts for **~165 dead CSS rule blocks** — this is leftover from the original ThemeForest multi-demo template and was never pruned for this build.
- **Dead JS:** `script.js` initializes **8 separate Slick carousels** (`.recent-work-slider-one`, `.active-employes-slider`, `.active-employes-slider-two`, `.news-area-one-slider`, `.news-area-two-slider`, `.testimonial-area-slider-one`, `.testimonial-slider-two`, `.all-team-area-slider`, `.about-testimonial-slider`) — **none of these classes exist in any of the 4 live HTML pages.** All of that init code runs harmlessly against empty jQuery selections today, but it's dead weight and a maintenance trap (someone will assume a slider is wired up because it's "in the JS").
- **No data/CMS layer:** all copy is hardcoded directly into HTML. Fine for a 4-page brochure; not workable for Burgenton's ~13 near-identical Product Detail pages and ~10 Solution/Support pages without some templating or content-model approach (see Migration Plan, Phase 0).

## 2. Routing

- No client-side or server-side routing — each "page" is an independent static file linked via relative `href`s (`index.html`, `about-us.html`, etc.).
- No clean-URL structure (no `/products/...` directories) — everything is flat at root.
- Breadcrumb component exists (`.breadcrumb-area`) but is only ever wired for **one level of depth** (`Home > About`). Burgenton's IA needs 3 levels (`Home > Products > Construction > Self-Loading Mixer`) — current markup has no pattern for a multi-crumb trail.
- No `404.html`, no `sitemap.xml`, no `robots.txt`.

## 3. UI Components Inventory

| Component | Where used | Notes |
|---|---|---|
| Preloader | all pages | identical markup, fine |
| **Header — variant A** (`header-area-two`) | `index.html` only | two-tier: info bar (hours/address/phone) + nav row, plus a search overlay and a desktop off-canvas info panel |
| **Header — variant B** (`header-area-one`) | `about-us.html`, `services.html`, `contact.html` | single-tier simple navbar, **no** search overlay, **no** desktop off-canvas panel |
| Mobile off-canvas menu | all pages | same interaction pattern, slightly different markup between variant A/B |
| Breadcrumb bar | about/services/contact only | not on Home (correct — Home has no breadcrumb) |
| Hero/banner (`data-background`) | index only | JS reads `data-background` attr and sets it as inline `background-image` |
| Section title module (`.section-title-one`) | all pages | eyebrow label + heading, consistent and reusable |
| Service/feature card (`.services-item-two`) | index (6 cards), services.html (20 cards) | image + overlaid icon + title + text |
| About split section | index, about-us | 2 stacked images + text column + checklist + CTA |
| Recent-work/project gallery | index only | hover-reveal caption on image grid |
| Messages/lead-capture form | index only | embedded mid-page, styled input groups |
| Contact form + info list | contact only | separate component from the Messages module above, duplicative in intent |
| Call-to-action banner | commented out on index; **live** on about/services/contact | image + phone-CTA strip |
| Footer | all pages | 3-column (about+social, quick links, photo gallery) + bottom bar |
| Scroll-to-top button | all pages | consistent |
| Buttons | all pages | **4 separate, undocumented classes**: `.common-btn`, `.submit-btn`, `.border-btn`, `.dark-btn` — no shared base, no formal variant/state system |

**Finding:** Two different header components exist for no functional reason — this is drift, not intentional design (Home needs the richer header more than interior pages do, if anything the reverse is true). This must be consolidated to one component before Burgenton build-out.

## 4. Design System

- Tokens exist but are minimal and under-enforced. `:root` in `style.css` defines 11 custom properties: 2 font families, 1 primary color (`--primary: #FF6600`), black/white, heading/body/paragraph colors, section background, body size, line-heights, a border color.
- **Token bypass:** `#FF6600` (the primary color) is hardcoded directly 4 additional times elsewhere in the file instead of using `var(--primary)`.
- **Orphaned colors:** 6 hex values appear that match nothing in `:root` and aren't part of any documented palette — `#5A99EC`, `#4676ED`, `#4467AD`, `#C40027`, `#F68B21`, `#333F4D` — almost certainly leftovers from the original template's other color-scheme demos, never cleaned up.
- No spacing scale/tokens at all — margins and paddings are magic numbers throughout (e.g. `padding: 14px 30px`, `margin-top: 40px`) rather than derived from a shared scale. Bootstrap's `--bs-gutter-x: 30px` is the only systemized spacing value in the codebase.
- No elevation/shadow scale — 10 distinct one-off `box-shadow` values found, no reuse, no tokens.
- Border-radius is *mostly* consistent (`5px` dominant, 79 uses; `50%` for circles, 27 uses) but has unexplained one-off exceptions (`3px`, `8px`, `10px`) with no visible rationale.

## 5. Spacing

No formal spacing system — see §4. Every section hand-tunes its own margin/padding, and `responsive.css` (2,637 lines) re-declares full spacing rules per breakpoint rather than using relative units or a scale. This is the most expensive part of the codebase to extend: adding a new section today means writing 6 breakpoint-specific overrides by hand, copying whatever the nearest existing section did.

## 6. Typography

- Font pairing: **Rubik** (body) + **Rajdhani** (headings), loaded via CSS variables — a strong, technical/industrial pairing well suited to Burgenton's tone. Worth keeping.
- No type scale — sizes are set ad hoc per selector, then re-overridden per breakpoint in `responsive.css`. There is no `clamp()`/fluid sizing and no shared scale (e.g. no `--text-sm/base/lg/xl` tokens), so every new heading needs its own manual responsive tuning.

## 7. Responsiveness

- Breakpoints mirror Bootstrap 5 exactly and are reasonably granular: `≥1400px`, `1200–1399px`, `992–1199px`, `768–991px`, `576–767px`, `<576px`. This structure is sound and worth keeping as-is.
- However, `responsive.css` re-declares whole rule blocks per breakpoint instead of relying on fluid/relative sizing — 2,637 lines for what is fundamentally a 4-page site. This will not scale cleanly to 40 pages without a token-driven, fluid-first rewrite.
- The mobile off-canvas nav pattern (`d-block d-lg-none` / `d-none d-lg-block` toggling) is standard, solid Bootstrap practice — reusable as-is.

## 8. Reusable Sections

See §3 for the full inventory. Sections structurally sound enough to carry forward with re-skinning only: section-title module, footer shell, scroll-to-top, breadcrumb (needs multi-level extension), hover-caption gallery, WOW-driven card grid pattern.

## 9. Animations

- **WOW.js `fadeInUp`** staggered entrance — used consistently and tastefully across hero text, section titles, and card grids. Keep.
- **Odometer** (count-up numbers) — script is wired and functional, but **no live page currently uses it** (the one spot it was designed for, the About stats box on index.html, is commented out). Dormant feature, ready to activate with real numbers.
- **Slick carousel** — configured for 8 different sliders in `script.js`, **none of which exist in the current markup** (see §1). Entirely dead code today.
- Sticky header scroll-shrink, off-canvas slide, and search-popup slide are all functional and reusable, contingent on consolidating the two header variants (§3).

## 10. Icons

- FontAwesome 5 is loaded **twice** — both `all.min.css` (the full icon superset) and `fontawesome.min.css` (core) are linked on every page. `all.min.css` alone is a strict superset; the second load is pure waste.
- Only **20 distinct icon classes** are actually used across the entire site (mostly social icons, phone/envelope/map-pin, carets, plus/angle arrows) — a significant payload-vs-usage mismatch given the full FontAwesome library ships thousands of icons.
- No custom/SVG icon system exists. Burgenton's blueprint calls for custom trust-badge iconography (warranty shield, spare-parts gear, technical-support headset, dealer-network map, fast-delivery truck) that has no equivalent in the current icon setup.

## 11. Color Usage

- Effectively a **single-brand-color system**: one primary (orange) + black/white, used indiscriminately for both interactive elements (buttons, links) and decorative accents (icons, underlines) with no separation of "interactive" vs "accent" vs "status" color roles.
- Burgenton's brand (per the approved blueprint) is a **three-color system** — red, near-black, and safety yellow — plus white. The current CSS has no structure for more than one accent color working alongside black/white; this needs to be designed, not just re-colored.
- Contrast has not been formally tested, but the planned safety-yellow accent will need explicit AA contrast checking before use on text or small UI elements (yellow-on-white commonly fails WCAG AA) — flag for the design phase.

## 12. Accessibility

Findings ranked by severity:

1. **Focus indicator globally removed (WCAG 2.4.7 failure).** `style.css` line 142–148:
   ```css
   a:focus, .btn:focus, button:focss { outline: none; box-shadow: none; }
   ```
   No replacement focus style is provided anywhere. Keyboard users currently have no visible indication of what element is focused, site-wide. **This is the single highest-priority accessibility fix.**
2. **Icon-only controls have no accessible name.** The search toggle, hamburger menu, off-canvas close button, scroll-to-top button, and all social icon links are `<button>`/`<a>` wrapping only an `<i>` icon — no `aria-label`, no visually-hidden text. Screen reader users hear "button" or "link" with zero context. Only 4 `aria-*` attributes exist site-wide, all on the same navbar-toggler element (duplicated per page).
3. **No `<label>` elements on any form field.** Both the Home "messages" form and the Contact page form use placeholder-only inputs — placeholder text disappears on focus/input and isn't a reliable substitute for a label (WCAG 1.3.1 / 3.3.2).
4. **Generic, non-descriptive alt text.** All images do have an `alt` attribute (no empty `alt=""` found — good baseline), but many are low-value duplicates — e.g. `alt="all-service-image-3"` is reused verbatim across 15 visually distinct service cards in `services.html`. Technically present, not meaningfully descriptive.
5. **No skip-to-content link.**
6. Semantic landmark structure (`<header>`, `<main>`, `<footer>`, `<nav>`) is present and correct on every page — this part is solid.
7. **Broken favicon:** `about-us.html`, `services.html`, and `contact.html` all reference `assets/img/fevicon.png`, which **does not exist** in the project (404 on 3 of 4 pages). `index.html` references a different, valid path. Not an accessibility issue per se, but a real bug worth fixing in the same pass.

## 13. Performance Notes (bonus finding, not explicitly requested but relevant to migration cost)

- `assets/img/` totals 6.7MB, unoptimized — largest single file is a 544KB PNG hero background (`banner-background-2.png`); several photo assets sit at 150–260KB each with no evidence of compression or responsive `srcset` variants.
- Double FontAwesome load (§10) and 8 dead Slick carousel inits (§9) both add unnecessary parse/execution weight for zero functional benefit today.

---

## Reuse / Redesign / Remove / New — Decision Table

### Reuse as-is (sound, just needs re-skinning or reactivation)
- Bootstrap 5 grid + the existing 6-breakpoint structure
- WOW.js `fadeInUp` entrance pattern
- Sticky-header scroll-shrink behavior (once the two header variants are merged into one)
- Off-canvas mobile menu interaction pattern
- Scroll-to-top button
- Breadcrumb component (base pattern; needs multi-level extension, not a rebuild)
- Footer 3-column shell (re-content, not re-architect)
- `.section-title-one` eyebrow+heading module
- Hover-caption gallery pattern (fits Success Stories/Deliveries directly)
- Odometer counters (currently dormant — activate with real Burgenton numbers)

### Redesign (keep the concept, rebuild the implementation)
- **Header** — consolidate variant A/B into one component that supports the mega-menu (Products/Solutions/Support/Partners) and a persistent trust micro-bar
- **Buttons** — unify `.common-btn`/`.submit-btn`/`.border-btn`/`.dark-btn` into one documented Button component with variants and, critically, a real focus state
- **Service/feature card** → becomes the Product Card component; needs a slot for spec highlights/trust badges it doesn't currently have
- **About split section** → generalize into a reusable "Content + Media" module (needed repeatedly across About, Solutions, Support)
- **Contact form + info module** → rebuild as the multi-intent Contact router the blueprint specifies (Quote / Support / Dealer / General), which needs conditional fields, not just visual polish
- **Color system** — expand from one accent color to the full red/black/yellow brand system with defined interactive/accent/status roles
- **Typography** — replace hand-tuned per-breakpoint overrides with a real type scale (keep Rubik/Rajdhani)
- **Icon system** — resolve the double-load, right-size the icon set, add the custom trust-badge icons the content strategy requires

### Remove
- Duplicate FontAwesome stylesheet (`fontawesome.min.css`, redundant with `all.min.css`)
- ~165 dead CSS rule blocks for sections never used (banner-area-one, about-us-area-one, active-employes, news-area, blog-classic, blog-details, faq-area, get-updates, all-team, unused testimonial sliders)
- 8 dead Slick carousel initializations in `script.js`
- The losing header variant (pick one of A/B, delete the other)
- Broken `fevicon.png` reference — replace with a real favicon derived from `logo-3.png`
- The global `outline: none` focus-suppression rule
- Placeholder-only form fields (add real `<label>`s; placeholder becomes a supplementary hint, not a replacement)
- All hardcoded Oshone Geosurveys content: company name, phone numbers, address, email — every occurrence, across all 4 files

### New sections needed (do not exist in the template at all)
- Mega-menu navigation panels (Products / Solutions / Support / Partners)
- Persistent trust micro-bar (Warranty · Genuine Parts · Technical Support · Dealer Network · Fast Delivery)
- Product Detail modules: "Ideal For" list, Benefits checklist, "Why Choose Burgenton [X]" trust block, "Available Configurations", "Applications" tag list
- Solution page modules: "Challenges We Help Solve" + "Recommended Solutions" cross-link block
- Partnership application form (multi-field, partnership-type checkboxes)
- Support sub-page module (coverage list + benefits + CTA)
- Knowledge Centre hub + article/guide card + article template
- Video library / video card component (no video embed pattern exists anywhere today)
- Success story / case-study card (logo + result stat + testimonial)
- Live stats/counter strip (Odometer JS exists but no current section uses it)
- Multi-intent Contact router (Quote/Support/Dealer/General with conditional fields)
- 404 page, `sitemap.xml`, `robots.txt`

---

## Migration Plan

**Phase 0 — Foundation (do first, before any Burgenton content goes in)**
1. **Resolve the componentization gap.** This is the highest-leverage decision in the whole migration: at ~35–40 pages, hand-copying header/footer per file is not sustainable. Needs a decision (see Open Question below) before Phase 1 starts.
2. Prune dead CSS/JS: remove the ~165 unused style.css rule blocks, the 8 dead Slick inits, the duplicate FontAwesome load.
3. Fix the accessibility regressions that affect every page today: restore a visible focus style, add `aria-label`s to icon-only controls, add real form `<label>`s, add a skip-link.
4. Fix the broken favicon; replace with a Burgenton favicon derived from `logo-3.png`.
5. Establish real design tokens: extend `:root` to the red/black/yellow brand palette, define a spacing scale, define a type scale — replacing magic numbers project-wide.

**Phase 1 — Core template components**
- Merge the two header variants into one, built for the mega-menu + trust micro-bar
- Build a single Button component (variants: primary/secondary/outline; states include focus)
- Rebuild Product Card, Content+Media, and Contact modules per the redesign notes above
- Rebuild the footer to the blueprint's 4-column structure

**Phase 2 — Priority page templates** (matches build order already agreed in the blueprint)
- Home
- Product Detail template, applied to the first 3–4 flagship products
- Support hub + subpages
- Contact (multi-intent router)
- About

**Phase 3 — Expansion**
- Remaining product pages (construction + agro-processing)
- Solutions pages
- Partners pages + application form

**Phase 4 — Content/SEO layer**
- Success Stories
- Knowledge Centre hub + article/guide templates
- `sitemap.xml`, `robots.txt`, structured data, custom 404

**Phase 5 — QA pass**
- Cross-page consistency check (this is the real test of whether Phase 0's componentization decision worked)
- Re-run the accessibility checks from §12 against the finished templates
- Responsive QA across all 6 breakpoints
- Image compression / `srcset` pass (currently 6.7MB unoptimized)

---

## Open Question Before Implementation Starts

The template currently has **no way to share markup between pages** — every new page means copy-pasting header/footer/nav by hand. Given Burgenton's site is ~10x larger than what this template was built for, I'd recommend resolving this before writing a single Burgenton page, rather than discovering the pain partway through. Options, roughly in order of how much they change your current workflow:

1. **Static site generator** (e.g. Eleventy/11ty or Astro) — real templating, reusable components/partials, generates plain HTML/CSS/JS at the end so hosting stays exactly as simple as today. Bigger upfront setup, much cheaper per-page cost afterward.
2. **Build-time include step** (a small script or tool that stitches shared header/footer/nav partials into static HTML at build time) — lighter lift than a full SSG, still eliminates copy-paste drift.
3. **Keep hand-copied HTML, add process discipline** — fastest to start, but the maintenance cost compounds with every one of the ~35–40 pages; a nav change means editing every file by hand, and drift (like the current two-header-variant bug) will keep happening.

No code will change until you weigh in here and confirm the migration plan overall.
