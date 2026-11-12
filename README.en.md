<div align="center">
  <img src="assets/icon.svg" width="56" alt="gridloom" />
  <h1>gridloom</h1>
  <p>This plugin was developed with Codex.</p>
  <p>Build grids and guides from objects or pages in Adobe Illustrator and InDesign.</p>
  <p>Illustrator · InDesign · CEP 12 · GPL-3.0</p>
  <p><a href="README.md">中文</a> · <a href="README.en.md">English</a></p>
</div>

## Interface

<table>
  <tr><th>Grid</th><th>Presets</th><th>Custom</th></tr>
  <tr>
    <td valign="top"><img src="docs/images/grid.png" width="280" alt="Grid" /></td>
    <td valign="top"><img src="docs/images/presets.png" width="280" alt="Presets" /></td>
    <td valign="top"><img src="docs/images/custom.png" width="280" alt="Custom" /></td>
  </tr>
</table>

These are native Illustrator screenshots. Both READMEs use the same Chinese screenshots; the panel follows the host language automatically.

## Start with a scope

Select objects to use their bounds. With no selection, Illustrator uses the active artboard and InDesign uses the active page. Set margins, columns, rows and gutters, then click **Apply**.

- **Grids** support automatic or fixed dimensions, percentages and mixed units. A count of `0` keeps margin guides only on that axis. Leave the count empty and enter a fixed size to fill the available space.
- **Center lines and grid position** offer independent horizontal and vertical center guides and a nine-point alignment control for fixed-size grids.
- **Book mode** splits the scope into left/right or top/bottom pages, builds each grid, and adds a binding guide. Left/right pages use top, bottom, inner and outer margins; top/bottom pages use left, right, inner and outer margins. Inner margins face the binding on both pages.
- **Live preview** starts with the bottom eye button. Edit values or open a count slider, then **Apply** to keep the result. Turning preview off before applying restores the previous grid.
- **Presets** include 13 starting layouts: reading columns, modular grids, thirds, golden ratio and baseline grids. Selecting one fills the Grid tab. Save and edit your own presets, or import and export them as JSON.
- **Custom** converts the current grid into English shorthand when opened. It remains marked under maintenance; see the [notation guide](docs/notation.en.md).

Enter dimensions such as `12mm`, `8pt` or `5%`. Bare values use document ruler units. Press ↑ / ↓ to change a dimension by 1 while retaining its unit. The chain button links the four visible margins.

## Guides and saved settings

Apply replaces gridloom guides in the current scope and preserves manually drawn guides. Illustrator groups grids by scope inside the `gridloom` layer. InDesign uses native page guides in the same-named layer; its guides span the page rather than stopping at object or half-page boundaries.

The top lock and eye control the gridloom layer. The bottom eye controls live preview. Locking commits the preview and turns preview off. Switching artboards or pages preserves your inputs. Applied settings are stored with the document and restored on the first read of that scope in a new session.

InDesign initially imports page margins and columns. Its preset tab also offers current page margins/columns and the page layout grid. Both hosts share the panel, center lines, book controls and preview workflow.

## Install

Download the signed `gridloom-0.5.0.zxp` from [v0.5.0 Pre-release](https://github.com/Minuszh/gridloom/releases/tag/v0.5.0) and install it with a CEP-compatible ZXP installer, restart the application, then open **Window → Extensions → gridloom**. Signed packages do not need debug mode. One package serves Illustrator and InDesign.

Version `0.5.0` is distributed as a Pre-release. See [installation](docs/installing.en.md) for source installation and macOS / Windows paths.

| Host | Manifest range | Native test environment |
| --- | --- | --- |
| Illustrator | 29.5.1–30.x | macOS Apple Silicon / 30.8.2 |
| InDesign | 20.x–21.x | macOS Apple Silicon / 21.6.0 |

Windows and other versions in these ranges have not been tested natively. See [testing](docs/testing.en.md) for coverage.

## Documentation

[Installation](docs/installing.en.md) · [Notation](docs/notation.en.md) · [Testing](docs/testing.en.md) · [Packaging](docs/releasing.en.md) · [Changelog](CHANGELOG.md)

## License

[GNU GPL v3.0](LICENSE) · `GPL-3.0-only`
