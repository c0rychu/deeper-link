# Single entry point for every language and target in this repo.
# Add Python/Rust targets here and hook them into `build` / `test`.

PNPM ?= pnpm

.DEFAULT_GOAL := help
.PHONY: help install check-links build build-chrome test test-ts typecheck check package images clean

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

build: build-chrome ## Build all targets

build-chrome: node_modules/.modules.yaml ## Build the Chrome extension into dist/chrome-extension
	$(PNPM) run build:chrome

test: test-ts ## Run all tests

test-ts: node_modules/.modules.yaml ## Run TypeScript tests
	$(PNPM) run test

typecheck: node_modules/.modules.yaml ## Type-check TypeScript
	$(PNPM) run typecheck

check: typecheck test ## Type-check and test

VERSION = $(shell node -p "require('./package.json').version")

package: check build-chrome ## Zip the Chrome extension for the Web Store upload
	rm -f dist/deeper-link-chrome-$(VERSION).zip
	cd dist/chrome-extension && zip -qrX ../deeper-link-chrome-$(VERSION).zip . -x '.DS_Store'
	@echo "package: dist/deeper-link-chrome-$(VERSION).zip"

# PNGs are committed, so building never needs this; rerun only after editing an SVG source.
# macOS: renders each SVG at 512px with headless Chrome, then downsizes with sips.
#   16/32: assets/icon-16.svg, drawn on the pixel grid (512 = 32 x 16, so its edges stay sharp).
#   48/128: assets/icon.svg, whose ~96px mark in 128 matches the store's icon padding guideline.
#   Promo tile: the store requires exactly 440x280 (no 2x), so render at 4x and downsample for smoother edges.
#   Screenshot: store/chrome/screenshots/context-menu.html at 2x (the menu capture's scale) → exactly 1280x800.
CHROME ?= /Applications/Google Chrome.app/Contents/MacOS/Google Chrome
RENDER = "$(CHROME)" --headless --disable-gpu --hide-scrollbars --default-background-color=00000000
ICONS = ts/chrome-extension/icons
images: ## Re-render icons and store images from their SVG sources
	@tmp=$$(mktemp -d) && \
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
	rm -rf $$tmp && echo "images: $(ICONS)/{16,32,48,128}.png store/chrome/images/{promo-small,screenshot-1}*.png"

clean: ## Remove build output
	rm -rf dist/*  # keep dist itself: it may be a symlink
