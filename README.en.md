# gridloom

**[中文](README.md) · English**

This plugin was developed with Codex.

A compact panel for drawing grids and guides in Adobe Illustrator.

**0.3.11** · CEP 12 · Chinese / English · GPL-3.0

## Features

- Uses selected objects as the scope, or the active artboard when nothing is selected.
- Creates native Illustrator guides from margins, rows, columns, fixed sizes, gutters, and alignment.
- Accepts values such as `10px`, `3mm`, and `5%`. Bare numbers follow the document ruler units.
- Each generation creates a group named after its artboard and time, inside the `gridloom` layer.
- Appends or replaces grids, adds quick edge and center guides, and clears guides in the current scope.
- Includes 13 grid presets and supports saving, editing, deleting, importing, and exporting your own.
- Custom notation supports variables, flexible space, repeats, and groups. See the [notation reference (Chinese)](docs/notation.md).
- Lock and eye buttons control the `gridloom` layer. Bright means locked / visible; gray means unlocked / hidden.

The panel follows Illustrator's language, font, and theme, with grayscale icons. Text status appears only for errors, with no hover tooltips or persistent counts.

A row or column count of `0` still creates margin guides. Leave the count blank and enter a fixed size to fill the scope. `1 px = 1 pt`. If Illustrator hides guides globally, show them again in Illustrator.

## Installation

The current version is a CEP panel for Illustrator 29.5.1–30.x. Selected document operations have been tested on macOS Apple Silicon / Illustrator 30.8.2. See the [test log (Chinese)](docs/testing.md) for platform testing.

Local builds require Node.js 22 or later. No dependency installation is needed. From the project directory:

```sh
npm run build
npm run install:dev
```

Enable CEP 12 debug mode to load the unsigned local build.

macOS:

```sh
defaults write com.adobe.CSXS.12 PlayerDebugMode 1
```

Windows (Command Prompt):

```bat
reg add HKCU\Software\Adobe\CSXS.12 /v PlayerDebugMode /t REG_SZ /d 1 /f
```

Restart Illustrator and open gridloom under Window → Extensions.

## License

Licensed under [GNU GPL v3.0](LICENSE) (`GPL-3.0-only`). You may use, modify, and distribute it, including commercially. When distributing a modified version, provide the corresponding source under GPL-3.0. Private modifications and use do not require public release.
