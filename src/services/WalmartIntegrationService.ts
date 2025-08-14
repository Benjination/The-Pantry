interface ProductMatch {
    id: string;
    name: string;
    price: number;
    size: string;
    brand: string;
    url: string;
    inStock: boolean;
}

interface WalmartLoginStatus {
    isLoggedIn: boolean;
    username?: string;
}

class WalmartIntegrationService {
    private baseUrl = 'https://www.walmart.com';
    private grocerySearchUrl = 'https://www.walmart.com/search?q={query}&cat_id=976759';
    
    constructor() {}

    /**
     * Check if user is logged into Walmart
     */
    async checkLoginStatus(): Promise<WalmartLoginStatus> {
        try {
            // Create a hidden iframe to check Walmart login status
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = 'https://www.walmart.com/account';
            document.body.appendChild(iframe);

            return new Promise((resolve) => {
                iframe.onload = () => {
                    try {
                        // Try to access iframe content to check for login indicators
                        // Note: This will be limited by CORS, but we can check for redirects
                        const isLoggedIn = iframe.contentWindow?.location.href.includes('account') || false;
                        document.body.removeChild(iframe);
                        
                        resolve({
                            isLoggedIn,
                            username: isLoggedIn ? 'Walmart User' : undefined
                        });
                    } catch (error) {
                        // CORS error indicates we're probably not logged in
                        document.body.removeChild(iframe);
                        resolve({ isLoggedIn: false });
                    }
                };
                
                // Timeout after 5 seconds
                setTimeout(() => {
                    document.body.removeChild(iframe);
                    resolve({ isLoggedIn: false });
                }, 5000);
            });
        } catch (error) {
            console.error('Error checking Walmart login status:', error);
            return { isLoggedIn: false };
        }
    }

