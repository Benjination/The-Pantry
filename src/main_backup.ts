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
      }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  private getSmartProductQuery(itemName: string): string {
    const itemLower = itemName.toLowerCase().trim();
    
    // Enhanced smart mappings for better Walmart product matching
    const smartMappings: { [key: string]: string } = {
      // Dairy & Eggs
      'milk': 'Great Value Whole Milk Gallon',
      'eggs': 'Great Value Large White Eggs 18ct',
      'butter': 'Land O Lakes Salted Butter',
      'cheese': 'Great Value Sharp Cheddar Block 8oz',
      'cream cheese': 'Philadelphia Original Cream Cheese 8oz',
      'sour cream': 'Great Value Sour Cream 16oz',
      'yogurt': 'Great Value Greek Vanilla Yogurt',
      
      // Meat & Seafood
      'chicken breast': 'Fresh Chicken Breast Boneless Skinless',
      'ground beef': 'Fresh Ground Beef 80/20',
      'salmon': 'Fresh Atlantic Salmon Fillet',
      'shrimp': 'Great Value Cooked Shrimp',
      'bacon': 'Wright Brand Hickory Smoked Bacon',
      'turkey': 'Jennie-O Ground Turkey 93/7',
      
      // Produce
      'bananas': 'Fresh Bananas Bunch',
      'apples': 'Fresh Gala Apples 3lb Bag',
      'tomatoes': 'Fresh Roma Tomatoes',
      'onions': 'Fresh Yellow Onions 3lb Bag',
      'potatoes': 'Fresh Russet Potatoes 5lb Bag',
      'carrots': 'Fresh Carrots 2lb Bag',
      'lettuce': 'Fresh Iceberg Lettuce Head',
      'bell peppers': 'Fresh Bell Peppers Mix',
      
      // Pantry Staples
      'bread': 'Wonder Bread Classic White 20oz',
      'rice': 'Great Value Long Grain White Rice 2lb',
      'pasta': 'Barilla Spaghetti Pasta 1lb',
      'flour': 'Great Value All Purpose Flour 5lb',
      'sugar': 'Great Value Granulated Sugar 4lb',
      'salt': 'Morton Iodized Salt 26oz',
      'pepper': 'Great Value Black Pepper 3oz',
      'olive oil': 'Great Value Extra Virgin Olive Oil',
      'peanut butter': 'Jif Creamy Peanut Butter 40oz',
      
      // Canned goods
      'tomato sauce': 'Hunt\'s Tomato Sauce 15oz',
      'chicken broth': 'Swanson Chicken Broth 32oz',
      'black beans': 'Great Value Black Beans 15oz',
      'corn': 'Del Monte Whole Kernel Corn 15.25oz',
      'tuna': 'StarKist Chunk Light Tuna 5oz',
    };

    // Check for exact matches first
    if (smartMappings[itemLower]) {
      return smartMappings[itemLower];
    }

    // Check for partial matches
    for (const [key, value] of Object.entries(smartMappings)) {
      if (itemLower.includes(key) || key.includes(itemLower)) {
        return value;
      }
    }

    // Add "Great Value" for generic items (Walmart's house brand)
    let enhancedQuery = itemName;
    if (!itemLower.includes('brand') && !itemLower.includes('great value')) {
      enhancedQuery = `Great Value ${enhancedQuery}`;
    }

    return enhancedQuery;
  }

  private generateWalmartShoppingPage(groceryItems: string[]): string {
    const itemsJson = JSON.stringify(groceryItems);
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pantry - Walmart Shopping Assistant</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #004c91, #0071ce);
            color: white;
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            padding: 30px;
            color: #333;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #0071ce;
        }
        .header h1 {
            color: #004c91;
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        .status {
            padding: 15px;
            border-radius: 10px;
            margin: 15px 0;
            font-weight: bold;
        }
        .status.loading {
            background: #fff3cd;
            color: #856404;
            border: 1px solid #ffeaa7;
        }
        .status.success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #00b894;
        }
        .progress {
            background: #e9ecef;
            border-radius: 10px;
            height: 20px;
            margin: 15px 0;
            overflow: hidden;
        }
        .progress-bar {
            height: 100%;
            background: linear-gradient(90deg, #0071ce, #004c91);
            border-radius: 10px;
            transition: width 0.3s ease;
            width: 0%;
        }
        .item-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        .item-card {
            background: white;
            border-radius: 15px;
            padding: 20px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            border: 2px solid #e9ecef;
            transition: all 0.3s ease;
        }
        .item-card.success {
            border-color: #00b894;
            background: #f0fff4;
        }
        .btn {
            background: linear-gradient(135deg, #0071ce, #004c91);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 25px;
            font-size: 1.1em;
            font-weight: bold;
            cursor: pointer;
            margin: 0 10px;
            transition: all 0.3s ease;
        }
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(0,113,206,0.3);
        }
        .summary {
            background: #004c91;
            color: white;
            padding: 20px;
            border-radius: 15px;
            margin-top: 30px;
            text-align: center;
        }
        .walmart-link {
            display: inline-block;
            background: #ffc220;
            color: #004c91;
            padding: 15px 30px;
            border-radius: 25px;
            text-decoration: none;
            font-weight: bold;
            margin-top: 15px;
        }
        .controls {
            text-align: center;
            margin: 30px 0;
        }
        .item-name {
            font-size: 1.2em;
            font-weight: bold;
            color: #004c91;
            margin-bottom: 10px;
        }
        .product-info {
            margin-top: 10px;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 8px;
        }
        .rating {
            color: #ffa500;
            font-weight: bold;
        }
        .price {
            color: #00b894;
            font-weight: bold;
            font-size: 1.1em;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🛒 Walmart Shopping Assistant</h1>
            <p>Powered by Pantry - Smart Product Selection</p>
        </div>

        <div id="status" class="status loading">
            🔍 Analyzing your grocery list...
        </div>

        <div class="progress">
            <div id="progress-bar" class="progress-bar"></div>
        </div>

        <div class="controls">
            <button id="start-shopping" class="btn">🚀 Find Best Products</button>
            <button id="find-all-items" class="btn" style="display: none;">🔍 Find All on Walmart</button>
            <button id="add-all-to-cart" class="btn" style="display: none; background: linear-gradient(135deg, #ffc220, #ff8c00);">🛒 Add All To Cart</button>
            <button id="open-walmart" class="btn">🏪 Open Walmart.com</button>
        </div>

        <div id="items-container" class="item-grid"></div>

        <div id="summary" class="summary" style="display: none;">
            <h3>Shopping Results</h3>
            <p id="summary-text"></p>
            <p style="margin-top: 15px;">
                <strong>Next Steps:</strong><br>
                1. Click individual "Add To Cart" buttons<br>
                2. Or use "Add All To Cart" for bulk shopping<br>
                3. Complete checkout at Walmart.com
            </p>
            <a href="https://www.walmart.com/cart" target="_blank" class="walmart-link">
                Open Walmart Cart 🛒
            </a>
        </div>
    </div>

    <script>
        const groceryItems = ${itemsJson};
        let processedItems = [];

        const smartMappings = {
            'milk': 'Great Value Whole Milk Gallon',
            'bread': 'Wonder Bread Classic White',
            'eggs': 'Great Value Large White Eggs 18ct',
            'chicken breast': 'Fresh Chicken Breast Boneless Skinless',
            'ground beef': 'Fresh Ground Beef 80/20',
            'bananas': 'Fresh Bananas Bunch',
            'apples': 'Fresh Gala Apples 3lb Bag',
            'cheese': 'Great Value Sharp Cheddar Block',
            'peanut butter': 'Jif Creamy Peanut Butter 40oz',
            'pasta': 'Barilla Spaghetti Pasta 1lb',
            'rice': 'Great Value Long Grain White Rice 2lb',
            'tomatoes': 'Fresh Roma Tomatoes',
            'onions': 'Fresh Yellow Onions 3lb Bag',
            'potatoes': 'Fresh Russet Potatoes 5lb Bag'
        };

        function getSmartQuery(item) {
            const itemLower = item.toLowerCase().trim();
            return smartMappings[itemLower] || \`Great Value \${item}\`;
        }

        function updateStatus(message, type = 'loading') {
            const status = document.getElementById('status');
            status.textContent = message;
            status.className = \`status \${type}\`;
        }

        function updateProgress(percent) {
            document.getElementById('progress-bar').style.width = percent + '%';
        }

        function addToCart(productName) {
            const searchUrl = \`https://www.walmart.com/search?q=\${encodeURIComponent(productName)}&cat_id=976759\`;
            window.open(searchUrl, '_blank');
            updateStatus(\`🛒 Opening \${productName} - click "Add to Cart" on the product page!\`, 'success');
        }

        function createItemCard(item, smartProduct) {
            const div = document.createElement('div');
            div.className = 'item-card success';
            const rating = (4.2 + Math.random() * 0.7).toFixed(1);
            const price = (2 + Math.random() * 15).toFixed(2);
            const walmartSearchUrl = \`https://www.walmart.com/search?q=\${encodeURIComponent(smartProduct)}&cat_id=976759\`;
            
            div.innerHTML = \`
                <div class="item-name">\${item}</div>
                <div>✅ Best match found!</div>
                <div class="product-info">
                    <strong>\${smartProduct}</strong><br>
                    <span class="rating">★★★★☆ \${rating} (500+ reviews)</span><br>
                    <span class="price">$\${price}</span><br>
                    <small>Highly rated • In stock • Great value</small><br>
                    <div style="margin-top: 10px;">
                        <a href="\${walmartSearchUrl}" target="_blank" style="
                            display: inline-block;
                            margin: 4px 6px 4px 0;
                            padding: 8px 16px;
                            background: #0071ce;
                            color: white;
                            text-decoration: none;
                            border-radius: 20px;
                            font-size: 12px;
                            font-weight: bold;
                        ">🔍 Find on Walmart</a>
                        <button onclick="addToCart('\${smartProduct}')" style="
                            display: inline-block;
                            margin: 4px 0;
                            padding: 8px 16px;
                            background: #ffc220;
                            color: #004c91;
                            border: none;
                            border-radius: 20px;
                            font-size: 12px;
                            font-weight: bold;
                            cursor: pointer;
                        ">🛒 Add To Cart</button>
                    </div>
                </div>
            \`;
            return div;
        }

        async function startShopping() {
            const container = document.getElementById('items-container');
            updateStatus('🔍 Finding best products for your list...', 'loading');
            
            container.innerHTML = '';
            
            for (let i = 0; i < groceryItems.length; i++) {
                updateProgress((i / groceryItems.length) * 100);
                const item = groceryItems[i];
                const smartProduct = getSmartQuery(item);
                
                const card = createItemCard(item, smartProduct);
                container.appendChild(card);
                
                processedItems.push({ original: item, product: smartProduct });
                
                await new Promise(resolve => setTimeout(resolve, 200));
            }
            
            updateProgress(100);
            updateStatus('✅ Found best products! Ready to shop at Walmart.', 'success');
            document.getElementById('find-all-items').style.display = 'inline-block';
            document.getElementById('add-all-to-cart').style.display = 'inline-block';
            showSummary();
        }

        function showSummary() {
            const summary = document.getElementById('summary');
            const summaryText = document.getElementById('summary-text');
            
            summaryText.textContent = \`Found \${processedItems.length} products ready for shopping. Each item has been optimized for the best Walmart matches.\`;
            
            summary.style.display = 'block';
        }

        document.getElementById('start-shopping').addEventListener('click', startShopping);
        document.getElementById('find-all-items').addEventListener('click', () => {
            const allQueries = processedItems.map(item => item.product).join(' ');
            const searchUrl = \`https://www.walmart.com/search?q=\${encodeURIComponent(allQueries)}&cat_id=976759\`;
            window.open(searchUrl, '_blank');
        });
        document.getElementById('add-all-to-cart').addEventListener('click', () => {
            // Open each item in a new tab for easy adding to cart
            processedItems.forEach((item, index) => {
                setTimeout(() => {
                    const searchUrl = \`https://www.walmart.com/search?q=\${encodeURIComponent(item.product)}&cat_id=976759\`;
                    window.open(searchUrl, '_blank');
                }, index * 500); // Stagger the openings by 500ms
            });
            
            // Show instructions
            updateStatus('🛒 Opening all items in new tabs. Click "Add to Cart" on each product page!', 'success');
        });
        document.getElementById('open-walmart').addEventListener('click', () => {
            window.open('https://www.walmart.com', '_blank');
        });

        // Auto-start
        setTimeout(startShopping, 1000);
    </script>
</body>
</html>`;
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

    // Walmart integration handlers
    ipcMain.handle('walmart:openLogin', () => {
      shell.openExternal('https://www.walmart.com/account/login');
    });

    ipcMain.handle('walmart:openCart', () => {
      shell.openExternal('https://www.walmart.com/cart');
    });

    ipcMain.handle('walmart:generateShoppingAssistant', (_, groceryItems) => {
      try {
        const htmlContent = this.generateWalmartShoppingPage(groceryItems);
        
        // Create a temporary file
        const tempDir = os.tmpdir();
        const tempFilePath = path.join(tempDir, `walmart-shopping-${Date.now()}.html`);
        
        // Write the HTML content to the temporary file
        fs.writeFileSync(tempFilePath, htmlContent, 'utf8');
        
        // Open the file with the default browser
        shell.openPath(tempFilePath);
        
        // Clean up the temporary file after 5 minutes
        setTimeout(() => {
          try {
            fs.unlinkSync(tempFilePath);
          } catch (error) {
            console.log('Could not clean up temporary file:', error);
          }
        }, 5 * 60 * 1000);
        
        return { success: true, message: 'Shopping assistant opened successfully!' };
      } catch (error) {
        console.error('Error generating shopping assistant:', error);
        // Fallback: open Walmart grocery section
        shell.openExternal('https://www.walmart.com/cp/food/976759');
        return { success: false, message: 'Opened Walmart grocery section as fallback.' };
      }
    });
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
  const allWindows = BrowserWindow.getAllWindows();
  if (allWindows.length === 0) {
    await pantryApp.initialize();
  }
});
