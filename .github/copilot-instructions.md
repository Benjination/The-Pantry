<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Pantry - Meal Planning Application

This is an Electron-based meal planning application for macOS that allows users to:

1. **Recipe Management**: Add, edit, and organize recipes with ingredients and instructions
2. **Weekly Menu Planning**: Plan meals for each day of the week using a visual menu board
3. **Shopping List Generation**: Automatically generate categorized shopping lists from meal plans
4. **Walmart Integration**: Create formatted shopping lists compatible with Walmart's online grocery service

## Architecture

- **Main Process** (`src/main.ts`): Electron main process handling app lifecycle and IPC
- **Renderer Process** (`src/renderer/`): Frontend UI using vanilla HTML/CSS/JavaScript
- **Services** (`src/services/`): Business logic for recipes, menu planning, and shopping lists
- **Types** (`src/types/`): TypeScript type definitions
- **Preload** (`src/preload.ts`): Secure IPC bridge between main and renderer processes

## Key Features

- Native macOS app with proper menu bar integration
- Local data storage using JSON files in user data directory
- Categorized shopping lists (produce, dairy, meat, pantry, etc.)
- Weekly menu board with drag-and-drop meal planning
- Recipe search and tagging system
- Print-friendly shopping lists

## Development Guidelines

- Use TypeScript for type safety
- Follow Electron security best practices (context isolation, no node integration in renderer)
- Maintain separation between main process business logic and renderer UI
- Use semantic versioning for releases
- Package as native macOS app with proper icon and category

## Code Style

- Use modern ES6+ features
- Prefer async/await over promises
- Use proper error handling with try/catch blocks
- Follow macOS Human Interface Guidelines for UI design
- Use Apple's SF symbols for icons where appropriate
