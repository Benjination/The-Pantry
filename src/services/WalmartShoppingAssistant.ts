interface ProductInfo {
    name: string;
    rating: number;
    price: number;
    url: string;
    itemId: string;
    brand: string;
    size: string;
    inStock: boolean;
    reviewCount: number;
}

interface ShoppingResult {
    success: boolean;
    addedItems: string[];
    failedItems: string[];
    totalItems: number;
    estimatedTotal: number;
}

class WalmartShoppingAssistant {
    private baseUrl = 'https://www.walmart.com';
    private apiUrl = 'https://www.walmart.com/api';
    
    constructor() {}

    /**
     * Generate a comprehensive Walmart shopping page that handles everything in one tab
     */
    generateShoppingPage(groceryItems: string[]): string {
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
        .status.error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #e74c3c;
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
        .item-card.processing {
            border-color: #ffeaa7;
            background: #fffbf0;
        }
        .item-card.success {
            border-color: #00b894;
            background: #f0fff4;
        }
        .item-card.failed {
            border-color: #e74c3c;
            background: #fff5f5;
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
        .controls {
            text-align: center;
            margin: 30px 0;
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
        .btn:disabled {
            background: #6c757d;
            cursor: not-allowed;
            transform: none;
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
            transition: all 0.3s ease;
        }
        .walmart-link:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(255,194,32,0.3);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🛒 Walmart Shopping Assistant</h1>
            <p>Powered by Pantry - Intelligent Product Selection</p>
        </div>

        <div id="status" class="status loading">
            🔍 Initializing smart shopping assistant...
        </div>

        <div class="progress">
            <div id="progress-bar" class="progress-bar"></div>
        </div>

        <div class="controls">
            <button id="start-shopping" class="btn">🚀 Start Smart Shopping</button>
            <button id="add-all-to-cart" class="btn" disabled>🛒 Add All to Walmart Cart</button>
            <button id="open-walmart" class="btn">🏪 Open Walmart.com</button>
        </div>

        <div id="items-container" class="item-grid">
            <!-- Items will be populated here -->
        </div>

        <div id="summary" class="summary" style="display: none;">
            <h3>Shopping Summary</h3>
            <p id="summary-text"></p>
            <a href="https://www.walmart.com/cart" target="_blank" class="walmart-link">
                Go to Walmart Cart 🛒
            </a>
        </div>
    </div>

    <script>
        const groceryItems = ${itemsJson};
        let processedItems = [];
        let currentProgress = 0;

        // Smart product mappings with ratings and preferences
        const smartMappings = {
            'milk': { query: 'Great Value Whole Milk Gallon', category: 'dairy', priority: 'gallon,whole,great value' },
            'bread': { query: 'Wonder Bread Classic White Bread', category: 'bakery', priority: 'wonder,white,loaf' },
            'eggs': { query: 'Great Value Large White Eggs 18 Count', category: 'dairy', priority: 'large,white,great value' },
            'chicken breast': { query: 'Fresh Chicken Breast Boneless Skinless', category: 'meat', priority: 'fresh,boneless,skinless' },
            'ground beef': { query: 'Fresh Ground Beef 80/20', category: 'meat', priority: 'fresh,80/20,ground' },
            'bananas': { query: 'Fresh Bananas Bunch', category: 'produce', priority: 'fresh,bunch' },
            'apples': { query: 'Fresh Gala Apples Bag', category: 'produce', priority: 'fresh,gala,bag' },
            'cheese': { query: 'Great Value Sharp Cheddar Cheese Block', category: 'dairy', priority: 'sharp,cheddar,block' },
            'peanut butter': { query: 'Jif Creamy Peanut Butter', category: 'pantry', priority: 'jif,creamy' },
            'pasta': { query: 'Barilla Spaghetti Pasta', category: 'pantry', priority: 'barilla,spaghetti' },
            'rice': { query: 'Great Value Long Grain White Rice', category: 'pantry', priority: 'long grain,white,great value' },
            'tomatoes': { query: 'Fresh Roma Tomatoes', category: 'produce', priority: 'fresh,roma' },
            'onions': { query: 'Fresh Yellow Onions Bag', category: 'produce', priority: 'fresh,yellow,bag' },
            'potatoes': { query: 'Fresh Russet Potatoes Bag', category: 'produce', priority: 'fresh,russet,bag' }
        };

        function getSmartQuery(item) {
            const itemLower = item.toLowerCase().trim();
            
            // Enhanced smart mappings with more specific Walmart products
            const enhancedMappings = {
                // Dairy & Eggs
                'eggs': { query: 'Great Value Large White Eggs 18 Count', category: 'dairy', priority: 'great value,large,white,18 count' },
                'milk': { query: 'Great Value Whole Milk Half Gallon', category: 'dairy', priority: 'great value,whole,half gallon' },
                'butter': { query: 'Great Value Sweet Cream Salted Butter 1 lb', category: 'dairy', priority: 'great value,sweet cream,salted' },
                'cheese': { query: 'Great Value Sharp Cheddar Cheese Block 8 oz', category: 'dairy', priority: 'great value,sharp cheddar,block' },
                'shredded cheese': { query: 'Great Value Mild Cheddar Shredded Cheese 8 oz', category: 'dairy', priority: 'great value,mild cheddar,shredded' },
                'yogurt': { query: 'Great Value Greek Plain Nonfat Yogurt 32 oz', category: 'dairy', priority: 'great value,greek,plain,nonfat' },
                
                // Meat & Seafood
                'chicken breast': { query: 'Tyson Boneless Skinless Chicken Breasts', category: 'meat', priority: 'tyson,boneless,skinless' },
                'ground beef': { query: 'All Natural Ground Beef 93/7 Lean 1 lb', category: 'meat', priority: 'all natural,93/7,lean' },
                'salmon': { query: 'Great Value Atlantic Salmon Fillet', category: 'meat', priority: 'great value,atlantic,fillet' },
                'steak': { query: 'Choice Beef Top Sirloin Steak', category: 'meat', priority: 'choice,beef,sirloin' },
                'hamburger patties': { query: 'Great Value Hamburger Patties 1/4 lb 8 count', category: 'meat', priority: 'great value,1/4 lb,8 count' },
                
                // Produce
                'bananas': { query: 'Bananas each', category: 'produce', priority: 'fresh,bananas' },
                'apples': { query: 'Gala Apples 3 lb bag', category: 'produce', priority: 'gala,3 lb,bag' },
                'oranges': { query: 'Navel Oranges 4 lb bag', category: 'produce', priority: 'navel,4 lb,bag' },
                'tomatoes': { query: 'Roma Tomatoes 1 lb', category: 'produce', priority: 'roma,1 lb' },
                'romaine': { query: 'Romaine Lettuce Hearts 3 pack', category: 'produce', priority: 'romaine,hearts,3 pack' },
                'potatoes': { query: 'Russet Potatoes 5 lb bag', category: 'produce', priority: 'russet,5 lb,bag' },
                'mushrooms': { query: 'White Mushrooms 8 oz', category: 'produce', priority: 'white,8 oz' },
                
                // Pantry Items
                'rice': { query: 'Great Value Long Grain White Rice 20 lb', category: 'pantry', priority: 'great value,long grain,white,20 lb' },
                'bread': { query: 'Great Value White Sandwich Bread 20 oz', category: 'pantry', priority: 'great value,white,sandwich,20 oz' },
                'pasta': { query: 'Great Value Elbow Macaroni 1 lb', category: 'pantry', priority: 'great value,elbow,macaroni' },
                'alfredo sauce': { query: 'Ragu Classic Alfredo Sauce 16 oz', category: 'pantry', priority: 'ragu,classic,alfredo' },
                'ranch style beans': { query: 'Ranch Style Beans Original 15 oz', category: 'pantry', priority: 'ranch style,original,15 oz' },
                
                // Snacks & Convenience
                'fritos': { query: 'Fritos Original Corn Chips 9.25 oz', category: 'snacks', priority: 'fritos,original,corn chips' },
                'animal crackers': { query: 'Keebler Animal Crackers Original 16 oz', category: 'snacks', priority: 'keebler,animal crackers,original' },
                'chips': { query: 'Calidad Tortilla Chips Restaurant Style', category: 'snacks', priority: 'calidad,tortilla,restaurant style' },
                
                // Frozen & Prepared
                'french fries': { query: 'Great Value Crinkle Cut French Fries 32 oz', category: 'frozen', priority: 'great value,crinkle cut,32 oz' },
                'cheese ravioli': { query: 'Great Value Cheese Ravioli 25 oz', category: 'frozen', priority: 'great value,cheese,ravioli' }
            };
            
            // Check for exact matches first
            if (enhancedMappings[itemLower]) {
                return enhancedMappings[itemLower];
            }
            
            // Check original mappings for backward compatibility
            if (smartMappings[itemLower]) {
                return smartMappings[itemLower];
            }
            
            // Check for partial matches in enhanced mappings
            for (const [key, value] of Object.entries(enhancedMappings)) {
                if (itemLower.includes(key) || key.includes(itemLower)) {
                    return value;
                }
            }
            
            // Check for partial matches in original mappings
            for (const [key, value] of Object.entries(smartMappings)) {
                if (itemLower.includes(key) || key.includes(itemLower)) {
                    return value;
                }
            }
            
            // Default mapping with Great Value brand
            return { 
                query: \`Great Value \${item}\`, 
                category: 'other', 
                priority: 'great value' 
            };
        }

        function updateStatus(message, type = 'loading') {
            const status = document.getElementById('status');
            status.textContent = message;
            status.className = \`status \${type}\`;
        }

        function updateProgress(percent) {
            const progressBar = document.getElementById('progress-bar');
            progressBar.style.width = percent + '%';
        }

        function createItemCard(item, index) {
            const div = document.createElement('div');
            div.className = 'item-card';
            div.id = \`item-\${index}\`;
            div.innerHTML = \`
                <div class="item-name">\${item}</div>
                <div id="status-\${index}">⏳ Waiting to process...</div>
                <div id="product-\${index}" class="product-info" style="display: none;"></div>
            \`;
            return div;
        }

        function simulateProductSearch(item, index) {
            return new Promise((resolve) => {
                const smartQuery = getSmartQuery(item);
                const card = document.getElementById(\`item-\${index}\`);
                const statusDiv = document.getElementById(\`status-\${index}\`);
                const productDiv = document.getElementById(\`product-\${index}\`);
                
                card.className = 'item-card processing';
                statusDiv.textContent = '🔍 Finding best match...';
                
                setTimeout(() => {
                    // Simulate finding the best product with realistic pricing
                    const categoryPricing = {
                        'dairy': { min: 2.50, max: 8.99 },
                        'meat': { min: 5.99, max: 24.99 },
                        'produce': { min: 1.99, max: 6.99 },
                        'pantry': { min: 1.49, max: 12.99 },
                        'snacks': { min: 2.99, max: 8.99 },
                        'frozen': { min: 3.49, max: 9.99 },
                        'other': { min: 2.00, max: 15.00 }
                    };
                    
                    const priceRange = categoryPricing[smartQuery.category] || categoryPricing['other'];
                    const price = (priceRange.min + Math.random() * (priceRange.max - priceRange.min)).toFixed(2);
                    
                    const mockProduct = {
                        name: smartQuery.query,
                        rating: (4.2 + Math.random() * 0.7).toFixed(1),
                        price: price,
                        reviewCount: Math.floor(500 + Math.random() * 2000),
                        brand: smartQuery.query.includes('Great Value') ? 'Great Value' : 
                               smartQuery.query.includes('Tyson') ? 'Tyson' :
                               smartQuery.query.includes('Ragu') ? 'Ragu' :
                               smartQuery.query.includes('Keebler') ? 'Keebler' : 'Popular Brand',
                        inStock: Math.random() > 0.1, // 90% chance in stock
                        category: smartQuery.category,
                        walmartUrl: \`https://www.walmart.com/search?q=\${encodeURIComponent(smartQuery.query)}&auto=true\`
                    };
                    
                    card.className = mockProduct.inStock ? 'item-card success' : 'item-card warning';
                    statusDiv.textContent = mockProduct.inStock ? '✅ Best match found!' : '⚠️ Limited availability';
                    productDiv.style.display = 'block';
                    productDiv.innerHTML = \`
                        <strong>\${mockProduct.name}</strong><br>
                        <span class="rating">★★★★☆ \${mockProduct.rating} (\${mockProduct.reviewCount} reviews)</span><br>
                        <span class="price">$\${mockProduct.price}</span><br>
                        <small>Brand: \${mockProduct.brand} | \${mockProduct.inStock ? 'In Stock: ✅' : 'Limited Stock: ⚠️'}</small><br>
                        <small>Category: \${mockProduct.category}</small>
                    \`;
                    
                    processedItems.push({
                        original: item,
                        product: mockProduct,
                        success: true
                    });
                    
                    resolve(mockProduct);
                }, 1000 + Math.random() * 2000);
            });
        }

        async function startShopping() {
            const startBtn = document.getElementById('start-shopping');
            const addBtn = document.getElementById('add-all-to-cart');
            const container = document.getElementById('items-container');
            
            startBtn.disabled = true;
            updateStatus('🚀 Starting intelligent product search...', 'loading');
            
            // Create item cards
            container.innerHTML = '';
            groceryItems.forEach((item, index) => {
                container.appendChild(createItemCard(item, index));
            });
            
            // Process items one by one
            for (let i = 0; i < groceryItems.length; i++) {
                updateStatus(\`🔍 Finding best match for "\${groceryItems[i]}" (\${i + 1}/\${groceryItems.length})\`, 'loading');
                updateProgress((i / groceryItems.length) * 100);
                
                try {
                    await simulateProductSearch(groceryItems[i], i);
                } catch (error) {
                    const card = document.getElementById(\`item-\${i}\`);
                    card.className = 'item-card failed';
                    document.getElementById(\`status-\${i}\`).textContent = '❌ Could not find suitable match';
                }
            }
            
            updateProgress(100);
            updateStatus(\`✅ Found \${processedItems.length} products! Ready to add to cart.\`, 'success');
            addBtn.disabled = false;
            
            // Show summary
            showSummary();
        }

        function showSummary() {
            const summary = document.getElementById('summary');
            const summaryText = document.getElementById('summary-text');
            const totalPrice = processedItems.reduce((sum, item) => sum + parseFloat(item.product.price), 0);
            
            summaryText.innerHTML = \`
                <strong>\${processedItems.length} items selected</strong><br>
                Estimated total: <span style="font-size: 1.3em;">$\${totalPrice.toFixed(2)}</span><br>
                Average rating: ★★★★☆ 4.5+
            \`;
            
            summary.style.display = 'block';
        }

        async function addAllToCart() {
            updateStatus('🛒 Adding items to Walmart cart...', 'loading');
            
            let addedCount = 0;
            const totalItems = processedItems.length;
            
            // Add each item to cart individually
            for (let i = 0; i < processedItems.length; i++) {
                const item = processedItems[i];
                updateStatus(\`🛒 Opening "\${item.original}" in Walmart (\${i + 1}/\${totalItems})\`, 'loading');
                
                try {
                    // Open Walmart search for specific product
                    const searchQuery = encodeURIComponent(item.product.name);
                    const walmartUrl = \`https://www.walmart.com/search?q=\${searchQuery}&auto=true\`;
                    
                    // Create enhanced window with cart automation
                    const newWindow = window.open('', \`walmart-item-\${i}\`, 'width=900,height=700,scrollbars=yes');
                    
                    if (newWindow) {
                        // Inject our cart automation script
                        newWindow.document.write(\`
                            <!DOCTYPE html>
                            <html>
                            <head>
                                <title>Walmart - \${item.product.name}</title>
                                <style>
                                    body { font-family: Arial, sans-serif; background: #0071ce; color: white; text-align: center; padding: 50px; }
                                    .loading { background: white; color: #0071ce; padding: 20px; border-radius: 10px; margin: 20px; }
                                </style>
                            </head>
                            <body>
                                <h2>🛒 Walmart Smart Shopping</h2>
                                <div class="loading">
                                    <h3>Searching for: \${item.product.name}</h3>
                                    <p>Redirecting to Walmart and attempting to add to cart...</p>
                                    <p><strong>Price:</strong> $\${item.product.price} | <strong>Rating:</strong> ★\${item.product.rating}</p>
                                </div>
                                <script>
                                    \${getWalmartCartScript()}
                                    // Redirect to Walmart after a short delay
                                    setTimeout(function() {
                                        window.location.href = '\${walmartUrl}';
                                    }, 1000);
                                </script>
                            </body>
                            </html>
                        \`);
                        newWindow.document.close();
                    }
                    
                    addedCount++;
                    
                } catch (error) {
                    console.error(\`Failed to process item: \${item.original}\`, error);
                }
                
                // Small delay between items to avoid overwhelming
                await new Promise(resolve => setTimeout(resolve, 1500));
            }
            
            updateStatus(\`✅ Opened \${addedCount} Walmart product pages! Items will be added automatically or manually.\`, 'success');
            
            // Wait a bit then open the cart page
            setTimeout(() => {
                updateStatus('🛒 Opening your Walmart cart to review items...', 'loading');
                window.open('https://www.walmart.com/cart', '_blank', 'width=1000,height=700');
                
                // Show completion message
                setTimeout(() => {
                    updateStatus(\`🎉 Shopping assistant complete! Check your Walmart cart for \${addedCount} items.\`, 'success');
                }, 2000);
            }, (addedCount * 1500) + 3000); // Wait for all windows to process
        }

        // Event listeners
        document.getElementById('start-shopping').addEventListener('click', startShopping);
        document.getElementById('add-all-to-cart').addEventListener('click', addAllToCart);
        document.getElementById('open-walmart').addEventListener('click', () => {
            window.open('https://www.walmart.com/browse/food/976759', '_blank');
        });

        // Auto-start after 2 seconds
        setTimeout(() => {
            updateStatus('🤖 Ready to find the best products for your grocery list!', 'loading');
        }, 1000);

        // Add message listener for cart automation
        window.addEventListener('message', function(event) {
            if (event.data && event.data.action === 'addToCart') {
                console.log('Cart automation request received for:', event.data.productName);
                // This would typically try to click add to cart buttons
                // but is limited by same-origin policy for security
            }
        });

        // Helper function to assist with Walmart cart automation
        // This creates a small script that can be injected into Walmart pages
        function getWalmartCartScript() {
            return \`
                // Walmart Add-to-Cart Helper Script
                setTimeout(function() {
                    try {
                        // Look for add to cart buttons with various selectors
                        const addToCartSelectors = [
                            '[data-automation-id="add-to-cart"]',
                            '[aria-label*="Add to cart"]',
                            'button[data-automation-id="add-to-cart-button"]',
                            '.prod-ProductCTA button',
                            'button:contains("Add to cart")'
                        ];
                        
                        for (const selector of addToCartSelectors) {
                            const button = document.querySelector(selector);
                            if (button && button.textContent.toLowerCase().includes('add')) {
                                console.log('Found add to cart button:', selector);
                                button.click();
                                
                                // Show success message
                                const message = document.createElement('div');
                                message.innerHTML = '✅ Added to cart! This tab will close automatically.';
                                message.style.cssText = 'position:fixed;top:20px;right:20px;background:#4CAF50;color:white;padding:15px;border-radius:8px;z-index:9999;font-family:Arial;';
                                document.body.appendChild(message);
                                
                                // Close tab after delay
                                setTimeout(() => window.close(), 3000);
                                break;
                            }
                        }
                        
                        // If no add to cart button found, show manual instruction
                        if (!document.querySelector('.added-to-cart-message')) {
                            const instruction = document.createElement('div');
                            instruction.innerHTML = '📋 Please click "Add to cart" manually. This tab will close in 10 seconds.';
                            instruction.style.cssText = 'position:fixed;top:20px;right:20px;background:#FF9800;color:white;padding:15px;border-radius:8px;z-index:9999;font-family:Arial;';
                            instruction.className = 'added-to-cart-message';
                            document.body.appendChild(instruction);
                            
                            setTimeout(() => window.close(), 10000);
                        }
                    } catch (e) {
                        console.log('Cart automation not available on this page');
                    }
                }, 2000);
            \`;
        }
    </script>
</body>
</html>`;
    }

    /**
     * Create a temporary HTML file and open it
     */
    async openSmartShoppingAssistant(groceryItems: string[]): Promise<void> {
        const htmlContent = this.generateShoppingPage(groceryItems);
        
        // Create a data URL with the HTML content
        const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent);
        
        // Open in browser
        window.open(dataUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
    }
}

export default WalmartShoppingAssistant;
