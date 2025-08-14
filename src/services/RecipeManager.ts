import { Recipe } from '../types';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { v4 as uuidv4 } from 'uuid';

class RecipeManager {
  private recipesFilePath: string;
  private recipes: Recipe[] = [];

  constructor() {
    const userDataPath = app.getPath('userData');
    this.recipesFilePath = path.join(userDataPath, 'recipes.json');
    this.loadRecipes();
  }

  private loadRecipes(): void {
    try {
      if (fs.existsSync(this.recipesFilePath)) {
        const data = fs.readFileSync(this.recipesFilePath, 'utf-8');
        this.recipes = JSON.parse(data);
      } else {
        // Initialize with some sample recipes
        this.recipes = this.getDefaultRecipes();
        this.saveRecipes();
      }
    } catch (error) {
      console.error('Error loading recipes:', error);
      this.recipes = this.getDefaultRecipes();
    }
  }

  private saveRecipes(): void {
    try {
      fs.writeFileSync(this.recipesFilePath, JSON.stringify(this.recipes, null, 2));
    } catch (error) {
      console.error('Error saving recipes:', error);
    }
  }

  private getDefaultRecipes(): Recipe[] {
    return [
      {
        id: uuidv4(),
        name: 'Frito Pie',
        ingredients: [
          {
            id: uuidv4(),
            name: 'Fritos',
            amount: 1,
            unit: 'bag',
            category: 'snacks'
          },
          {
            id: uuidv4(),
            name: 'Ranch Style Beans',
            amount: 1,
            unit: 'can',
            category: 'pantry'
          },
          {
            id: uuidv4(),
            name: 'Shredded Cheese',
            amount: 1,
            unit: 'cup',
            category: 'dairy'
          }
        ],
        instructions: [
          'Heat ranch style beans in a saucepan',
          'Place Fritos in a bowl',
          'Pour heated beans over Fritos',
          'Top with shredded cheese',
          'Serve immediately'
        ],
        servings: 4,
        prepTime: 5,
        cookTime: 10,
        tags: ['quick', 'comfort-food', 'tex-mex']
      },
      {
        id: uuidv4(),
        name: 'Spaghetti and Meatballs',
        ingredients: [
          {
            id: uuidv4(),
            name: 'Spaghetti',
            amount: 1,
            unit: 'lb',
            category: 'pantry'
          },
          {
            id: uuidv4(),
            name: 'Ground Beef',
            amount: 1,
            unit: 'lb',
            category: 'meat'
          },
          {
            id: uuidv4(),
            name: 'Marinara Sauce',
            amount: 1,
            unit: 'jar',
            category: 'pantry'
          },
          {
            id: uuidv4(),
            name: 'Parmesan Cheese',
            amount: 0.5,
            unit: 'cup',
            category: 'dairy'
          }
        ],
        instructions: [
          'Cook spaghetti according to package directions',
          'Form ground beef into meatballs',
          'Cook meatballs in a large skillet',
          'Add marinara sauce and simmer',
          'Serve over spaghetti with parmesan cheese'
        ],
        servings: 6,
        prepTime: 15,
        cookTime: 30,
        tags: ['italian', 'comfort-food', 'family-friendly']
      }
    ];
  }

  public getAllRecipes(): Recipe[] {
    return this.recipes;
  }

  public getRecipeById(id: string): Recipe | undefined {
    return this.recipes.find(recipe => recipe.id === id);
  }

  public addRecipe(recipe: Omit<Recipe, 'id'>): Recipe {
    const newRecipe: Recipe = {
      ...recipe,
      id: uuidv4()
    };
    
    // Ensure all ingredients have IDs
    newRecipe.ingredients = newRecipe.ingredients.map(ingredient => ({
      ...ingredient,
      id: ingredient.id || uuidv4()
    }));

    this.recipes.push(newRecipe);
    this.saveRecipes();
    return newRecipe;
  }

  public updateRecipe(id: string, updatedRecipe: Partial<Recipe>): Recipe | null {
    const index = this.recipes.findIndex(recipe => recipe.id === id);
    if (index === -1) {
      return null;
    }

    this.recipes[index] = { ...this.recipes[index], ...updatedRecipe, id };
    this.saveRecipes();
    return this.recipes[index];
  }

  public deleteRecipe(id: string): boolean {
    const index = this.recipes.findIndex(recipe => recipe.id === id);
    if (index === -1) {
      return false;
    }

    this.recipes.splice(index, 1);
    this.saveRecipes();
    return true;
  }

  public searchRecipes(query: string): Recipe[] {
    const lowercaseQuery = query.toLowerCase();
    return this.recipes.filter(recipe => 
      recipe.name.toLowerCase().includes(lowercaseQuery) ||
      recipe.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
      recipe.ingredients.some(ingredient => 
        ingredient.name.toLowerCase().includes(lowercaseQuery)
      )
    );
  }
}

module.exports = { RecipeManager };
