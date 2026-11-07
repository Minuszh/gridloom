<div align="center">
  <img src="assets/icon.svg" width="48" alt="gridloom" />
  <h1>gridloom</h1>
  <p>This plugin was developed with Codex.</p>
  <p>A compact panel for drawing grids and guides in Adobe Illustrator.</p>
  <p><sub>CEP 12 &nbsp; / &nbsp; Illustrator &nbsp; / &nbsp; GPL-3.0</sub></p>
  <p><a href="README.md">中文</a> · <b>English</b> &nbsp; · &nbsp; <a href="https://github.com/Minuszh/gridloom/releases">Download</a></p>
</div>

---

## From objects to grids

Select objects to use their bounds, or leave the selection empty to use the active artboard. Enter your dimensions and generate.

| Grid | Actions | Presets |
| :--- | :--- | :--- |
| Margins, rows, columns, gutters, alignment | Append, replace, edge and center guides | 13 built-in design grids |
| Fixed sizes, percentages, mixed units | One group per generation, named after its artboard | Save, edit, import, export |
| Variables, flexible space, repeated patterns | Layer locking, visibility, scoped clearing | Reading columns, editorial layouts, modular grids |

The panel follows Illustrator's language, font, and theme, with grayscale icons. No hover tooltips or persistent counts; text appears only for errors.

Enter counts directly or click the slider icon to adjust them. The canvas updates automatically as you change parameters. **Apply** keeps the result; **Cancel** restores the previous grid. Book mode repeats the same settings across left/right or top/bottom pages. Press ↑/↓ in dimension fields to add/subtract 1 while retaining the unit.

## Install

1. Download `gridloom-0.3.15.zxp` from [Releases](https://github.com/Minuszh/gridloom/releases).
2. Drag the file into [ZXP/UXP Installer](https://aescripts.com/learn/zxp-installer/).
3. Restart Illustrator and open **Window → Extensions → gridloom**.

Uses CEP 12, with a manifest range of Illustrator 29.5.1–30.x. Selected native operations have been tested on macOS Apple Silicon / Illustrator 30.8.2.

<details>
<summary>Install from source</summary>

Requires Node.js 22 or later. No dependency installation is needed.

```sh
npm run build
npm run install:dev
```

Unsigned local builds use CEP debug mode. See [testing and local installation (Chinese)](docs/testing.md).

</details>

## Quick notes

- **Book mode**: choose left/right or top/bottom pages under Position & settings. Split the scope equally and repeat the grid on each page; margins, percentages, rows, and columns apply per page.
- Enter dimensions such as `10px`, `3mm`, or `5%`. Bare numbers follow document ruler units. `1 px = 1 pt`.
- A count of `0` retains margin guides. Leave the count blank and enter a fixed size to fill the scope.
- Each generation creates a group inside the `gridloom` layer. Multiple groups on the same artboard share its name.
- Lock and eye buttons affect only the `gridloom` layer. Bright means locked / visible; gray means unlocked / hidden.
- Explore the [notation examples (Chinese)](docs/notation.md) and [changelog](CHANGELOG.md).

## License

[GNU GPL v3.0](LICENSE) · `GPL-3.0-only`

You may use, modify, and distribute it, including commercially. Distribute modified versions with corresponding source under GPL-3.0. Private modifications do not require public release.
