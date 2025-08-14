import { contextBridge, ipcRenderer } from 'electron';
import { Recipe, MealPlan, MealType, ShoppingListItem, CategorizedShoppingList } from './types';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Recipe management
  getAllRecipes: (): Promise<Recipe[]> => ipcRenderer.invoke('recipe:getAll'),
  addRecipe: (recipe: Omit<Recipe, 'id'>): Promise<Recipe> => ipcRenderer.invoke('recipe:add', recipe),
  updateRecipe: (id: string, recipe: Partial<Recipe>): Promise<Recipe | null> => 
    ipcRenderer.invoke('recipe:update', id, recipe),
  deleteRecipe: (id: string): Promise<boolean> => ipcRenderer.invoke('recipe:delete', id),

  // Menu planning
  getWeekPlan: (weekStart: string): Promise<MealPlan[]> => 
    ipcRenderer.invoke('menu:getWeekPlan', weekStart),
  setMeal: (date: string, mealType: MealType, recipeId: string): Promise<MealPlan> => 
    ipcRenderer.invoke('menu:setMeal', date, mealType, recipeId),
  removeMeal: (date: string, mealType: MealType): Promise<MealPlan | null> => 
    ipcRenderer.invoke('menu:removeMeal', date, mealType),

  // Shopping list
  generateShoppingListFromWeek: (weekStart: string): Promise<ShoppingListItem[]> => 
    ipcRenderer.invoke('shopping:generateFromWeek', weekStart),
  getCategorizedShoppingList: (items: ShoppingListItem[]): Promise<CategorizedShoppingList> => 
    ipcRenderer.invoke('shopping:getCategorizedList', items),
  createShoppingListText: (items: ShoppingListItem[]): Promise<string> => 
    ipcRenderer.invoke('shopping:createShoppingText', items)
});

// Type declaration for the exposed API
declare global {
  interface Window {
    electronAPI: {
      getAllRecipes: () => Promise<Recipe[]>;
      addRecipe: (recipe: Omit<Recipe, 'id'>) => Promise<Recipe>;
      updateRecipe: (id: string, recipe: Partial<Recipe>) => Promise<Recipe | null>;
      deleteRecipe: (id: string) => Promise<boolean>;
      getWeekPlan: (weekStart: string) => Promise<MealPlan[]>;
      setMeal: (date: string, mealType: MealType, recipeId: string) => Promise<MealPlan>;
      removeMeal: (date: string, mealType: MealType) => Promise<MealPlan | null>;
      generateShoppingListFromWeek: (weekStart: string) => Promise<ShoppingListItem[]>;
      getCategorizedShoppingList: (items: ShoppingListItem[]) => Promise<CategorizedShoppingList>;
      createShoppingListText: (items: ShoppingListItem[]) => Promise<string>;
    };
  }
}
