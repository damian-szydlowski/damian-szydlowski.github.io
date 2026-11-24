# Damian Szydlowski — personal portfolio

A mobile-focused portfolio for engineering, work, education, and photography.
Both pages share a warm dark design: near-black, warm off-white, restrained
orange accents, bold headings, and generous spacing. Both pages are plain
HTML, CSS, and JavaScript, with a React/TypeScript timeline. Background adds a scroll-driven horizontal timeline;
both pages use gentle mouse-wheel smoothing with native touch scrolling.

## Preview the site

In VS Code, choose **Terminal → New Terminal**. Make sure the terminal is in this
project folder (the folder containing `index.html`), then run:

```powershell
npm.cmd ci
npm.cmd run dev
```

`npm.cmd ci` installs the pinned dependencies; run it once on a new checkout or
after the package lock changes. `dev` checks and builds the React timeline,
then starts the local server. Saving a React component or its Tailwind source
rebuilds the timeline and reloads the preview automatically.

Open **http://127.0.0.1:4173** in your browser. The terminal prints the same
address when the server is ready. Keep that terminal running while you work;
press **Ctrl+C** to stop it. Preview tabs reload automatically when you save
website files.

`npm.cmd` is the Windows form of `npm` and avoids PowerShell script-policy issues.
On macOS/Linux, use `npm` instead. Node.js 22.15 or later is recommended. The
preview server serves static files, and development uses the installed timeline
build tools. Opening the HTML file directly by double-clicking it is insufficient:
the browser needs the local server to load JavaScript modules correctly.

To view on your own phone on the same trusted Wi-Fi network:

```powershell
npm.cmd run dev -- --host 0.0.0.0
```

Use `ipconfig` to find your computer's Wi-Fi IPv4 address, then visit
`http://YOUR-COMPUTER-IP:4173` on the phone. Windows may request private-network
firewall access. Copy-to-clipboard can be unavailable over this plain HTTP
connection; the visible email link still works. Stop the server when finished.
This is a development server, not public hosting.

## What controls what?

| File or folder | Purpose |
| --- | --- |
| `index.html` | Landing, Me, Background timeline, Projects, Photography previews, and Connect |
| `photography.html` | Photography introduction, about/equipment text, email inquiry |
| `styles/styles.css` | Colours, typography, spacing, mobile layouts, and animations |
| `scripts/content.js` | Project records and photographs; array order controls display order |
| `scripts/main.js` | Mobile navigation, filters, project overlays, photography previews/viewer, CAD loading, small interactions |
| `scripts/smooth-scroll.js` | Shared wheel smoothing, anchor timing, reduced-motion handling, and dialog integration |
| `components/ui/timeline.tsx` | Horizontal React timeline, integrated heading, scroll timing, and whole-block fades |
| `components/timeline-entry.tsx` | Connects HTML timeline content to React and handles accessibility fallbacks |
| `components/ui/focus-pull-carousel.tsx`, `components/photography-entry.tsx` | Supplied focus-pull photo carousel, pause control, and fallback integration |
| `styles/timeline-input.css` | Tailwind source for the React component, without a site-wide CSS reset |
| `assets/vendor/timeline.js`, `styles/timeline.css` | Generated browser files; rebuild rather than editing these |
| `components.json`, `tsconfig.json`, `lib/utils.ts` | shadcn-style component paths, TypeScript, and the shared class-name helper |
| `assets/images/` | Responsive hero artwork and optimised copies of your real photos, once added |
| `assets/placeholders/` | Original SVG artwork that clearly stands in for missing content |
| `assets/fonts/`, `assets/vendor/` | Locally hosted fonts, Lenis smoothing, timeline bundle and optional 3D viewer, with licences |
| `AGENTS.md` | Project priorities and instructions for AI assistants |

**HTML** describes the content and its structure. **CSS** controls how that
content looks and adapts to screen sizes. **JavaScript** adds behaviour, such as
switching a filter or opening a project. A **module** is a JavaScript file that
can share named values with another file; here, the content module keeps your
portfolio records separate from interaction code.

The two pages are the public interface. There is no database, server API,
account system, or automatic GitHub import. Browser interactions use your local
content records. No analytics or tracking scripts are included.

## Current content status

The preview includes six **labelled project placeholders** and six **labelled
gallery artwork placeholders**. These are layout examples, not real project
claims or photographs. The home image is a simple photo placeholder, explicitly
labelled until a real photo is added. The timeline contains four undated
placeholder entries and a closing “And much more to come!” point. No timeline
dates or achievements have been invented.

