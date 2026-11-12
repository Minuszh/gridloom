# Build, sign and release

[中文](releasing.md) · [README](../README.en.md)

Source remains at `0.5.0`. The 2026-11-12 build is published as the v0.5.0 pre-release, replacing the withdrawn package. Source updates, signing, installation and public publication are separate steps.

## Prepare

1. Synchronize versions in `package.json` and `CSXS/manifest.xml`.
2. Update both READMEs, documentation and CHANGELOG. Both READMEs share the three native screenshots in `docs/images/`.
3. Run `npm test`, `npm run check`, `npm run build` and `npm run test:ui`.
4. Ensure the package matches the source intended for distribution.

## Sign

Use [Adobe ZXPSignCmd](https://github.com/Adobe-CEP/CEP-Resources/tree/master/ZXPSignCMD) to sign `dist/` with a certificate stored outside the repository. Write output to `release/`. The release filename is `gridloom-0.5.0.zxp`; `SHA256SUMS.txt` records package and source ZIP checksums.

Use an available timestamp service, then verify:

```sh
ZXPSignCmd -verify release/gridloom-0.5.0.zxp -certinfo
```

The current certificate is self-signed. Package signature and timestamp verification passed; this is not Adobe Marketplace approval.

## Installation check

Disable CEP 12 debug mode, move out any older development copy, install the ZXP, and restart both hosts. Compare installed files with `dist/`, then check loading, icons, guide creation, preview and book margins. Remove the installed extension first if a same-version update does not overwrite it.

## Publish

Only after the maintainer requests publication: commit source, create or verify the tag, export the matching source ZIP, and upload the ZXP, source and checksums to a Release. State the platforms actually tested. There is no automatic publishing or updating.

Keep only the current local package in `release/`. Older packages are archived outside the repository.
