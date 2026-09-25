# Single entry point for every language and target in this repo.
# Add Python/Rust targets here and hook them into `build` / `test`.

PNPM ?= pnpm

.DEFAULT_GOAL := help
.PHONY: help install check-links build test test-ts typecheck check package safari-app safari-archive safari-upload images clean

help: ## List targets
	@grep -E '^[a-zA-Z_-]+:.*## ' $(MAKEFILE_LIST) | awk -F':.*## ' '{printf "  %-14s %s\n", $$1, $$2}'

install: check-links ## Install all dependencies
	$(PNPM) install

# The repo lives in Dropbox, so dependency dirs are symlinks to outside it.
# Refuse to let a tool create a real (synced) directory in their place.
check-links:
	@test -e node_modules || { echo "node_modules is missing: symlink it to a dir outside Dropbox first, e.g."; echo "  mkdir -p ~/.cache/deeper-link/node_modules && ln -s ~/.cache/deeper-link/node_modules node_modules"; exit 1; }

node_modules/.modules.yaml: package.json pnpm-lock.yaml | check-links
	$(PNPM) install
	@touch $@

build: node_modules/.modules.yaml ## Build the Chrome and Safari extensions into dist/{chrome,safari}-extension
	$(PNPM) run build

test: test-ts ## Run all tests

test-ts: node_modules/.modules.yaml ## Run TypeScript tests
	$(PNPM) run test

typecheck: node_modules/.modules.yaml ## Type-check TypeScript
	$(PNPM) run typecheck

check: typecheck test ## Type-check and test

VERSION = $(shell node -p "require('./package.json').version")

package: check build ## Zip the Chrome extension for the Web Store upload
	rm -f dist/deeper-link-chrome-$(VERSION).zip
	cd dist/chrome-extension && zip -qrX ../deeper-link-chrome-$(VERSION).zip . -x '.DS_Store'
	@echo "package: dist/deeper-link-chrome-$(VERSION).zip"

# The Safari extension ships inside a macOS app. safari-project.sh generates its Xcode project into dist/.
SAFARI_XCODE = dist/safari-xcode
SAFARI_APP = $(SAFARI_XCODE)/build/Build/Products/Debug/Deeper Link.app
SAFARI_ARCHIVE = $(SAFARI_XCODE)/Deeper Link.xcarchive
APPLE_TEAM ?= G3F7QCP2GS
# App Store build number: unique per version. Bump it (make safari-archive SAFARI_BUILD=2) to re-upload a version.
SAFARI_BUILD ?= 1
# Safari 17 (the manifest's minimum) runs on macOS 12 and later.
XCODEBUILD = xcodebuild -quiet -project "$(SAFARI_XCODE)/Deeper Link/Deeper Link.xcodeproj" -scheme "Deeper Link" \
	MARKETING_VERSION=$(VERSION) CURRENT_PROJECT_VERSION=$(SAFARI_BUILD) MACOSX_DEPLOYMENT_TARGET=12.0

# Local testing only: ad-hoc signed, so Safari needs Settings → Developer → "Allow unsigned extensions".
safari-app: build ## Build and open an unsigned macOS app containing the Safari extension
	ts/chrome-extension/safari-project.sh
	$(XCODEBUILD) -configuration Debug -derivedDataPath $(SAFARI_XCODE)/build \
		CODE_SIGN_IDENTITY=- CODE_SIGN_STYLE=Manual DEVELOPMENT_TEAM= build
	open "$(SAFARI_APP)"

# Signs with the Apple account signed into Xcode (Settings → Accounts), creating profiles as needed.
# ITSAppUsesNonExemptEncryption=NO answers TestFlight's export-compliance question: the only encryption is Safari's HTTPS.
safari-archive: check build ## Build the signed Safari app archive for the Mac App Store
	ts/chrome-extension/safari-project.sh
	rm -rf "$(SAFARI_ARCHIVE)"
	$(XCODEBUILD) -configuration Release -destination generic/platform=macOS -archivePath "$(SAFARI_ARCHIVE)" \
		-allowProvisioningUpdates DEVELOPMENT_TEAM=$(APPLE_TEAM) \
		INFOPLIST_KEY_LSApplicationCategoryType=public.app-category.productivity \
		INFOPLIST_KEY_ITSAppUsesNonExemptEncryption=NO archive
	@echo "safari-archive: $(SAFARI_ARCHIVE) ($(VERSION) build $(SAFARI_BUILD))"

