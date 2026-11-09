---
name: Obědy Olomouc
description: Today's lunch in Olomouc as a noon departure board and a printed timetable.
colors:
  sheet: "#ffffff"
  frame: "#e9ecef"
  frame-2: "#dde1e5"
  ink: "#141518"
  ink-press: "#2a2c30"
  ink-2: "#4a4f57"
  ink-3: "#6b717a"
  rule: "#c9ced4"
  board: "#121315"
  board-rule: "#2c2f33"
  board-meta: "#c9cdd3"
  led: "#ffb21a"
  led-text: "#ffd27a"
  route: "#d42a1f"
  route-ink: "#b3221a"
  go: "#1d7a49"
  mid: "#b86e00"
typography:
  display:
    fontFamily: "Barlow Condensed, Barlow, sans-serif"
    fontSize: "clamp(2.3rem, 6vw, 3.75rem)"
    fontWeight: 700
    lineHeight: 0.95
    letterSpacing: "-0.015em"
  headline:
    fontFamily: "Barlow Condensed, Barlow, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Barlow Condensed, Barlow, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  numeral:
    fontFamily: "Barlow Condensed, Barlow, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.01em"
    fontFeature: "\"tnum\" 1"
  led-head:
    fontFamily: "Doto, ui-monospace, monospace"
    fontSize: "1.6rem"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "0.01em"
    fontFeature: "\"tnum\" 1"
    fontVariation: "\"ROND\" 100"
  led-row:
    fontFamily: "Doto, ui-monospace, monospace"
    fontSize: "1.15rem"
    fontWeight: 900
    lineHeight: 1.3
    letterSpacing: "0.01em"
    fontFeature: "\"tnum\" 1"
    fontVariation: "\"ROND\" 100"
  body:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  body-strong:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "1.05rem"
    fontWeight: 600
    lineHeight: 1.35
  label:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.4
rounded:
  none: "0px"
spacing:
  hair: "1px"
  xs: "8px"
  sm: "12px"
  gutter: "16px"
  sheet: "20px"
  block: "32px"
  section: "48px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.sheet}"
    typography: "{typography.title}"
    rounded: "{rounded.none}"
    padding: "4px 16px 4px 4px"
  button-primary-hover:
    backgroundColor: "{colors.ink-press}"
  button-outline:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "8px 16px"
  button-outline-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.sheet}"
  toggle-on:
    backgroundColor: "{colors.route}"
    textColor: "{colors.sheet}"
    rounded: "{rounded.none}"
    padding: "8px 12px"
  toggle-off:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "8px 12px"
  input:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "10px 12px"
  pictogram-inset:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.sheet}"
    rounded: "{rounded.none}"
    size: "36px"
  walk-inset:
    backgroundColor: "{colors.led}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    size: "36px"
  led-board:
    backgroundColor: "{colors.board}"
    textColor: "{colors.led}"
    typography: "{typography.led-row}"
    rounded: "{rounded.none}"
    padding: "10px 16px"
  timetable-row:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.none}"
    padding: "12px 12px 12px 16px"
  timetable-row-hover:
    backgroundColor: "{colors.frame}"
  score-plate-good:
    backgroundColor: "{colors.go}"
    textColor: "{colors.sheet}"
    typography: "{typography.numeral}"
    rounded: "{rounded.none}"
  score-plate-mid:
    backgroundColor: "{colors.mid}"
    textColor: "{colors.sheet}"
    rounded: "{rounded.none}"
  score-plate-poor:
    backgroundColor: "{colors.route}"
    textColor: "{colors.sheet}"
    rounded: "{rounded.none}"
---

# Design System: Obědy Olomouc

## Overview

**Creative North Star: "The Noon Departure Board"**

The whole product is an Olomouc tram stop at twelve o'clock. A dark LED board lists the nearest places serving lunch today with walking minutes and the cheapest price; below it hangs a white printed timetable where every place is a row and every dish is a departure. Lunch is a destination you walk to, the menu is the noon timetable, and the red route mark means "this line runs today".

The ground is light on purpose: people read this outdoors on a phone around 11:30, so the printed sheet (white, black ink, hairline rules) carries most of the reading and the dark board is a concentrated band, never the page. Density is timetable density: tight rows, tabular numerals, numbers set large and condensed so minutes and prices read at a glance. Everything is square. Corners, map pins, pictogram insets, buttons and the score plate share one hard-edged geometry taken from stop signage.

