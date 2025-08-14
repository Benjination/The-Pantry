import { Recipe, Ingredient, ShoppingListItem, CategorizedShoppingList } from '../types';
const { RecipeManager } = require('./RecipeManager');
const { MenuPlanManager } = require('./MenuPlanManager');

class ShoppingListManager {
  private recipeManager: any;
  private menuPlanManager: any;

  constructor() {
    // Will be set by dependency injection
  }

  public setRecipeManager(recipeManager: any): void {
    this.recipeManager = recipeManager;
  }

  public setMenuPlanManager(menuPlanManager: any): void {
    this.menuPlanManager = menuPlanManager;
  }

  public generateFromWeekPlan(weekStartDate: string): ShoppingListItem[] {
    console.log('ShoppingListManager: generating from week starting', weekStartDate);
    const plannedRecipeIds = this.menuPlanManager.getPlannedRecipeIds(weekStartDate);
    console.log('Planned recipe IDs:', plannedRecipeIds);
    console.log('Number of planned recipes:', plannedRecipeIds.length);
    const ingredientMap = new Map<string, ShoppingListItem>();

    plannedRecipeIds.forEach((recipeId: string, recipeIndex: number) => {
      console.log(`\n--- Processing recipe ${recipeIndex + 1} with ID: ${recipeId} ---`);
      
      if (!recipeId || recipeId.trim() === '') {
        console.warn(`⚠️  Empty recipe ID at index ${recipeIndex}, skipping`);
        return;
      }
      
      const recipe = this.recipeManager.getRecipeById(recipeId);
      
      if (!recipe) {
        console.error(`❌ Recipe with ID ${recipeId} not found in recipe database!`);
        return;
      }
      
      console.log(`✅ Found recipe: "${recipe.name}"`);
      console.log('Recipe object:', recipe);
      
      // Check if ingredients exist and is an array
      if (!recipe.ingredients) {
        console.warn(`⚠️  Recipe "${recipe.name}" has no ingredients property`);
        return;
      }
      
      if (!Array.isArray(recipe.ingredients)) {
        console.warn(`⚠️  Recipe "${recipe.name}" ingredients is not an array:`, typeof recipe.ingredients);
        return;
      }
      
      console.log('Number of ingredients in this recipe:', recipe.ingredients.length);
      
      if (recipe.ingredients.length === 0) {
        console.warn(`⚠️  Recipe "${recipe.name}" has empty ingredients array`);
        return;
      }
      
      recipe.ingredients.forEach((ingredient: any, index: number) => {
        console.log(`  Raw ingredient ${index + 1}:`, ingredient);
        
        // Provide robust defaults for missing data
        const safeIngredient = {
          id: ingredient.id || `temp-${Date.now()}-${index}`,
          name: ingredient.name || `Unknown Ingredient ${index + 1}`,
          amount: ingredient.amount || 1,
          unit: ingredient.unit || 'unit',
          category: ingredient.category || 'other'
        };
        
        console.log(`  Processed ingredient ${index + 1}/${recipe.ingredients.length}:`, safeIngredient);
        
        const key = safeIngredient.name.toLowerCase();
        
        if (ingredientMap.has(key)) {
          const existing = ingredientMap.get(key)!;
          console.log('    ⚡ Found existing ingredient:', existing.ingredient.name, 'current total:', existing.totalAmount);
          // Only add amounts if they have the same unit (or both have no unit)
          if (existing.ingredient.unit === safeIngredient.unit) {
            existing.totalAmount += safeIngredient.amount;
            console.log('    ✅ Added amounts, new total:', existing.totalAmount);
          } else {
            // Create a new entry with different unit
            const newKey = `${key}_${safeIngredient.unit}`;
            console.log('    🔄 Creating new entry with different unit:', newKey);
            ingredientMap.set(newKey, {
              ingredient: { ...safeIngredient },
              totalAmount: safeIngredient.amount,
              recipes: [recipe.name]
            });
            return;
          }
          existing.recipes.push(recipe.name);
        } else {
          console.log('    ➕ Creating new ingredient entry:', safeIngredient.name, 'amount:', safeIngredient.amount);
          ingredientMap.set(key, {
            ingredient: { ...safeIngredient },
            totalAmount: safeIngredient.amount,
            recipes: [recipe.name]
          });
        }
      });
      
      console.log(`✅ Finished processing recipe "${recipe.name}" - processed ${recipe.ingredients.length} ingredients`);
    });

    const result = Array.from(ingredientMap.values());
    console.log('\n=== FINAL SHOPPING LIST SUMMARY ===');
    console.log(`Total recipes processed: ${plannedRecipeIds.length}`);
    console.log('Total unique ingredients:', result.length);
    result.forEach((item, index) => {
      console.log(`${index + 1}: ${item.ingredient.name} - ${item.totalAmount} ${item.ingredient.unit} (for: ${item.recipes.join(', ')})`);
    });
    console.log('=====================================\n');
    return result;
  }

