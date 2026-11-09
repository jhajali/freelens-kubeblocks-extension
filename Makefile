.PHONY: install build clean pack type-check test lint help

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	pnpm install

build: ## Type check, then build dist/
	pnpm type:check
	pnpm build

test: ## Run the unit tests
	pnpm test:unit

type-check: ## Run TypeScript type checker
	pnpm type:check

clean: ## Remove build output
	rm -rf dist
	rm -f *.tgz

pack: build ## Build and pack into .tgz
	pnpm pack

lint: ## Run linter
	pnpm lint:check
