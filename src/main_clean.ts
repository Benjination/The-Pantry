import { app, BrowserWindow, Menu, ipcMain, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
const { RecipeManager } = require('./services/RecipeManager');
const { MenuPlanManager } = require('./services/MenuPlanManager');
const { ShoppingListManager } = require('./services/ShoppingListManager');

class PantryApp {
  private mainWindow: BrowserWindow | null = null;
  private recipeManager: any;
  private menuPlanManager: any;
  private shoppingListManager: any;

  constructor() {
    this.recipeManager = new RecipeManager();
    this.menuPlanManager = new MenuPlanManager();
    this.shoppingListManager = new ShoppingListManager();

    // Set up dependency injection
    this.shoppingListManager.setRecipeManager(this.recipeManager);
    this.shoppingListManager.setMenuPlanManager(this.menuPlanManager);

    this.setupIpcHandlers();
  }

  public async initialize(): Promise<void> {
    await app.whenReady();
    this.createWindow();
    this.createMenu();
  }

  private createWindow(): void {
    // Create the browser window.
    this.mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      }
    });

    // Load the app.
    if (process.env.NODE_ENV === 'development') {
      this.mainWindow.loadFile(path.join(__dirname, '../src/renderer/index.html'));
      this.mainWindow.webContents.openDevTools();
    } else {
      this.mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));
    }

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
  }

  private createMenu(): void {
    const template: Electron.MenuItemConstructorOptions[] = [
      {
        label: 'File',
        submenu: [
          {
            label: 'New Recipe',
            accelerator: 'CmdOrCtrl+N',
            click: () => {
              this.mainWindow?.webContents.send('menu:new-recipe');
            }
          },
          { type: 'separator' },
          {
            label: 'Quit',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => {
              app.quit();
            }
          }
        ]
      },
      {
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' }
        ]
      },
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'forceReload' },
          { role: 'toggleDevTools' },
          { type: 'separator' },
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { type: 'separator' },
          { role: 'togglefullscreen' }
        ]
      },
      {
        label: 'Window',
        submenu: [
          { role: 'minimize' },
          { role: 'close' }
        ]
      }
    ];

    if (process.platform === 'darwin') {
      template.unshift({
        label: 'Pantry',
        submenu: [
          { role: 'about' },
          { type: 'separator' },
          { role: 'services' },
          { type: 'separator' },
          { role: 'hide' },
          { role: 'hideOthers' },
          { role: 'unhide' },
          { type: 'separator' },
          { role: 'quit' }
        ]
      });

      // Window menu
      template[4].submenu = [
        { role: 'close' },
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' }
      ];
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  private setupIpcHandlers(): void {
    // Recipe handlers
    ipcMain.handle('recipe:getAll', () => this.recipeManager.getAllRecipes());
    ipcMain.handle('recipe:add', (_, recipe) => this.recipeManager.addRecipe(recipe));
    ipcMain.handle('recipe:update', (_, id, recipe) => this.recipeManager.updateRecipe(id, recipe));
    ipcMain.handle('recipe:delete', (_, id) => this.recipeManager.deleteRecipe(id));

    // Menu plan handlers
    ipcMain.handle('menu:getWeekPlan', (_, weekStart) => this.menuPlanManager.getWeekPlan(weekStart));
    ipcMain.handle('menu:setMeal', (_, date, mealType, recipeId) =>
      this.menuPlanManager.setMeal(date, mealType, recipeId));
    ipcMain.handle('menu:removeMeal', (_, date, mealType) =>
      this.menuPlanManager.removeMeal(date, mealType));

    // Shopping list handlers
    ipcMain.handle('shopping:generateFromWeek', (_, weekStart) =>
      this.shoppingListManager.generateFromWeekPlan(weekStart));
    ipcMain.handle('shopping:getCategorizedList', (_, items) =>
      this.shoppingListManager.categorizeItems(items));
    ipcMain.handle('shopping:createShoppingText', (_, items) =>
      this.shoppingListManager.createShoppingListText(items));
  }
}

// Create the app instance
const pantryApp = new PantryApp();

// App event handlers
app.on('ready', () => {
  pantryApp.initialize();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    await pantryApp.initialize();
  }
});
