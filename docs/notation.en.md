# Grid notation and dimensions

[中文](notation.md) · [README](../README.en.md)

Custom notation is under maintenance. Opening Custom converts the current grid to English shorthand. Interface language still follows the host.

```text
margin: 12mm
columns: 12, auto, 4mm
rows: 0
```

Columns and rows accept count, width/height and gutter, separated by commas. `auto` leaves a dimension automatic. Margins accept one value, two values (top/bottom, left/right), or four values (top, right, bottom, left). A margin of `auto` leaves that side blank. Older Chinese aliases remain accepted, but generated text uses English.

Center lines, position and book mode use the controls below the editor. Inner/outer margins come from the Grid tab and do not yet have dedicated shorthand keywords.

## Patterns

```text
# Three columns
$column = | ~ |
$column*3 (v)

# Baseline grid
$row = | 16px |
$row* (h)

# Centered 100 pt grid
~ | { ~ | ~ | ~ (100pt) } | ~ (v)
```

| Token | Meaning |
| --- | --- |
| `\|` | Place a guide |
| `~` | Share remaining space |
| `12mm`, `10%` | Advance a distance |
| `$name = ...` | Declare a variable |
| `$name` | Use a declared variable |
| `$name[0]`, `$name[1]` | Whole variable or numbered capture |
| `*3`, `*` | Repeat a fixed count or fill with a positive fixed-size pattern |
| `{ ... }` | Nested grid block |
| `(h)`, `(v)` | Horizontal or vertical guides |
| `(100pt)`, `($WIDTH)`, `($HEIGHT)` | Grid extent |
| `(n)`, `(p)` | Normal or integer coordinate allocation |
| `(pf)`, `(pc)`, `(pl)` | Allocate rounding remainder first, center or last |
| `#`, `//` | Comment |

A variable must be declared before use. Percentage and flexible values resolve in their grid scope; sized variables resolve at declaration. Fill patterns cannot contain another fill or unresolved flexible space.

## Units and fields

Supported units include `pt px mm cm in pc ft yd m ag %`, common English unit names, and pica forms such as `5p6`. `1 px = 1 pt`. Bare values use document ruler units.

```text
calc(1in - 12pt)
calc(2 * 3mm)
```

Addition/subtraction use dimensions; multiplication/division use a numeric factor. Two dimensions cannot be multiplied. No script evaluation occurs.

Margin, size and gutter fields also accept patterns. `2mm | 2mm` adds a guide in the middle of a 4 mm gutter. Counts of zero preserve margin guides; an empty count with a fixed size fills the available extent. Reset clears fields; an empty form generates the scope outline.

Presets preserve physical units across documents; percentages continue to adapt. Import/export uses gridloom JSON. The parser is shared by Illustrator and InDesign; no MCP interface is implemented.

Detailed capture and rounding examples, bounds and references are in the [Chinese guide](notation.md).