The system refuses the delivery-app photo card feed (rounded cards, hero food photos, star glyphs) and the cream bistro menu (warm paper, script or serif display). Photos appear only as user evidence inside reviews.

**Key Characteristics:**
- Two materials only: the dark LED board and the white printed sheet, mounted on a pale powder-coated frame.
- Amber Doto dot matrix for board text, black Barlow Condensed for sign lettering, Barlow for running text.
- Red square route mark (14px) flags places with a menu today; it is the one red signal on a list.
- Zero radius everywhere, including map pins and popups.
- Hairline rules divide rows; heavy 2px ink rules close a header or section.
- Numbers lead: walking minutes, prices and scores are the largest type in their row.

## Colors

A cool neutral sheet-and-frame palette with one amber light source and one red signal, plus a three-step score scale.

### Primary
- **Departure Amber** (led): the LED dot matrix on the board, the walk and submit insets on ink buttons, and the focus ring. It is light, so it only ever sits on board or ink, never on the white sheet as text.
- **Warm Board Text** (led-text): softer amber for non-matrix text and controls living on the board (the location button).

### Secondary
- **Route Red** (route): the "menu today" square mark, the active "Jen s menu" toggle, the menu pin core on the map, and the lowest score plate. Red always means either "runs today" or "poor score"; it is never decoration.
- **Route Red Ink** (route-ink): red used as text, for form errors on the sheet.

### Tertiary
- **Signal Green** (go) and **Signal Ochre** (mid): score plate backgrounds for 4 to 5 and 3 to 3.9. Below 3 the plate is Route Red. These appear nowhere else.

### Neutral
- **Timetable White** (sheet): the printed sheet: list, menu, forms, header bar.
- **Stop Frame Grey** (frame): page background behind sheets, row hover, menu section label column.
- **Frame Shadow Grey** (frame-2): resting background of the small arrow tile at the end of a list row.
- **Sign Black** (ink): all primary text, pictogram insets, primary buttons, heavy rules.
- **Pressed Black** (ink-press): hover state of ink buttons.
- **Graphite** (ink-2): secondary text, meta lines, units such as "Kč" (8.1:1 on sheet).
- **Pencil Grey** (ink-3): small meta only: counts, "min" unit, source notes, placeholders (4.8:1 on sheet).
- **Hairline Grey** (rule): 1px rules between timetable rows and inside stat grids.
- **Board Black** (board): LED board, menu header strip, footer, map loading state, theme color.
- **Board Rule** (board-rule): 1px rules between LED board rows.
- **Board Caption** (board-meta): small explanatory text on the board.

### Named Rules
**The Red Means Running Rule.** Route Red marks a place or line that has a menu today, or a poor score. A red element that means neither is wrong.

**The Amber Stays On Black Rule.** Departure Amber is a light emitted from the board. Use it on board, on ink insets and as the focus ring; never as text or fill on the white sheet.

## Typography

**Display Font:** Barlow Condensed 600/700/800 (with Barlow, sans-serif)
**Body Font:** Barlow 400 to 700 (with system-ui, sans-serif)
**Label/Mono Font:** Doto, ROND axis at 100 (with ui-monospace, monospace), board only

**Character:** Barlow Condensed is the black lettering of a stop sign: upright, narrow, slightly tight (-0.01em). Doto is the amber dot matrix of the departure board. Barlow carries the reading. All three cover Czech diacritics (latin-ext).

### Hierarchy
- **Display** (700, 2.3rem to 3.75rem, 0.95): the name plate of a restaurant or dish, balanced wrap.
- **Headline** (700, 1.875rem, 1): section heads on the sheet ("Hodnocení jídel"); the list head uses 1.5rem.
- **Title** (700, 1.125rem to 1.25rem): menu section labels, place name on the map card, review dish names, form legends, primary button text.
- **Numeral** (700, 1.5rem to 1.875rem, tabular): walking minutes in the list (1.75rem), prices in the menu (1.5rem), stat values and score plate numbers. Units follow in Barlow 600 at 0.875rem in Graphite.
- **LED head** (Doto 900, 1.6rem, uppercase): the board title and clock, the menu strip title.
- **LED row** (Doto 900, 1.15rem, tabular): board row name and minutes; price at 1.05rem, 80% opacity.
- **Body** (400, 1rem, 1.5; comments at relaxed leading).
- **Body strong** (600, 1.05rem): place names in list rows, dish names in the menu.
- **Label** (600, 0.875rem): stat captions, form labels, buttons; meta at 0.75rem in Pencil Grey.

