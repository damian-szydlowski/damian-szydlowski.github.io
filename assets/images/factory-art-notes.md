# Factory hero artwork

Generated with the built-in image-generation tool, then converted into actual
hexadecimal glyphs by the local Canvas2D renderer in `scripts/factory-art.js`.
Decorative concept artwork; this does not represent Damian's project or employer.

The flat source is `factory-simple-source-960.webp` (960px). Exported stills are
`factory-ascii-v2-480.webp` and `factory-ascii-v2-768.webp`. They are used before
Canvas is ready and when JavaScript or Canvas cannot run. Earlier assets remain
available for rollback and are not loaded by the current hero.

The renderer implements the selected hexdump look, rather than a full editor
with every primitive in the reference recipe. It uses average cell luminance,
edge emphasis, 93% coverage, warm palette mapping, contrast and orange overlay,
restrained bloom/scanlines/vignette, and gentle character flicker. Heavy grain,
chromatic separation and glitch are disabled to preserve clear shapes. No
external image service, animation dependency or API runs in the browser.

## Final generation prompt

Create a VERY SIMPLE flat isometric vector-style illustration to be converted into ASCII characters. Square composition, solid uniform near-black #0b0d0f background. A short broad charcoal conveyor belt runs diagonally from lower left toward upper right. Exactly TWO simplified articulated industrial robot arms, one on each side, with burnt-orange #dc653a segments and large warm-off-white #ede8dc circular joints. The arms reach toward one plain off-white cube on the belt; two additional spaced off-white cubes ride the conveyor. Chunky geometric shapes, smooth SOLID color fills, maximum three tones on any object, crisp strong silhouettes, restrained isometric depth like a simple editorial infographic. An uncluttered miniature automated assembly line occupying central 80% of image, all objects fully visible. Large clear gaps between shapes, plenty of completely empty dark background; easy to recognize at thumbnail size. No humans or humanoid robots. No factory interior, machinery enclosure, frame, walls, lighting rigs, wires, bolts, gears, circuit patterns, reflections, texture, gradients, floor, platform, labels, text, logos, ASCII, glyphs, grid, watermark, borders or UI. Do not make a realistic 3D render. It must look like a simple flat isometric illustration with orange robot arms and cream blocks, with clean solid surfaces and very low visual complexity.

## Adjustments

Change the palette, cell size and flicker settings in `factoryRecipe`. Keep the
768px logical size divisible by the cell size. The exported fallback should be
regenerated from the paused canvas after visual changes. Render at reduced
motion, export `canvas.toDataURL()`, then compress to the two WebP sizes using
the existing Sharp dependency. Preserve the natural square proportions.
