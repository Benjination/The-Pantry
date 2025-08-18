# 🍳 Pantry - Meal Planning App

A beautiful and intuitive meal planning application for macOS that helps you organize recipes, plan weekly menus, and generate smart shopping lists.

## 📱 Download & Install

### Easy Installation (Recommended)
1. **Download** the latest version from the [Releases page](https://github.com/Benjination/The-Pantry/releases)
2. **Download** `Pantry-1.1.0-arm64.dmg` (for Apple Silicon Macs) 
3. **Open** the downloaded DMG file
4. **Drag** Pantry.app to your Applications folder
5. **Launch** Pantry from Applications or Spotlight

### System Requirements
- **macOS 10.15** or later
- **Apple Silicon (M1/M2)** or Intel Mac
- **150 MB** available storage space

### Platform Availability
- ✅ **macOS** - Full native app (Apple Silicon & Intel)
- ✅ **Windows** - Windows 10/11 (64-bit) - *Can be built on request*
- ✅ **Linux** - Ubuntu/Debian-based distributions (64-bit) - *Can be built on request*
- ❌ **iPhone/iPad** - Not supported (Electron limitation)
- ❌ **Android** - Not supported (Electron limitation)

> **Note**: While Windows and Linux builds are technically possible, only macOS builds are currently provided in releases. Contact the maintainer if you need builds for other platforms.

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
- Export as text for easy sharing

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
- `npm run dist` - Create distributable packages (current platform)
- `npm run dist:mac` - Create macOS app bundle
- `npm run dist:win` - Create Windows installer (NSIS)
- `npm run dist:linux` - Create Linux packages (AppImage & DEB)
- `npm run dist:all` - Create packages for all platforms

### Data Storage
The app stores data locally in JSON files:
- **Recipes**: `~/Library/Application Support/pantry/recipes.json`
- **Menu Plans**: `~/Library/Application Support/pantry/menu-plans.json`

## 📱 Mobile Access & Alternatives

Since Pantry is a desktop application, here are some options for mobile meal planning:

### iPhone/iPad Alternatives
While Pantry isn't available on iOS, you can:
- **Export shopping lists** as text and copy to your phone
- **Email shopping lists** to yourself for mobile access
- **Use similar apps** like:
  - Mela (Recipe Manager)
  - Paprika Recipe Manager
  - Plan to Eat
  - BigOven

### Future Mobile Support
A mobile version would require:
- Complete rewrite using React Native or Swift
- Cloud sync for data sharing between devices
- Different UI optimized for touch interfaces

*If there's significant interest in mobile support, it could be considered for a future major version.*

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
4. Use the action buttons to share, email, or print the list
5. Copy the list text for use in grocery apps

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