### Named Rules
**The Full Weight Board Rule.** Doto is always weight 900 with ROND 100 and a soft amber glow. Thin dot weights vanish at board sizes.

**The Tabular Numbers Rule.** Every minute count, price, score and date sits in tabular numerals so columns align like a timetable.

**The En Dash Blank Rule.** A missing value (no score yet, no price) is an en dash (–) in the same condensed numeral style and size as the value it replaces, with an aria-label stating what is missing.

## Layout

Mobile first, single column in reading order: LED board, map (46dvh), then the timetable list. From 768px the home view becomes a two-column grid: board and list stacked in a 440px left column, map filling the right column at full viewport height below the 56px header, sticky. The list head (title, search, toggle) is sticky under the header with a 2px ink rule.

Content pages center in a sheet column: 64rem for a restaurant, 48rem for a dish, with a 16px gutter. The restaurant header is a two-column grid (name plate and a 320px mini map) joined by 1px ink gaps. Menu sections use a 9rem label column on desktop and stack on mobile.

Rhythm: 16px gutter, 20px sheet padding, 12px row padding and gaps, 32px between blocks, 48px between major sections. Grids built from cells use a 1px gap over a rule or ink background so the gap reads as a printed line.

## Elevation & Depth

Mostly flat. Depth comes from material contrast (dark board against white sheet against grey frame) and from rules. Shadows are soft and ambient, used only to lift a white sheet off the frame or a floating card off the map; there are no hard offset shadows.

### Shadow Vocabulary
- **Sheet** (`box-shadow: 0 1px 2px rgb(0 0 0 / 0.12), 0 6px 24px rgb(0 0 0 / 0.06)`): the menu timetable and the dish header sheet.
- **Review sheet** (`box-shadow: 0 1px 2px rgb(0 0 0 / 0.12), 0 4px 16px rgb(0 0 0 / 0.05)`): review tiles in a grid.
- **Map card** (`box-shadow: 0 2px 4px rgb(0 0 0 / 0.2), 0 10px 30px rgb(0 0 0 / 0.18)`): the selected place card floating over the map.
- **Header** (`box-shadow: 0 1px 0 var(--ink), 0 2px 10px rgb(0 0 0 / 0.08)`): the sticky header, an ink hairline plus a faint lift.
- **LED glow** (`text-shadow: 0 0 6px rgb(255 178 26 / 0.35)`): every Doto glyph.

### Named Rules
**The Paper Not Plastic Rule.** A shadow only says "this sheet is lifted off the frame". Nothing on the sheet itself gets a shadow.

## Shapes

Square, without exception: 0 radius on buttons, inputs, cards, map popups, score plates and pins. The pictogram inset is the recurring silhouette: a solid square (28, 36 or 44px) holding a 2.4px-stroke icon with square caps and miter joins, black on white or ink on amber. Map stops are square markers drawn into a bitmap: an ink square with a red core for menu places, a small grey square with a white ring for the rest, a translucent amber square halo for the selected one. Borders are 1px hairlines between rows and on fields, 2px ink for outline buttons and section closers.

**The Square Stop Rule.** Pins, insets, marks and plates are squares. A circle appears only inside an icon drawing (a head, a lens).

## Components

### Buttons
Sign plates: solid, square, with a pictogram inset leading or trailing.
- **Shape:** square corners (0px).
- **Primary:** Sign Black plate, white Barlow 600 or Barlow Condensed 700 text, with a 36px inset square (Departure Amber with an ink icon) flush inside a 4px padding. Large variants (rate dish, submit review) run full width with the inset on the right.
- **Hover / Focus:** background shifts to Pressed Black; focus is a 3px amber outline at 2px offset with a 5px ink halo so it reads on both board and sheet.
- **Outline:** 2px ink border on white; hover fills ink with white text. The "Ohodnotit" row action carries a 28px ink arrow inset on the left.
- **Disabled:** ink at 35% with the inset dimmed to white at 25%.

