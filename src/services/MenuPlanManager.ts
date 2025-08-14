import { MealPlan, MealType } from '../types';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

class MenuPlanManager {
  private menuPlansFilePath: string;
  private menuPlans: MealPlan[] = [];

  constructor() {
    const userDataPath = app.getPath('userData');
    this.menuPlansFilePath = path.join(userDataPath, 'menu-plans.json');
    this.loadMenuPlans();
  }

  private loadMenuPlans(): void {
    try {
      if (fs.existsSync(this.menuPlansFilePath)) {
        const data = fs.readFileSync(this.menuPlansFilePath, 'utf-8');
        this.menuPlans = JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading menu plans:', error);
      this.menuPlans = [];
    }
  }

  private saveMenuPlans(): void {
    try {
      fs.writeFileSync(this.menuPlansFilePath, JSON.stringify(this.menuPlans, null, 2));
    } catch (error) {
      console.error('Error saving menu plans:', error);
    }
  }

  private getOrCreateMealPlan(date: string): MealPlan {
    let mealPlan = this.menuPlans.find(plan => plan.date === date);
    if (!mealPlan) {
      mealPlan = { date };
      this.menuPlans.push(mealPlan);
    }
    return mealPlan;
  }

  public getWeekPlan(weekStartDate: string): MealPlan[] {
    const startDate = new Date(weekStartDate);
    const weekPlans: MealPlan[] = [];

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateString = currentDate.toISOString().split('T')[0];
      
      const existingPlan = this.menuPlans.find(plan => plan.date === dateString);
      weekPlans.push(existingPlan || { date: dateString });
    }

    return weekPlans;
  }

  public setMeal(date: string, mealType: MealType, recipeId: string): MealPlan {
    const mealPlan = this.getOrCreateMealPlan(date);

    if (mealType === 'snacks' || mealType === 'drinks') {
      if (!mealPlan[mealType]) {
        mealPlan[mealType] = [];
      }
      if (!mealPlan[mealType]!.includes(recipeId)) {
        mealPlan[mealType]!.push(recipeId);
      }
    } else {
      mealPlan[mealType] = recipeId;
    }

    this.saveMenuPlans();
    return mealPlan;
  }

  public removeMeal(date: string, mealType: MealType, recipeId?: string): MealPlan | null {
    const mealPlan = this.menuPlans.find(plan => plan.date === date);
    if (!mealPlan) {
      return null;
    }

    if ((mealType === 'snacks' || mealType === 'drinks') && recipeId) {
      if (mealPlan[mealType]) {
        mealPlan[mealType] = mealPlan[mealType]!.filter(id => id !== recipeId);
        if (mealPlan[mealType]!.length === 0) {
          delete mealPlan[mealType];
        }
      }
    } else {
      delete mealPlan[mealType];
    }

    this.saveMenuPlans();
    return mealPlan;
  }

  public getMealPlan(date: string): MealPlan | undefined {
    return this.menuPlans.find(plan => plan.date === date);
  }

  public getAllMealPlans(): MealPlan[] {
    return this.menuPlans;
  }

  public clearWeekPlan(weekStartDate: string): void {
    const startDate = new Date(weekStartDate);
    
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateString = currentDate.toISOString().split('T')[0];
      
      const index = this.menuPlans.findIndex(plan => plan.date === dateString);
      if (index !== -1) {
        this.menuPlans.splice(index, 1);
      }
    }

    this.saveMenuPlans();
  }

  public getPlannedRecipeIds(weekStartDate: string): string[] {
    console.log('MenuPlanManager: Getting planned recipe IDs for week starting:', weekStartDate);
    const weekPlans = this.getWeekPlan(weekStartDate);
    console.log('Found week plans:', weekPlans);
    console.log('Number of days with plans:', weekPlans.length);
    
    const recipeIds = new Set<string>();

    weekPlans.forEach((plan, dayIndex) => {
      console.log(`Day ${dayIndex + 1} (${plan.date}):`);
      if (plan.breakfast) {
        console.log('  Breakfast:', plan.breakfast);
        recipeIds.add(plan.breakfast);
      }
      if (plan.lunch) {
        console.log('  Lunch:', plan.lunch);
        recipeIds.add(plan.lunch);
      }
      if (plan.dinner) {
        console.log('  Dinner:', plan.dinner);
        recipeIds.add(plan.dinner);
      }
      if (plan.snacks && plan.snacks.length > 0) {
        console.log('  Snacks:', plan.snacks);
        plan.snacks.forEach(snackId => recipeIds.add(snackId));
      }
      if (plan.drinks && plan.drinks.length > 0) {
        console.log('  Drinks:', plan.drinks);
        plan.drinks.forEach(drinkId => recipeIds.add(drinkId));
      }
      
      if (!plan.breakfast && !plan.lunch && !plan.dinner && 
          (!plan.snacks || plan.snacks.length === 0) && 
          (!plan.drinks || plan.drinks.length === 0)) {
        console.log('  No meals planned for this day');
      }
    });

    const finalIds = Array.from(recipeIds);
    console.log('All unique recipe IDs found:', finalIds);
    return finalIds;
  }
}

module.exports = { MenuPlanManager };