    /**
     * Intelligent product matching for grocery items
     */
    private getSmartProductQuery(itemName: string): string {
        const itemLower = itemName.toLowerCase().trim();
        
        // Define smart mappings for common grocery items
        const smartMappings: Record<string, string> = {
            // Proteins
            'chicken breast': 'great value chicken breast boneless skinless',
            'ground beef': 'great value ground beef 80/20',
            'salmon': 'fresh atlantic salmon fillet',
            'pork chops': 'fresh pork chops bone-in',
            'ground turkey': 'great value ground turkey 93/7',
            
            // Dairy
            'milk': 'great value whole milk gallon',
            'eggs': 'great value large eggs dozen',
            'cheese': 'great value sharp cheddar cheese block',
            'butter': 'great value unsalted butter sticks',
            'yogurt': 'great value greek yogurt vanilla',
            
            // Produce
            'bananas': 'fresh bananas bunch',
            'apples': 'fresh gala apples bag',
            'potatoes': 'fresh russet potatoes bag',
            'onions': 'fresh yellow onions bag',
            'carrots': 'fresh carrots bag',
            'tomatoes': 'fresh roma tomatoes',
            'lettuce': 'fresh iceberg lettuce head',
            
            // Pantry staples
            'bread': 'great value white bread loaf',
            'rice': 'great value long grain white rice',
            'pasta': 'great value spaghetti pasta',
            'olive oil': 'great value extra virgin olive oil',
            'flour': 'great value all purpose flour',
            'sugar': 'great value granulated sugar',
            'salt': 'great value iodized salt',
            'black pepper': 'great value ground black pepper',
            
            // Condiments
            'ketchup': 'heinz tomato ketchup',
            'mustard': 'french\'s classic yellow mustard',
            'mayo': 'hellmann\'s real mayonnaise',
            'peanut butter': 'jif creamy peanut butter',
            'jelly': 'welch\'s grape jelly',
            
            // Canned goods
            'tomato sauce': 'hunt\'s tomato sauce',
            'chicken broth': 'swanson chicken broth',
            'black beans': 'great value black beans',
            'corn': 'del monte whole kernel corn',
            'tuna': 'starkist chunk light tuna',
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

        // Add quantity estimation keywords
        const quantityKeywords = {
            'bag': 'bag',
            'bunch': 'bunch', 
            'gallon': 'gallon',
            'dozen': 'dozen',
            'lb': 'pound',
            'oz': 'ounce'
        };

        let enhancedQuery = itemName;
        
        // Add "Great Value" for generic items (Walmart's house brand)
        if (!itemLower.includes('brand') && !itemLower.includes('great value')) {
            enhancedQuery = `great value ${enhancedQuery}`;
        }

        return enhancedQuery;
    }

    /**
     * Search for a product on Walmart
     */
    async searchProduct(itemName: string): Promise<ProductMatch[]> {
        try {
            const query = this.getSmartProductQuery(itemName);
            const searchUrl = this.grocerySearchUrl.replace('{query}', encodeURIComponent(query));
            
            // For now, return mock data as we can't directly scrape Walmart
            // In a real implementation, this would need server-side scraping or API access
            const mockResults: ProductMatch[] = [
                {
                    id: `walmart_${Date.now()}`,
                    name: `${query} - Popular Choice`,
                    price: this.estimatePrice(itemName),
                    size: this.estimateSize(itemName),
                    brand: this.estimateBrand(itemName),
                    url: searchUrl,
                    inStock: true
                }
            ];

            return mockResults;
        } catch (error) {
            console.error('Error searching for product:', error);
            return [];
        }
    }

    /**
     * Estimate price based on common grocery items
     */
    private estimatePrice(itemName: string): number {
        const itemLower = itemName.toLowerCase();
        
        const priceMap: Record<string, number> = {
            'milk': 3.98,
            'bread': 1.28,
            'eggs': 2.78,
            'chicken': 8.98,
            'beef': 12.98,
            'bananas': 1.48,
            'cheese': 4.98,
            'rice': 2.98,
            'pasta': 1.48,
            'tomatoes': 2.98
        };

        for (const [key, price] of Object.entries(priceMap)) {
            if (itemLower.includes(key)) {
                return price;
            }
        }

        return 3.98; // Default price
    }

    /**
     * Estimate size based on common grocery items
     */
    private estimateSize(itemName: string): string {
        const itemLower = itemName.toLowerCase();
        
        if (itemLower.includes('milk')) return '1 Gallon';
        if (itemLower.includes('bread')) return '20 oz';
        if (itemLower.includes('eggs')) return '12 count';
        if (itemLower.includes('cheese')) return '8 oz';
        if (itemLower.includes('rice')) return '2 lb';
        if (itemLower.includes('pasta')) return '1 lb';
        
        return 'Regular Size';
    }

    /**
     * Estimate brand preference
     */
    private estimateBrand(itemName: string): string {
        const itemLower = itemName.toLowerCase();
        
        const brandMap: Record<string, string> = {
            'ketchup': 'Heinz',
            'mustard': 'French\'s',
            'mayo': 'Hellmann\'s',
            'peanut butter': 'Jif',
            'cereal': 'General Mills',
            'soda': 'Coca-Cola'
        };

        for (const [key, brand] of Object.entries(brandMap)) {
            if (itemLower.includes(key)) {
                return brand;
            }
        }

        return 'Great Value'; // Walmart's house brand
    }

    /**
     * Add items to Walmart cart
     */
    async addToCart(items: string[]): Promise<{ success: boolean; message: string; addedItems: string[]; failedItems: string[] }> {
        try {
            // Check login status first
            const loginStatus = await this.checkLoginStatus();
            
            if (!loginStatus.isLoggedIn) {
                return {
                    success: false,
                    message: 'Please log into your Walmart account first. We\'ll open Walmart.com for you.',
                    addedItems: [],
                    failedItems: items
                };
            }

            const addedItems: string[] = [];
            const failedItems: string[] = [];

            // Process each item
            for (const item of items) {
                try {
                    const products = await this.searchProduct(item);
                    
                    if (products.length > 0) {
                        const bestMatch = products[0];
                        
                        // For now, we'll open the search page for the item
                        // In a real implementation, this would need more sophisticated cart automation
                        const success = await this.attemptAddToCart(bestMatch);
                        
                        if (success) {
                            addedItems.push(item);
                        } else {
                            failedItems.push(item);
                        }
                    } else {
                        failedItems.push(item);
                    }
                    
                    // Small delay between requests
                    await new Promise(resolve => setTimeout(resolve, 500));
                } catch (error) {
                    console.error(`Error processing item ${item}:`, error);
                    failedItems.push(item);
                }
            }

            const successRate = addedItems.length / items.length;
            
            return {
                success: successRate > 0.5,
                message: `Successfully processed ${addedItems.length} out of ${items.length} items. ${failedItems.length > 0 ? 'Some items may need manual addition.' : ''}`,
                addedItems,
                failedItems
            };

        } catch (error) {
            console.error('Error adding items to Walmart cart:', error);
            return {
                success: false,
                message: 'Unable to add items to cart. Please try again or add items manually.',
                addedItems: [],
                failedItems: items
            };
        }
    }

    /**
     * Attempt to add a single product to cart
     */
    private async attemptAddToCart(product: ProductMatch): Promise<boolean> {
        try {
            // Since we can't directly add to cart due to CORS and security restrictions,
            // we'll open the product page in a new tab for the user
            window.open(product.url, '_blank');
            return true;
        } catch (error) {
            console.error('Error adding product to cart:', error);
            return false;
        }
    }

    /**
     * Open Walmart login page
     */
    openLoginPage(): void {
        window.open('https://www.walmart.com/account/login', '_blank');
    }

    /**
     * Open Walmart grocery section
     */
    openGrocerySection(): void {
        window.open('https://www.walmart.com/browse/food/976759', '_blank');
    }

    /**
     * Create a comprehensive shopping strategy
     */
    async createShoppingStrategy(items: string[]): Promise<{
        loginRequired: boolean;
        searchQueries: Array<{ original: string; optimized: string; estimatedPrice: number }>;
        totalEstimatedCost: number;
        instructions: string[];
    }> {
        const loginStatus = await this.checkLoginStatus();
        
        const searchQueries = items.map(item => ({
            original: item,
            optimized: this.getSmartProductQuery(item),
            estimatedPrice: this.estimatePrice(item)
        }));

        const totalEstimatedCost = searchQueries.reduce((sum, query) => sum + query.estimatedPrice, 0);

        const instructions = [
            '1. Make sure you\'re logged into your Walmart account',
            '2. Click "Add to Walmart Cart" to open optimized search results',
            '3. Review and add the suggested items to your cart',
            '4. Proceed to checkout when ready'
        ];

        if (!loginStatus.isLoggedIn) {
            instructions.unshift('⚠️ Please log into Walmart first using the "Login to Walmart" button');
        }

        return {
            loginRequired: !loginStatus.isLoggedIn,
            searchQueries,
            totalEstimatedCost,
            instructions
        };
    }
}

export default WalmartIntegrationService;
