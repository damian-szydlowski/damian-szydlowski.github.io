# Project guidance for AI coding assistants

## Purpose and audience

This repository is Damian Szydlowski's personal portfolio website. It brings
together education, engineering projects, professional work, and photography.
Keep all four areas in mind as the website grows; do not assume it is only an
engineering resume or only a photography gallery.

Visitors should be able to understand Damian's background, explore relevant
work, and find a clear way to get in touch. Most visitors interested in
photography are expected to arrive on mobile devices. An excellent mobile
experience is a core requirement.

## Agreed visual direction

Use the warm dark visual direction inspired by sunnypatel.net: near-black
`#0b0d0f`, warm off-white `#ede8dc`, restrained orange `#dc653a`, generous
spacing, and subtle borders. Use locally hosted Geist headings, Hanken Grotesk
body text, and monospace labels. Keep a 1120px content width and comfortable
20px phone gutters. Use one shared styling system across both pages.

Keep the homepage order: Landing, Me, Background, Projects, Photography,
Connect. The landing pairs Damian's two-line name with a restrained, orange
halftone sky effect behind the existing copy. Keep the shader decorative and
subordinate to the text, with a dark gradient behind the name for contrast.
Use a static dark fallback and respect reduced-motion preferences. This is
decorative artwork, not a real project. Preserve the compact landing layout
when revising the visual.
Aim for complete sections within one desktop screen as navigation becomes
more section-oriented. Start with a compact landing layout and a higher,
right-aligned Meet Damian link; omit its Engineering & photography footer label.
Allow natural overflow on small screens or enlarged text instead of clipping.
Me contains the biography and portrait. Background uses the supplied React
component in `components/ui/timeline.tsx`, with large borderless text, two
staggered rows, and orange stems/dots. Put the 02 / Background label and
Background heading at the left of the timeline, without a separate tagline,
image lead-in, or list-view toggle. Keep Continue to projects at the bottom
right of the sticky view. Wait until the panel settles below the header, with
a short pause, before the timeline opens. Place the orange origin dot to the
right of Background, vertically centered beside the heading. Draw the line
rightward from this dot before moving sideways,
then grow the alternating stems and reveal entries as the line reaches them.
Finish the horizontal line with an orange dot and “And much more to come!”
immediately to its right, vertically centred on the line. This closing point
has no vertical branch. Keep the message on one line, ending 20px from the
right edge, and size it to remain readable on phones.
Reverse the drawing when scrolling back. Use whole-block opacity fades for text
instead of split text, moving text lines, or masks. Do not substitute boxed expandable cards
in the animated view. Timeline content comes from the HTML list in `index.html`.
Keep one accessible reading order; reduced motion, enlarged text, unavailable
JavaScript, or a failed bundle automatically use the native expandable list.
Projects use six labelled placeholders in a large two-column grid, with one
column on phones. Give cards a subtle entrance and slight growth on hover or
keyboard focus, respecting reduced motion. Retain filters and accessible detail dialogs.
Photography uses the supplied focus-pull carousel in
`components/ui/focus-pull-carousel.tsx`: a sharp central image with smaller,
softer neighbours. Support native horizontal swiping, mouse dragging, arrows,
and keyboard navigation. Every image opens `photography.html#collection`.
Keep the gallery borderless, with pause and arrow controls above the images at
the top right, alongside the compact heading on desktop and above the photos
on smaller screens. Omit the extra Explore photography button. Prioritize large,
prominent photos: use a wider gallery on desktop and allow the main image to
reach 679px wide. Do not shrink photos based on viewport height; use ordinary
vertical scrolling when the section needs more space. Omit visible photo titles,
captions, counters, progress bars, and hover popups. Keep slight image growth on
hover or keyboard focus. Use a simple left-aligned Photography heading with the
orange full stop and numbered section label. Below the heading, show
“Featured photography, click to view more”, with “click to view more” in orange
as a link to the full collection.
Use the existing photo records, prefer real images, and label placeholder artwork.
Include a pause control, stop autoplay offscreen or during interaction, and use three ordinary preview
links for reduced motion, enlarged text, or an unavailable component.
Advance the photography slideshow every three seconds and return directly to
the first image after the last. Align its soft wheel stop and anchor landing
so the section label sits 12px below the sticky header, preserving the approved
heading and photo arrangement.
Connect provides the actual email address, email action, and copy button.
Preserve natural image proportions and clear placeholder labels.

Both pages finish with the interactive dot-matrix "damian" artwork, copyright,
and "Made with lots of white Monster and Red Bull." Keep navigation in the
header; omit repeated footer links and contact columns. Put copyright and the
drink message above the divider, with the dot artwork below it. Preserve the static
HTML fallback and reduced-motion support.