Your public email is `damianszydlowski1000@gmail.com`. Contact information lives
in the two HTML files; the copy button reads its email from `data-email`.

Before public release, replace the portrait, project records, gallery images,
role/company details, education details, and equipment/about text. The original
`assets/profile.jpg` and `assets/resume.pdf` are empty files; the site deliberately
does not link to them. Replace the PDF with a real file before adding a résumé
link. Missing optional project links and models are simply omitted.

Placeholder notices disappear automatically when no corresponding content
records have `placeholder: true`. The portrait and biography notices are HTML
and should be edited when that material is ready. Do not remove the placeholder
flag merely to make unfinished material appear complete.

## Design and page layout

The visual direction takes inspiration from [Sunny Patel's portfolio](https://www.sunnypatel.net/):
near-black backgrounds, warm off-white text, orange accents, compact numbered
navigation, and generous spacing. Geist supplies the bold headings; Hanken
Grotesk supplies readable body text. Both fonts are hosted locally.

The homepage order is **Landing → Me → Background → Projects → Photography →
Connect**. The landing places Damian's name and introduction over a subtle,
orange halftone sky. It is decorative artwork, not a completed engineering
project. The React/WebGL component is in
`components/ui/halftone-nebula.tsx`; `mountHeroNebula` in
`components/timeline-entry.tsx` chooses the orange palette, disables pointer
interaction, and limits rendering resolution for mobile devices. The HTML
host and its dark text-contrast overlay are in `index.html` and
`styles/styles.css`. If WebGL is unavailable, the component shows a still
orange gradient; without JavaScript the hero remains readable on its plain dark
background.

Both pages use locally hosted Lenis for gentle mouse-wheel smoothing. A fast
fling settles at the next main section heading; a little extra wheel scrolling
adds gentle resistance before you continue. Unhurried scrolling stays free.
The landing has its own pause at the natural page top, with a small 16px gap
below the header. The large top band and fixed minimum height are removed in
`styles/styles.css`, so the same compact spacing appears on first load and
when returning home.
The timeline also pauses with “And much more to come!” fully visible before
you continue to Projects. This checkpoint uses the timeline's measured end
position, including after resizing. The long timeline and gallery remain
scrollable within their sections.
Touch and keyboard scrolling stay
native; reduced-motion visitors and browsers where the enhancement cannot load
use ordinary scrolling. Anchor links ease into position below the header and
keep their URL/history and keyboard focus. Project and photo dialogs pause the
page smoothing while their own content scrolls normally.

Tune wheel smoothing with `lerp` in `scripts/smooth-scroll.js` (currently `0.1`;
a higher value settles more quickly), and anchor timing with `duration`
(currently `0.85` seconds).
Section pause settings are grouped in `sectionPause`: `extraScroll` controls
the extra wheel effort (140px of input), `resistance` controls the gentle
movement during that effort (0.24), and `fastInput` sets the fling threshold
(180px). Anchor navigation bypasses these pauses.

Lenis is a small additional development dependency;
the browser loads its minified local file rather than contacting a CDN. After
updating its version, run `npm.cmd run prepare:vendor` to regenerate the local
JavaScript, CSS, and licence copy.

Background renders the adapted React timeline, with its label and
heading on the left, large borderless text, two staggered rows, and whole-block
fades. There is no separate tagline, reference image, or list-view toggle.
The panel settles below the header and pauses briefly before scrolling moves
the timeline sideways; scrolling back reverses the motion. Continue to projects
stays at the bottom right. Short entrance transitions enhance visible content and
are disabled by reduced-motion preferences. The mobile Menu button expands
the section links; Escape closes it and returns focus to the button. Without
JavaScript, navigation links remain visible.

Photography has its own introduction, collection, about section, and inquiry
area. Both pages use matching navigation, buttons, and footers.

- Edit page structure and personal text in `index.html` and `photography.html`.
- Edit colours, type, and layouts in `styles/styles.css`. The variables at the
  top (called **design tokens**) set the shared palette for both pages.
- Edit projects and photographs in `scripts/content.js`.
- Navigation, browsing, dialogs, image handling, and entrance transitions live
  in `scripts/main.js`. Project models load only after the visitor asks to view
  one; the homepage illustration is a regular image.

The old illustrated backgrounds remain in assets for reference, but neither
page loads them. The first real photo marked `featured: true` appears in the photography
introduction; until one exists, the first featured placeholder is used. With no
featured records, a labelled empty state appears. The homepage uses the supplied
`FocusPullCarousel` React component. Its centre photo is sharp; neighbouring
photos shrink, soften, and fade as the strip scrolls. It prefers real featured
photographs, other real photos, and then labelled placeholders. Swipe, drag,
use the arrow buttons, or focus the carousel and press Left/Right or Home/End.
Every photo opens the collection in `photography.html`. The gallery is borderless,
with arrow and autoplay controls at the top right, beside the smaller heading
on desktop, and no separate Explore button.
The desktop gallery is wider than the text column, with a central photo up to
679px wide. Image size follows available width; it is not capped by viewport
height. Shorter windows scroll naturally to show the whole photo.
Photo titles, captions, counters, and the progress bar are hidden in this showcase.
Hovering or focusing an image gently enlarges it. Below the Photography heading,
“Featured photography, click to view more” replaces the old placeholder note;
the orange “click to view more” links to the collection. Images have no hover popup.

The carousel starts near the viewport, advances every three seconds, and waits
while offscreen, in a hidden tab, hovered, focused, or being interacted with.
A Play/Pause button controls autoplay. After the last image it returns directly
to the first, without scrolling back through the full strip. The photography
wheel stop and anchor links align the section label 12px below the sticky header.
Reduced motion, enlarged text,
or a failed component use three ordinary preview links instead; those links open
the collection. A static Photography details link also works
without JavaScript. Replace images in `scripts/content.js`; change blur,
autoplay timing, or image dimensions through the component props in
`components/photography-entry.tsx`. Styling lives in `styles/styles.css`.

### Footer

Both pages end with the interactive dot-matrix "damian" artwork, copyright,
and "Made with lots of white Monster and Red Bull." Navigation stays in the
header. Edit the artwork's text in `components/footer-entry.tsx` and its
fallback in `index.html` and `photography.html`; sizing lives in
`styles/styles.css`. Reduced motion keeps the dots still, and native HTML
remains available if the artwork cannot load.

### Replace the personal photo

Prepare the image with the helper below. In `index.html`, find
the figure with `class="portrait-frame media-frame"`, replace its image, and update
the caption. For example (replace these sample values with your actual file):

```html
<img src="assets/images/damian-960.webp"
     srcset="assets/images/damian-480.webp 480w, assets/images/damian-960.webp 960w"
     sizes="(max-width: 639px) calc(100vw - 40px), 510px"
     width="1200" height="900"
     alt="Describe your actual photo here" loading="lazy">
```

Width and height describe the image's proportions, not its displayed size. CSS
fits it to the available space without stretching or cropping it. Use the real
dimensions for square or landscape photos; no layout change is needed. Remove
“Photo to come” when the real image is in place.

### Add education or work to the timeline

In `index.html`, find `<ol class="timeline">` inside `#timeline-fallback`. Copy a complete existing
`<li class="timeline-entry">` so the connecting node and layout stay in
place. Replace the text in its `<summary>` (the always-visible part) and its
`.timeline-detail` (the part revealed when clicked):

```html
<details class="timeline-content">
  <summary class="timeline-summary">
    <span class="timeline-date mono">Your date range</span>
    <span class="eyebrow">Work or Education</span>
    <span class="timeline-title">Your role or programme</span>
    <span class="timeline-toggle"><span>More details</span>
      <span class="timeline-toggle-mark" aria-hidden="true">+</span>
    </span>
  </summary>
  <div class="timeline-detail">
    <p class="timeline-organization">Your organisation or institution</p>
    <p>A brief description of your work or studies.</p>
  </div>
</details>
```

Put dated entries newest first in the HTML; the site does not invent dates or
reorder your content. The React entry point reads each entry's date, category,
title, and organisation from this list. This keeps one place to edit your
timeline content. The source component's sample storyline remains available
only in its unmounted demo; the homepage displays your own labelled entries.

The animated view adapts the supplied `timeline.tsx`: two staggered rows, fine
orange stems and dots, large text, and an integrated heading on the left.
CSS keeps the panel below the header. The opening shows Background with the
orange starting dot to its right, centered beside the heading. After a short pause, scrolling draws the line
outward while the heading holds still, then moves sideways and grows each
branch as the line reaches it. Entry text fades in after its branch begins
opening. Scrolling back retracts the line and branches and fades the text out.
The line finishes at an orange dot, with “And much more to come!” directly to
its right and vertically centred on the line, without a vertical branch.
The message stays on one line, ending 20px from the screen's right edge, with
responsive text sizing for phones. There is a pause before normal scrolling
continues. Travel is measured from the actual entries, so changing their count
does not overshoot the last entry. Text fades as complete blocks over 0.45 seconds
without slicing or shifting its lines; no text masks are used.
The opening draw distance is controlled by `opening`, and the opening and
closing pauses by `hold` and `endHold` in
`components/ui/timeline.tsx`; `duration` in `components/timeline-entry.tsx`
controls the fade time. `components/timeline-demo.tsx` contains a separate demo.

Reduced-motion preferences, text enlarged beyond a 20-pixel base size, blocked
JavaScript, or a failed bundle automatically show the readable list, with native
expandable details and keyboard controls. The
animated component includes a chronological screen-reader list. Normal page
scrolling and the Continue to projects link remain available.

React, TypeScript, and Tailwind CSS support the timeline and photo carousel; GSAP
and ScrollTrigger drive the timeline.
`components/ui/` is the reusable UI folder; the `@/` aliases and `components.json`
make the project structure compatible with the supplied shadcn-style imports.
The animation and layout source is `components/ui/timeline.tsx`; the homepage
configuration is in `components/timeline-entry.tsx`. Both React components share
one locally bundled runtime. Tailwind supplies their utilities without a CSS
reset that would alter the rest of the website. No new dependencies are needed
for the photo carousel.

After editing outside the running development server, run:

```powershell
npm.cmd run build
```

This checks TypeScript and generates `assets/vendor/timeline.js` plus
`styles/timeline.css`. These generated files are served locally and can be
published with the static site. Keep `timeline.js.LEGAL.txt` beside the bundle.
No runtime CDN requests are required. The old `timeline-reference-*.webp` assets
are retained in `assets/images/` but are no longer displayed or requested.

## Prepare photographs

Install the pinned development tools once:

```powershell
npm.cmd ci
```

Create `assets/originals/` and put JPG, PNG, WebP, TIFF, or AVIF exports there.
Keep camera RAW files in your normal photo archive. Originals are ignored by
Git, and the local server does not serve that directory.

```powershell
npm.cmd run images
```

This makes separate WebP files in `assets/images/` at widths up to 480, 960,
1600, and 2400 pixels, preserving the aspect ratio and never enlarging a small
original. It corrects image orientation and strips EXIF metadata from the web
copies. Original files remain untouched. It prints the processed files and
writes `assets/images/image-manifest.json` with ready-to-copy image records.

To use different folders:

```powershell
npm.cmd run images -- --input "C:\Photos\Portfolio exports" --output assets/images
```

Use unique, simple filenames such as `portrait-window.jpg`. The helper makes
consistent filenames and rejects duplicate names rather than mixing up images.
Re-running it replaces generated variants of the same name; stale variants of
removed originals are not automatically deleted.

The browser picks an appropriate size from `variants`. This is a **responsive
image**: a small phone downloads a smaller file than a large screen. Enlarged
images load only when the viewer opens. WebP compression defaults to quality 85;
visually compare fine detail and colour with your originals before release.

## Add a photograph or category

Copy an image record from the generated manifest, add a meaningful `alt`
description, then add a record to the `photos` array in `scripts/content.js`:

```javascript
{
  id: "portrait-window", // Unique lowercase ID; use hyphens instead of spaces.
  title: "Window light",
  categories: ["portraits"],
  featured: true, // Eligible for the photography page introduction.
  placeholder: false,
  caption: "Your own caption, or an empty string.",
  image: {
    src: "assets/images/portrait-window-960.webp",
    width: 3000,
    height: 4000,
    alt: "Describe the actual subject, composition, and meaningful details.",
    variants: [
      { src: "assets/images/portrait-window-480.webp", width: 480 },
      { src: "assets/images/portrait-window-960.webp", width: 960 },
      { src: "assets/images/portrait-window-1600.webp", width: 1600 },
      { src: "assets/images/portrait-window-2400.webp", width: 2400 },
    ],
  },
}
```

Use the actual dimensions and paths from the manifest, not these example
numbers. Alternative text describes the image for people who cannot see it;
the caption can add its story. A photo can have more than one category.
The gallery preserves square, landscape, and portrait proportions, using one
column below 640 pixels, two below 1000, and three on larger screens.

To add a category, add a label to `photoCategories`, for example
`landscapes: "Landscapes"`, and include `"landscapes"` in a photo's `categories`.
Only categories used by at least one photograph appear as filter buttons.

## Add a project

Projects use two large cards per row from 640px upward, and one per row on
phones. Cards fade and grow gently into view, then increase slightly in size
on hover or keyboard focus. Reduced-motion visitors see stationary cards.
Adjust the grid and animation in `styles/styles.css`; edit the six starting
records in `scripts/content.js`. Filters and project dialogs work as before.

Replace a placeholder or add a record to the `projects` array. This is a template
to fill with real information, not suggested biographical content:

```javascript
{
  id: "your-project-id",
  title: "Your project title",
  context: "personal", // "work", "school", or "personal"
  organization: "", // Company, school/course, or empty string.
  date: "", // Optional date you want visitors to see.
  summary: "One short sentence about the project.",
  tags: ["CAD", "Prototyping"], // Use the actual tools or technologies.
  placeholder: false,
  cover: { /* Paste a complete image record from the manifest here. */ },
  overview: "What you set out to do and why.",
  contribution: "What you personally contributed; credit collaborators.",
  approach: "Important design choices, tools, and iterations.",
  outcome: "Real outcomes, lessons, or next steps.",
  images: [], // Additional image records; each can also have a caption.
  links: [], // Example: { label: "View on GitHub", href: "https://github.com/your-account/your-repo" }
  model: null,
}
```

Keep one context label per project. Technology tags are descriptive; context
buttons filter the grid. Opening a project creates a **modal**: an overlay that
keeps keyboard focus inside until it closes. Close, Escape, or clicking outside
the desktop panel returns visitors to their previous filter and page position.

## Add an interactive CAD model

Export or convert the CAD geometry to an **uncompressed GLB**, a single web-ready
3D file. Native CAD formats such as STEP or SLDPRT do not load directly. The
conversion steps depend on your CAD software; ask the AI for help with the
specific software and file when you are ready. Simplify geometry and textures
for mobile use; aim for a few megabytes rather than a full engineering assembly.

Put the file in `assets/models/` and give the project a `model` value:

```javascript
model: {
  src: "assets/models/your-design.glb",
  alt: "A clear description of the actual 3D design.",
  // Optional: poster: { ...a complete image record... }
}
```

The cover image is used as the poster when no separate poster is supplied.
Opening a project does not download its 3D model. Pressing **Explore 3D model**
loads the local viewer and GLB. If loading or graphics support fails, the poster,
project story, and retry control remain usable. Closing removes the viewer.

The locally stored viewer is pinned to **model-viewer 4.4.0**. Use uncompressed
GLB files initially: Draco/KTX-compressed files may need additional decoders
and configuration. No AR integration is enabled. After deliberately upgrading
the package, refresh the checked-in vendor assets with:

```powershell
npm.cmd run prepare:vendor
```

Geist and Hanken Grotesk are also hosted locally, with their Open Font Licences. The viewer's
Apache licence is stored alongside it. Normal page viewing makes no font/CDN
requests. Preserve these licences when publishing.

## Verification

```powershell
npm.cmd run check
npm.cmd test
npm.cmd run test:images
```

`check` verifies content IDs, real asset paths, image metadata, contact links,
and JavaScript syntax. It reports unfinished placeholder content separately.
`test` runs browser interaction checks using the installed Google Chrome in
headless mode (no visible window) and starts/stops a temporary preview server
when needed. Tests cover 320/390/768/1440-pixel layouts, filters, dialogs, touch
gestures, keyboard focus, image failures, model loading, and motion preferences.
`test:images` checks that the image helper preserves originals, corrects image
orientation, strips EXIF data, and never enlarges small files.

To use installed Microsoft Edge from PowerShell instead:

```powershell
$env:BROWSER_CHANNEL = "msedge"
npm.cmd test
Remove-Item Env:BROWSER_CHANNEL
```

Device emulation is not a substitute for a real phone check. Before launch,
also review on an actual iPhone/Safari and Android device, with browser zoom,
slow connections, and your real full-size images/models. Automated fixtures
test the viewer mechanism, not the performance of a future CAD assembly.

## Later publication

Hosting has intentionally not been configured. The current deliverable is a
local preview. Once content is complete, choose static hosting and publish only
the two HTML pages, styles, browser scripts, and required public assets. Exclude
original photos, empty files, test artifacts, development tools, and dependencies.
Add canonical URLs and social preview image metadata when a real public address
and approved preview image are available. No address or imagery is invented now.

For future AI work, read `AGENTS.md`, make focused changes, explain unfamiliar
concepts, and distinguish verified behaviour from checks that were unavailable.