safari-upload: ## Upload the archive from safari-archive to App Store Connect
	@test -d "$(SAFARI_ARCHIVE)" || { echo "No archive: run make safari-archive first"; exit 1; }
	xcodebuild -exportArchive -archivePath "$(SAFARI_ARCHIVE)" -exportPath $(SAFARI_XCODE)/export \
		-exportOptionsPlist ts/chrome-extension/safari-export.plist -allowProvisioningUpdates

# PNGs are committed, so building never needs this; rerun only after editing an SVG source.
# macOS: renders each SVG at 512px with headless Chrome, then downsizes with sips.
#   16/32: assets/icon-16.svg, drawn on the pixel grid (512 = 32 x 16, so its edges stay sharp).
#   48/128: assets/icon.svg, whose ~96px mark in 128 matches the store's icon padding guideline.
#   Promo tile: the store requires exactly 440x280 (no 2x), so render at 4x and downsample for smoother edges.
#   Screenshot: store/chrome/screenshots/context-menu.html at 2x (the menu capture's scale) → exactly 1280x800.
#   Mac app icon (Safari): assets/icon.svg at 1024px; safari-project.sh derives the app's icon sizes from it.
#   Mac App Store screenshots: store/safari/screenshots/screenshots.html#1-4 at 2x → exactly 2880x1800.
CHROME ?= /Applications/Google Chrome.app/Contents/MacOS/Google Chrome
RENDER = "$(CHROME)" --headless --disable-gpu --hide-scrollbars --default-background-color=00000000
ICONS = ts/chrome-extension/icons
# The mark's bounding box inside icon.svg (after its transform); update if the geometry changes.
MARK_BOX = 17.65 11.25 86.4 97.2
images: ## Re-render icons and store images from their SVG sources
	@tmp=$$(mktemp -d) && \
	sed 's|viewBox="0 0 128 128"|viewBox="$(MARK_BOX)"|' assets/icon.svg | \
		awk 'NR==1 {print; print "  <!-- Generated by make images: icon.svg cropped tight to the mark, for inline use (README title). -->"; next} 1' \
		> assets/mark.svg && \
	$(RENDER) --window-size=512,512 --screenshot=$$tmp/small.png "file://$(CURDIR)/assets/icon-16.svg" 2>/dev/null && \
	$(RENDER) --window-size=512,512 --screenshot=$$tmp/large.png "file://$(CURDIR)/assets/icon.svg" 2>/dev/null && \
	for s in 16 32; do sips -z $$s $$s $$tmp/small.png --out $(ICONS)/$$s.png >/dev/null; done && \
	for s in 48 128; do sips -z $$s $$s $$tmp/large.png --out $(ICONS)/$$s.png >/dev/null; done && \
	$(RENDER) --window-size=440,280 --force-device-scale-factor=4 --screenshot=$$tmp/promo.png \
		"file://$(CURDIR)/store/chrome/promo-small.svg" 2>/dev/null && \
	sips -z 280 440 $$tmp/promo.png --out store/chrome/images/promo-small-440x280.png >/dev/null && \
	$(RENDER) --window-size=1280,800 --force-device-scale-factor=2 --screenshot=$$tmp/shot.png \
		"file://$(CURDIR)/store/chrome/screenshots/context-menu.html" 2>/dev/null && \
	sips -z 800 1280 $$tmp/shot.png --out store/chrome/images/screenshot-1-context-menu-1280x800.png >/dev/null && \
	$(RENDER) --window-size=1024,1024 --screenshot=store/safari/app-icon-1024.png "file://$(CURDIR)/assets/icon.svg" 2>/dev/null && \
	for n in 1 2 3 4; do $(RENDER) --window-size=1440,900 --force-device-scale-factor=2 --screenshot=store/safari/images/screenshot-$$n.png \
		"file://$(CURDIR)/store/safari/screenshots/screenshots.html#$$n" 2>/dev/null; done && \
	rm -rf $$tmp && echo "images: assets/mark.svg $(ICONS)/{16,32,48,128}.png store/chrome/images/{promo-small,screenshot-1}*.png store/safari/app-icon-1024.png store/safari/images/screenshot-{1..4}.png"

clean: ## Remove build output
	rm -rf dist/*  # keep dist itself: it may be a symlink
