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
# macOS: renders with headless Chrome, then downsizes with sips.
#   16/48: full-bleed, for the toolbar.
#   128: 96px artwork + 16px transparent padding, per Chrome Web Store icon guidelines
#        (the mark is 108 tall, so a 144-unit viewBox scales it to 96px).
CHROME ?= /Applications/Google Chrome.app/Contents/MacOS/Google Chrome
RENDER = "$(CHROME)" --headless --disable-gpu --hide-scrollbars --default-background-color=00000000
ICONS = ts/chrome-extension/icons
images: ## Re-render icons and store images from their SVG sources
	@tmp=$$(mktemp -d) && \
	$(RENDER) --window-size=512,512 --screenshot=$$tmp/full.png "file://$(CURDIR)/assets/icon.svg" 2>/dev/null && \
	sed 's/viewBox="0 0 128 128"/viewBox="-8 -8 144 144"/' assets/icon.svg > $$tmp/padded.svg && \
	$(RENDER) --window-size=512,512 --screenshot=$$tmp/padded.png "file://$$tmp/padded.svg" 2>/dev/null && \
	sips -z 16 16 $$tmp/full.png --out $(ICONS)/16.png >/dev/null && \
	sips -z 48 48 $$tmp/full.png --out $(ICONS)/48.png >/dev/null && \
	sips -z 128 128 $$tmp/padded.png --out $(ICONS)/128.png >/dev/null && \
	$(RENDER) --window-size=440,280 --screenshot=store/chrome/images/promo-small-440x280.png \
		"file://$(CURDIR)/store/chrome/promo-small.svg" 2>/dev/null && \
	rm -rf $$tmp && echo "images: $(ICONS)/{16,48,128}.png store/chrome/images/promo-small-440x280.png"

clean: ## Remove build output
	rm -rf dist/*  # keep dist itself: it may be a symlink
