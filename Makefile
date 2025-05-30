.PHONY: help install dev build start test lint clean docker-build docker-run

# Default target
help:
	@echo "Available commands:"
	@echo "  install      Install dependencies"
	@echo "  dev          Start development server"
	@echo "  build        Build the project"
	@echo "  start        Start production server"
	@echo "  test         Run tests"
	@echo "  lint         Run linting"
	@echo "  clean        Clean build artifacts"
	@echo "  docker-build Build Docker image"
	@echo "  docker-run   Run with Docker Compose"

# Install dependencies
install:
	npm install

# Start development server
dev:
	npm run dev

# Build the project
build:
	npm run build

# Start production server
start:
	npm start

# Run tests
test:
	npm test

# Run linting
lint:
	npm run lint

# Fix linting issues
lint-fix:
	npm run lint:fix

# Clean build artifacts
clean:
	npm run clean
	rm -rf node_modules

# Build Docker image
docker-build:
	docker build -t api-gateway .

# Run with Docker Compose
docker-run:
	docker-compose up --build

# Stop Docker containers
docker-stop:
	docker-compose down

# View logs
logs:
	tail -f logs/combined.log

# Setup development environment
setup: install
	cp .env.example .env
	mkdir -p logs
	@echo "Setup complete! Edit .env file with your service URLs"
	@echo "Run 'make dev' to start development server"