Use a compact sticky header, numbered section links, an accessible mobile
menu, and the standard browser cursor. Use lightly smoothed mouse-wheel
scrolling across both pages with locally hosted Lenis, synchronized with the
timeline. Fast mouse-wheel flings settle at the next main section heading;
keep the landing pause at the natural page top. Use a compact 16px gap below
the header, without a large top band or fixed minimum hero height. Keep that
spacing on first load, home links, and returning upward. Do not simulate
removing that gap by scrolling past it. Also pause at the completed timeline with its closing message fully visible,
before releasing into Projects. Derive this checkpoint from the animation's
measured end position so it remains correct after resizing.
Apply a little resistance to further wheel input before continuing. Keep slow
scrolling free and preserve natural touch/keyboard scrolling, working
anchors and history, and native scrolling inside dialogs. Disable smoothing
for reduced-motion visitors; fall back to browser scrolling if it cannot load.
Keep the section pauses soft; do not add mandatory CSS snapping, first-gesture
transitions, animated shaders, circuit
dividers, or letter-by-letter name entrances. Short entrance transitions may
enhance visible content; respect reduced motion and keep the content usable
without animation or JavaScript. React, GSAP, and ScrollTrigger are
bundled locally for the timeline; preserve generated licence notices.

## Help the owner learn

The owner has little to no experience programming websites. Be a capable
collaborator and a patient teacher:

- Explain relevant concepts in plain language, with more depth when introducing
  something new. Define technical terms when first using them.
- Connect explanations to this website. For example, explain what a CSS layout
  rule changes on the page and why that helps on a phone.
- For meaningful changes, describe what changed, why it was needed, and which
  files control it. Explain how the owner can preview and adjust the result.
- When commands are needed, say where to run them, what they do, and what a
  successful result looks like. Do not assume familiarity with terminal tools.
- Use short examples when helpful, without turning every small edit into a
  tutorial. Provide enough understanding for the owner to maintain the site.
- Make reasonable choices for routine implementation details and keep working.
  Ask focused questions when missing content or a significant design decision
  would materially change the result.

## Mobile experience and accessibility

- Design for small screens first, then adapt layouts for tablets and desktops.
  Preserve a polished desktop experience too.
- Keep navigation, galleries, and contact actions easy to use by touch. Do not
  make essential information or controls depend on hovering with a mouse.
- Use readable text, comfortable spacing, and generously sized tap targets.
  Avoid horizontal page scrolling, clipped content, and overlapping controls.
- Use semantic HTML, meaningful headings, descriptive link text, accessible
  control labels, visible keyboard focus, and sufficient colour contrast.
- Support keyboard navigation and reduced-motion preferences. Keep content
  usable when visitors zoom in.

## Photography and performance

- Let the photographs remain the focus. Preserve aspect ratios and use
  deliberate cropping; do not distort images or overwrite original assets.
- Serve appropriately sized, compressed images. Use responsive image sources
  when useful and defer loading images below the initial view. Keep prominent
  first-view images available promptly.
- Reserve image space to prevent the page jumping while images load. Provide
  useful alternative text for meaningful images and empty alt text for purely
  decorative ones.
- Galleries and any image viewers must work with touch and keyboard input,
  provide clear controls, and remain comfortable on a small screen.
- Keep pages fast on mobile connections. Avoid unnecessary large downloads,
  libraries, animations, and third-party scripts.

## Implementation and content

- Inspect the relevant existing files before editing. The site uses static
  HTML, CSS, and JavaScript, with a React/TypeScript timeline and photo carousel. Reusable React
  UI belongs in `components/ui/`; `components.json` and `tsconfig.json` define
  shadcn-style paths. Tailwind source is `styles/timeline-input.css`. Run
  `npm run build` to generate `assets/vendor/timeline.js` and
  `styles/timeline.css`; do not edit generated files. `npm run dev` builds at
  startup and rebuilds React/Tailwind source changes automatically.
- Keep code readable and changes focused. Introduce frameworks, dependencies,
  or build tools only for a concrete benefit, and explain their maintenance
  implications to the owner.
- Follow established conventions and preserve unrelated work. Comment on
  non-obvious decisions rather than narrating every line of code.
- Use the owner's actual material. Do not invent qualifications, employment,
  project outcomes, clients, testimonials, photography details, or contact
  information. Clearly identify placeholders and request missing facts when
  they are necessary.
- Keep credentials and private information out of public website files.
- Update relevant documentation when setup or preview steps change. Update
  this guidance when the owner explicitly changes project priorities; avoid
  filling it with temporary task notes.

## Verification and handoff

- Match verification to the change. Documentation-only edits need a review of
  the text; interactive website changes need relevant behaviour checks.
- For layout or interaction changes, check narrow phone widths (approximately
  320-390 px), tablet, and desktop sizes when browser tools are available.
  Check navigation, image sizing, overflow, keyboard access, and contact links
  where affected. Use a real mobile device when available.
- Run relevant existing checks, and check for broken paths or browser errors
  when applicable. Do not introduce an elaborate test setup for a small edit.
- Report what was actually verified, what could not be verified, and any
  remaining issue. Never imply that a browser or device check happened if it
  did not.
- Finish with a clear explanation of the result and any steps the owner needs
  to preview or use it.
