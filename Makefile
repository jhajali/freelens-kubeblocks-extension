.PHONY: install build build-force clean pack type-check lint help

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	pnpm install

build: ## Build with type checking
	pnpm build

build-force: ## Build without type checking
	pnpm build:force

type-check: ## Run TypeScript type checker
	pnpm type:check

clean: ## Remove build output
	rm -rf out
	rm -f *.tgz

pack: build ## Build and pack into .tgz
	pnpm pack

lint: ## Run linter
	pnpm type:check
