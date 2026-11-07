# Releases

[中文](releasing.md) · [README](../README.en.md)

The current public release is **0.5.0**. Earlier test Releases were withdrawn; commits and tags remain.

1. Synchronize `package.json`, `CSXS/manifest.xml`, both READMEs, and CHANGELOG.
2. Run `npm test`, `npm run check`, `npm run build`, and `npm run test:ui`.
3. Sign `dist/` with Adobe ZXPSignCmd as `gridloom-0.5.0.zxp` and verify its signature.
4. Commit source, tag the commit, and export its source ZIP.
5. Attach the ZXP, source ZIP, and SHA256SUMS to the Release, with the actual validation scope.

Get the signing tool from [Adobe CEP Resources](https://github.com/Adobe-CEP/CEP-Resources/tree/master/ZXPSignCMD). Keep certificates outside the repository and build packages from committed source. There is no automatic publishing or update workflow; maintainers explicitly initiate releases.
