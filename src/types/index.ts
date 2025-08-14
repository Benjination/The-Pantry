export interface Recipe {
  id: string;
  name: string;
  ingredients: Ingredient[];
  instructions?: string[];
  servings?: number;
  prepTime?: number; // in minutes
  cookTime?: number; // in minutes
  tags?: string[];
  category?: MealCategory; // New field for meal category
}

export interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
  category?: string; // e.g., 'produce', 'dairy', 'meat', 'pantry'
}

export interface MealPlan {
  date: string; // ISO date string
  breakfast?: string; // recipe ID
  lunch?: string; // recipe ID
  dinner?: string; // recipe ID
  snacks?: string[]; // array of recipe IDs
  drinks?: string[]; // array of recipe IDs for drinks
}

export interface ShoppingListItem {
  ingredient: Ingredient;
  totalAmount: number;
  recipes: string[]; // recipe names that need this ingredient
}

export interface CategorizedShoppingList {
  [category: string]: ShoppingListItem[];
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snacks' | 'drinks';
export type MealCategory = 'breakfast' | 'lunch' | 'dinner' | 'snacks' | 'drinks';
