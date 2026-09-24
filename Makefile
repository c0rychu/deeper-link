# Single entry point for every language and target in this repo.
# Add Python/Rust targets here and hook them into `build` / `test`.

PNPM ?= pnpm

.DEFAULT_GOAL := help
.PHONY: help install check-links build build-chrome test test-ts typecheck check icons clean

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

# PNGs are committed, so building never needs this; rerun only after editing assets/icon.svg.
# macOS: renders with headless Chrome at 512px, then downsizes with sips.
CHROME ?= /Applications/Google Chrome.app/Contents/MacOS/Google Chrome
icons: ## Re-render Chrome PNG icons from assets/icon.svg
	@tmp=$$(mktemp -d) && \
	"$(CHROME)" --headless --disable-gpu --hide-scrollbars --default-background-color=00000000 \
		--window-size=512,512 --screenshot=$$tmp/icon.png "file://$(CURDIR)/assets/icon.svg" 2>/dev/null && \
	for s in 16 48 128; do sips -z $$s $$s $$tmp/icon.png --out ts/chrome-extension/icons/$$s.png >/dev/null; done && \
	rm -rf $$tmp && echo "icons: ts/chrome-extension/icons/{16,48,128}.png"

clean: ## Remove build output
	rm -rf dist/*  # keep dist itself: it may be a symlink
