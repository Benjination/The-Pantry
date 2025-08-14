# 🍳 Pantry - Meal Planning App

A beautiful and intuitive meal planning application for macOS that helps you organize recipes, plan weekly menus, and generate smart shopping lists.

## Features

### 📝 Recipe Management
- Add and organize your favorite recipes
- Include ingredients with amounts and categories
- Add cooking instructions and preparation notes
- Tag recipes for easy searching
- Track prep time, cook time, and servings

### 📅 Weekly Menu Board
- Visual weekly meal planning interface
- Plan breakfast, lunch, dinner, and snacks
- Navigate between weeks easily
- Intuitive drag-and-drop meal assignment

### 🛒 Smart Shopping Lists
- Automatically generate shopping lists from your meal plans
- Categorized by store sections (produce, dairy, meat, etc.)
- Consolidates duplicate ingredients across recipes
- Print-friendly format
- Walmart integration for online grocery ordering

### 🍎 Native macOS Experience
- Built specifically for macOS
- Native menu bar integration
- Optimized for Retina displays
- Follows Apple's Human Interface Guidelines

## Installation

### From Source
1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the application:
   ```bash
   npm run build
   ```
4. Run in development mode:
   ```bash
   npm run dev
   ```

### Build for Distribution
To create a macOS app bundle:
```bash
npm run dist:mac
```

This will create a `.app` file in the `release` folder that you can drag to your Applications folder.

## Development

### Project Structure
```
src/
├── main.ts              # Electron main process
├── preload.ts           # IPC bridge
├── types/               # TypeScript type definitions
├── services/            # Business logic
│   ├── RecipeManager.ts
│   ├── MenuPlanManager.ts
│   └── ShoppingListManager.ts
└── renderer/            # Frontend UI
    ├── index.html
    └── renderer.js
```

### Available Scripts
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript files
- `npm run electron` - Run the app
- `npm run pack` - Package without creating installer
- `npm run dist` - Create distributable packages
- `npm run dist:mac` - Create macOS app bundle

### Data Storage
The app stores data locally in JSON files:
- **Recipes**: `~/Library/Application Support/pantry/recipes.json`
- **Menu Plans**: `~/Library/Application Support/pantry/menu-plans.json`

## Usage

### Adding Recipes
1. Click "Add Recipe" in the recipes view
2. Enter recipe name, ingredients, and instructions
3. Categorize ingredients for better shopping list organization
4. Add tags for easy searching

### Planning Meals
1. Navigate to the Menu Board
2. Click on any meal slot to assign a recipe
3. Use the week navigation to plan future weeks
4. Remove meals by clicking and selecting "Remove Meal"

### Generating Shopping Lists
1. Go to the Shopping List view
2. Select the week you want to shop for
3. Click "Generate List" to create a categorized shopping list
4. Use "Create Walmart List" to format for online grocery ordering
5. Print the list for in-store shopping

## Features Coming Soon
- Recipe import from URLs
- Nutritional information tracking
- Meal plan templates
- Recipe sharing and export
- Dark mode support
- Integration with other grocery services

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

If you encounter any issues or have feature requests, please open an issue on GitHub.

---

Made with ❤️ for home cooks who love to plan ahead!