  public categorizeItems(items: ShoppingListItem[]): CategorizedShoppingList {
    const categorized: CategorizedShoppingList = {};

    // Define category mappings for common ingredients
    const categoryMappings: { [key: string]: string } = {
      // Produce
      'apple': 'produce', 'banana': 'produce', 'orange': 'produce', 'lettuce': 'produce',
      'tomato': 'produce', 'onion': 'produce', 'garlic': 'produce', 'carrot': 'produce',
      'potato': 'produce', 'bell pepper': 'produce', 'spinach': 'produce', 'broccoli': 'produce',
      
      // Dairy
      'milk': 'dairy', 'cheese': 'dairy', 'shredded cheese': 'dairy', 'parmesan cheese': 'dairy',
      'butter': 'dairy', 'yogurt': 'dairy', 'cream': 'dairy', 'eggs': 'dairy',
      
      // Meat & Seafood
      'chicken': 'meat', 'beef': 'meat', 'ground beef': 'meat', 'pork': 'meat',
      'turkey': 'meat', 'fish': 'meat', 'salmon': 'meat', 'shrimp': 'meat',
      
      // Pantry/Dry Goods
      'rice': 'pantry', 'pasta': 'pantry', 'spaghetti': 'pantry', 'flour': 'pantry',
      'sugar': 'pantry', 'salt': 'pantry', 'pepper': 'pantry', 'oil': 'pantry',
      'olive oil': 'pantry', 'beans': 'pantry', 'ranch style beans': 'pantry',
      'marinara sauce': 'pantry', 'tomato sauce': 'pantry', 'bread': 'bakery',
      
      // Snacks
      'fritos': 'snacks', 'chips': 'snacks', 'crackers': 'snacks',
      
      // Frozen
      'frozen': 'frozen', 'ice cream': 'frozen'
    };

    items.forEach(item => {
      let category = item.ingredient.category;
      
      // If no category is specified, try to determine it from the ingredient name
      if (!category) {
        const ingredientName = item.ingredient.name.toLowerCase();
        category = categoryMappings[ingredientName] || 'other';
      }

      if (!categorized[category]) {
        categorized[category] = [];
      }
      
      categorized[category].push(item);
    });

    // Sort items within each category alphabetically
    Object.keys(categorized).forEach(category => {
      categorized[category].sort((a, b) => 
        a.ingredient.name.localeCompare(b.ingredient.name)
      );
    });

    return categorized;
  }

  public createShoppingListText(items: ShoppingListItem[]): string {
    // Simple formatted shopping list for sharing
    const formattedItems = items.map(item => {
      const amount = item.totalAmount || 1;
      const unit = item.ingredient.unit || '';
      const quantity = unit ? `${amount} ${unit}` : `${amount}`;
      
      return {
        name: item.ingredient.name,
        quantity: quantity,
        notes: `For: ${item.recipes.join(', ')}`
      };
    });

    const listText = formattedItems.map(item => 
      `• ${item.name} - ${item.quantity}`
    ).join('\n');

    return `🛒 Shopping List\n\n${listText}\n\nGenerated by Pantry Meal Planner`;
  }

  public formatShoppingListForPrint(categorizedList: CategorizedShoppingList): string {
    let formatted = 'SHOPPING LIST\n';
    formatted += '='.repeat(40) + '\n\n';

    // Define the order of categories for better shopping flow
    const categoryOrder = ['produce', 'meat', 'dairy', 'frozen', 'pantry', 'bakery', 'snacks', 'other'];
    
    categoryOrder.forEach(category => {
      if (categorizedList[category] && categorizedList[category].length > 0) {
        formatted += `${category.toUpperCase()}\n`;
        formatted += '-'.repeat(20) + '\n';
        
        categorizedList[category].forEach(item => {
          formatted += `☐ ${item.ingredient.name} - ${item.totalAmount} ${item.ingredient.unit}\n`;
          if (item.recipes.length > 0) {
            formatted += `   (for: ${item.recipes.join(', ')})\n`;
          }
        });
        
        formatted += '\n';
      }
    });

    return formatted;
  }
}

module.exports = { ShoppingListManager };
