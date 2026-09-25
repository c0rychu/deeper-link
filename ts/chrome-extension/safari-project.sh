#!/bin/sh
# Generates the Safari app's Xcode project in dist/safari-xcode/ from dist/safari-extension/ (run `make build` first).
# Nothing here is committed: Apple's converter template is used as is, except for the two things patched below.
set -eu

ID=io.github.c0rychu.deeper-link     # the registered App ID; the converter names the extension $ID.Extension
NAME="Deeper Link"
PROJECT="dist/safari-xcode/$NAME"
ICON=store/safari/app-icon-1024.png  # rendered by `make images`
SMALL=ts/chrome-extension/icons      # 16 and 32 px icons drawn on the pixel grid

xcrun safari-web-extension-converter dist/safari-extension --project-location dist/safari-xcode --app-name "$NAME" \
  --bundle-identifier "$ID" --swift --macos-only --no-open --no-prompt --force >/dev/null

# 1. The converter ignores the given ID for the app and derives it from the app name: io.github.c0rychu.Deeper-Link.
sed -i '' "s/PRODUCT_BUNDLE_IDENTIFIER = \"[^\"]*Deeper-Link\";/PRODUCT_BUNDLE_IDENTIFIER = \"$ID\";/" \
  "$PROJECT/$NAME.xcodeproj/project.pbxproj"

# 2. It fills every app icon size by upscaling the extension's 128 px icon, so 1024 px comes out blurry.
for size in 16 32 128 256 512; do
  for scale in 1 2; do
    px=$((size * scale))
    out="$PROJECT/$NAME/Assets.xcassets/AppIcon.appiconset/mac-icon-${size}@${scale}x.png"
    if [ "$px" -le 32 ]; then cp "$SMALL/$px.png" "$out"; else sips -z "$px" "$px" "$ICON" --out "$out" >/dev/null; fi
  done
done