### Chips
- **Toggle:** "Jen s menu" is a square toggle; on is Route Red fill with white text, off is white with a 40% ink border that darkens on hover.
- **Segmented control:** portion choice is three cells joined by 1px gaps over a 40% ink background; the selected cell is solid ink.

### Cards / Containers
- **Corner Style:** square (0px).
- **Background:** Timetable White on Stop Frame Grey.
- **Shadow Strategy:** Sheet or Review sheet shadow (see Elevation).
- **Border:** none on the sheet; internal structure from hairlines and 2px ink rules.
- **Internal Padding:** 20px (16px on review tiles and stat cells).

### Inputs / Fields
- **Style:** white field, 1px border at 40% ink, square, 10px by 12px padding, placeholder in Pencil Grey.
- **Focus:** border goes solid ink, plus the global amber focus ring.
- **Error:** a 2px Route Red bordered block with Route Red Ink text in Barlow 600.
- **Photo drop:** a dashed 2px border at 35% ink holding a 48px camera inset.

### Navigation
White 56px sticky header with the brand mark (a small LED board icon) and "Obědy" 700 plus "Olomouc" 600 in Barlow Condensed 1.375rem. Links are Barlow 500 at 0.95rem; hover fills Stop Frame Grey. Back links on content pages are a 16px arrow-left icon plus label in Graphite, Sign Black on hover. The footer is Board Black with 0.8rem grey text and amber link hover.

### LED Departure Board
The signature. A flat Board Black band (no unlit dot grid behind the text): Doto head "DNES V POLEDNE" with the live Prague clock right-aligned, a caption in Board Caption, then up to six rows separated by Board Rule hairlines. Each row is a three-column grid: name (truncating), price as "95,-" at reduced opacity, minutes right-aligned in a 4.2rem column. Rows write themselves in once on load: a left-to-right clip reveal, 520ms on cubic-bezier(0.16, 1, 0.3, 1), staggered 70ms per row after 120ms, disabled under reduced motion. The same board strip heads the restaurant menu sheet with the date.

### Timetable Row
A list row is a four-column grid: walking minutes as a right-aligned 1.75rem condensed numeral with a "min" unit below, the place name in Body strong with the 14px red route mark when it has a menu today, the score plate if rated, and a 32px arrow tile that turns ink on hover. Places without a menu today grey their minutes and name. Menu rows put the dish name left, price right as a numeral with "Kč", and the outline rate action.

### Score Plate
Replaces star glyphs. The average as a condensed numeral (one decimal, Czech comma) on a colored plate (green 4+, ochre 3+, red below), with five thin white segments beneath, filled to the rounded score and 30% white for the rest, followed by the review count as "12×". Two sizes: inline (1rem) and large (1.875rem). The rating form reuses the same scale as five 64px square numeral buttons that fill with the tone of the chosen score.

## Do's and Don'ts

### Do:
- **Do** keep the page on the light sheet and frame; the LED board is a band, never a full dark theme.
- **Do** set every minute, price, score and date in tabular numerals, numbers larger than their labels.
- **Do** mark "menu today" with the 14px square in Route Red, and use red for nothing else except poor scores and errors.
- **Do** lead or end actions with a square pictogram inset (ink on white, or amber with an ink icon on ink).
- **Do** write empty values as an en dash in the numeral style, with an aria-label.
- **Do** use Doto at weight 900, ROND 100, with the amber glow, and only on Board Black.
- **Do** draw icons as 24px-grid SVG strokes at 2.4px with square caps and miter joins.

### Don't:
- **Don't** round any corner: no rounded cards, buttons, pills, pins or popups.
- **Don't** draw circular map pins; stops are squares.
- **Don't** put an unlit LED dot grid or other texture behind board text; the board is flat.
- **Don't** add kicker or eyebrow labels above headings; the heading and the numbers carry the hierarchy.
- **Don't** build delivery-app photo card feeds or hero food imagery; photos are review evidence only.
- **Don't** use star glyphs for ratings; use the score plate.
- **Don't** use warm cream paper, serif or script display type; that is the bistro menu this system refuses.
- **Don't** use hard offset shadows or put shadows on elements inside a sheet.
