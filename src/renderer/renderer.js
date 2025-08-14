// Global state
let currentView = 'recipes';
let currentWeekStart = null;
let recipes = [];
let currentWeekPlan = [];
let editingRecipeId = null;
let customShoppingItems = {}; // Store custom items by week

// Initialize the app
document.addEventListener('DOMContentLoaded', async () => {
    setupNavigation();
    setupModals();
    setupEventListeners();
    await loadRecipes();
    setCurrentWeek();
});

// Navigation
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const viewName = item.dataset.view;
            switchView(viewName);
        });
    });
}

function switchView(viewName) {
    // Update nav
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-view="${viewName}"]`).classList.add('active');

    // Update views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.add('hidden');
    });
    document.getElementById(`${viewName}-view`).classList.remove('hidden');

    // Update page title and header button
    const pageTitle = document.getElementById('page-title');
    const addButton = document.getElementById('add-recipe-btn');
    
    switch(viewName) {
        case 'recipes':
            pageTitle.textContent = 'Recipes';
            addButton.style.display = 'block';
            addButton.textContent = 'Add Recipe';
            break;
        case 'menu-board':
            pageTitle.textContent = 'Menu Board';
            addButton.style.display = 'none';
            loadMenuBoard();
            break;
        case 'shopping-list':
            pageTitle.textContent = 'Shopping List';
            addButton.style.display = 'none';
            updateShoppingWeekSelector();
            break;
    }

    currentView = viewName;
}

// Recipe Management
async function loadRecipes() {
    try {
        recipes = await window.electronAPI.getAllRecipes();
        renderRecipes();
    } catch (error) {
        console.error('Error loading recipes:', error);
        showError('Failed to load recipes');
    }
}

function renderRecipes() {
    const container = document.getElementById('recipes-container');
    container.innerHTML = '';

    if (recipes.length === 0) {
        container.innerHTML = '<div class="loading">No recipes yet. Add your first recipe!</div>';
        return;
    }

    recipes.forEach(recipe => {
        const recipeCard = createRecipeCard(recipe);
        container.appendChild(recipeCard);
    });
}

function createRecipeCard(recipe) {
    const card = document.createElement('div');
    card.className = 'recipe-card fade-in';
    card.addEventListener('click', () => editRecipe(recipe));

    const ingredientsList = recipe.ingredients.slice(0, 3).map(ing => ing.name).join(', ');
    const moreIngredients = recipe.ingredients.length > 3 ? ` and ${recipe.ingredients.length - 3} more` : '';

    card.innerHTML = `
        <h3>${recipe.name}</h3>
        ${recipe.category ? `<div style="color: #007aff; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 5px;">${recipe.category}</div>` : ''}
        <div class="recipe-meta">
            ${recipe.servings ? `Serves ${recipe.servings}` : ''}
            ${recipe.prepTime ? ` • ${recipe.prepTime + (recipe.cookTime || 0)} min` : ''}
        </div>
        <div class="ingredients-list">
            ${ingredientsList}${moreIngredients}
        </div>
        ${recipe.tags ? `<div style="margin-top: 10px; font-size: 12px; color: #86868b;">${recipe.tags.join(', ')}</div>` : ''}
    `;

    return card;
}

// Menu Board
function setCurrentWeek() {
    const today = new Date();
    console.log('=== MENU BOARD WEEK CALCULATION ===');
    console.log('Today:', today.toISOString());
    console.log('Today getDay():', today.getDay()); // 0=Sunday
    
    const startOfWeek = new Date(today);
    // Week starts on Sunday (getDay() returns 0 for Sunday)
    const daysToSubtract = today.getDay();
    startOfWeek.setDate(today.getDate() - daysToSubtract);
    
    console.log('Days to subtract:', daysToSubtract);
    console.log('Calculated start of week:', startOfWeek.toISOString());
    
    currentWeekStart = startOfWeek.toISOString().split('T')[0];
    console.log('Final currentWeekStart:', currentWeekStart);
    console.log('=====================================');
    
    updateWeekDisplay();
}

function updateWeekDisplay() {
    const weekDate = new Date(currentWeekStart);
    const endDate = new Date(weekDate);
    endDate.setDate(weekDate.getDate() + 6);
    
    document.getElementById('current-week').textContent = 
        `${weekDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
}

async function loadMenuBoard() {
    try {
        currentWeekPlan = await window.electronAPI.getWeekPlan(currentWeekStart);
        renderMenuBoard();
    } catch (error) {
        console.error('Error loading menu board:', error);
        showError('Failed to load menu board');
    }
}

function renderMenuBoard() {
    const container = document.getElementById('week-container');
    container.innerHTML = '';

    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    currentWeekPlan.forEach((dayPlan, index) => {
        const dayCard = createDayCard(daysOfWeek[index], dayPlan);
        container.appendChild(dayCard);
    });
}

function createDayCard(dayName, dayPlan) {
    const card = document.createElement('div');
    card.className = 'day-card';

    const date = new Date(dayPlan.date);
    const dateStr = date.getDate();

    card.innerHTML = `
        <div class="day-header">${dayName}<br><small>${dateStr}</small></div>
        <div class="meal-slot" data-meal="breakfast" data-date="${dayPlan.date}">
            <strong>Breakfast</strong><br>
            ${getMealDisplay(dayPlan.breakfast)}
        </div>
        <div class="meal-slot" data-meal="lunch" data-date="${dayPlan.date}">
            <strong>Lunch</strong><br>
            ${getMealDisplay(dayPlan.lunch)}
        </div>
        <div class="meal-slot" data-meal="dinner" data-date="${dayPlan.date}">
            <strong>Dinner</strong><br>
            ${getMealDisplay(dayPlan.dinner)}
        </div>
        <div class="meal-slot" data-meal="snacks" data-date="${dayPlan.date}">
            <strong>Snacks</strong><br>
            ${getSnacksDisplay(dayPlan.snacks)}
        </div>
        <div class="meal-slot" data-meal="drinks" data-date="${dayPlan.date}">
            <strong>Drinks</strong><br>
            ${getSnacksDisplay(dayPlan.drinks)}
        </div>
    `;

    // Add click handlers for meal slots
    card.querySelectorAll('.meal-slot').forEach(slot => {
        slot.addEventListener('click', () => {
            const date = slot.dataset.date;
            const mealType = slot.dataset.meal;
            showMealSelector(date, mealType);
        });
    });

    return card;
}

function getMealDisplay(recipeId) {
    if (!recipeId) return '<em>Click to add meal</em>';
    const recipe = recipes.find(r => r.id === recipeId);
    return recipe ? recipe.name : '<em>Recipe not found</em>';
}

function getSnacksDisplay(snackIds) {
    if (!snackIds || snackIds.length === 0) return '<em>Click to add snacks</em>';
    const snackNames = snackIds.map(id => {
        const recipe = recipes.find(r => r.id === id);
        return recipe ? recipe.name : 'Unknown';
    });
    return snackNames.join(', ');
}

function showMealSelector(date, mealType) {
    // Filter and prioritize recipes based on meal type
    const prioritizedRecipes = getPrioritizedRecipes(mealType);
    
    const recipeOptions = prioritizedRecipes.map(recipe => 
        `<option value="${recipe.id}">${recipe.name}${recipe.category ? ` (${recipe.category})` : ''}</option>`
    ).join('');

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Select ${mealType.charAt(0).toUpperCase() + mealType.slice(1)} for ${new Date(date).toLocaleDateString()}</h3>
            <div class="form-group">
                <label>Choose a recipe:</label>
                <select id="meal-recipe-select">
                    <option value="">-- Select a recipe --</option>
                    <option value="NEW_RECIPE">+ Create New Recipe</option>
                    ${recipeOptions}
                </select>
            </div>
            <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button class="button" id="assign-meal-btn">Assign Meal</button>
                <button class="button secondary" id="remove-meal-btn">Remove Meal</button>
                <button class="button secondary" id="cancel-meal-btn">Cancel</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Event handlers
    document.getElementById('assign-meal-btn').addEventListener('click', async () => {
        const recipeId = document.getElementById('meal-recipe-select').value;
        if (recipeId === 'NEW_RECIPE') {
            // Close this modal and show quick recipe creation
            document.body.removeChild(modal);
            showQuickRecipeModal(date, mealType);
        } else if (recipeId) {
            try {
                await window.electronAPI.setMeal(date, mealType, recipeId);
                await loadMenuBoard();
            } catch (error) {
                showError('Failed to assign meal');
            }
            document.body.removeChild(modal);
        }
    });

    document.getElementById('remove-meal-btn').addEventListener('click', async () => {
        try {
            await window.electronAPI.removeMeal(date, mealType);
            await loadMenuBoard();
        } catch (error) {
            showError('Failed to remove meal');
        }
        document.body.removeChild(modal);
    });

    document.getElementById('cancel-meal-btn').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
}

function getPrioritizedRecipes(mealType) {
    // Separate recipes by category match
    const matchingCategory = recipes.filter(recipe => recipe.category === mealType);
    const otherRecipes = recipes.filter(recipe => recipe.category !== mealType);
    
    // Sort each group alphabetically
    matchingCategory.sort((a, b) => a.name.localeCompare(b.name));
    otherRecipes.sort((a, b) => a.name.localeCompare(b.name));
    
    // Return matching category first, then others
    return [...matchingCategory, ...otherRecipes];
}

function showQuickRecipeModal(date, mealType) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Create New Recipe for ${mealType.charAt(0).toUpperCase() + mealType.slice(1)}</h3>
            <form id="quick-recipe-form">
                <div class="form-group">
                    <label for="quick-recipe-name">Recipe Name *</label>
                    <input type="text" id="quick-recipe-name" required placeholder="e.g., Frito Pie">
                </div>

                <div class="form-group">
                    <label for="quick-recipe-category">Meal Category</label>
                    <select id="quick-recipe-category">
                        <option value="breakfast" ${mealType === 'breakfast' ? 'selected' : ''}>Breakfast</option>
                        <option value="lunch" ${mealType === 'lunch' ? 'selected' : ''}>Lunch</option>
                        <option value="dinner" ${mealType === 'dinner' ? 'selected' : ''}>Dinner</option>
                        <option value="snacks" ${mealType === 'snacks' ? 'selected' : ''}>Snacks</option>
                        <option value="drinks" ${mealType === 'drinks' ? 'selected' : ''}>Drinks</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Ingredients *</label>
                    <div id="quick-ingredients-container">
                        <!-- Ingredients will be added here dynamically -->
                    </div>
                    <button type="button" class="button secondary" id="quick-add-ingredient-btn">Add Ingredient</button>
                </div>

                <div class="form-group">
                    <label for="quick-recipe-servings">Servings</label>
                    <input type="number" id="quick-recipe-servings" min="1" value="4">
                </div>

                <div class="form-group">
                    <label for="quick-recipe-instructions">Instructions (optional)</label>
                    <textarea id="quick-recipe-instructions" rows="3" placeholder="Brief cooking instructions..."></textarea>
                </div>

                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button type="submit" class="button">Create & Assign</button>
                    <button type="button" class="button secondary" id="quick-cancel-btn">Cancel</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    // Initialize with one ingredient row
    addQuickIngredientRow();

    // Event handlers
    document.getElementById('quick-add-ingredient-btn').addEventListener('click', () => {
        addQuickIngredientRow();
    });

    document.getElementById('quick-cancel-btn').addEventListener('click', () => {
        document.body.removeChild(modal);
    });

    document.getElementById('quick-recipe-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const recipeName = document.getElementById('quick-recipe-name').value.trim();
        const category = document.getElementById('quick-recipe-category').value;
        const servings = parseInt(document.getElementById('quick-recipe-servings').value) || 4;
        const instructions = document.getElementById('quick-recipe-instructions').value.trim();
        
        // Collect ingredients
        const ingredients = [];
        const ingredientRows = modal.querySelectorAll('.quick-ingredient-row');
        
        ingredientRows.forEach(row => {
            const inputs = row.querySelectorAll('input');
            const name = inputs[0].value.trim();
            const amount = parseFloat(inputs[1].value) || 1;
            const unit = inputs[2].value.trim() || 'unit';
            
            if (name) {
                ingredients.push({
                    id: crypto.randomUUID(),
                    name,
                    amount,
                    unit,
                    category: getCategoryFromIngredientName(name)
                });
            }
        });

        if (ingredients.length === 0) {
            alert('Please add at least one ingredient');
            return;
        }

        const recipe = {
            name: recipeName,
            category: category,
            ingredients,
            servings,
            instructions: instructions ? instructions.split('\n').filter(line => line.trim()) : [],
            tags: [mealType, category] // Add both meal type and category as tags
        };

        try {
            const newRecipe = await window.electronAPI.addRecipe(recipe);
            await window.electronAPI.setMeal(date, mealType, newRecipe.id);
            await loadRecipes(); // Refresh recipes list
            await loadMenuBoard(); // Refresh menu board
            document.body.removeChild(modal);
            
            // Show success message
            showSuccessMessage(`"${recipeName}" created and added to ${mealType}!`);
        } catch (error) {
            console.error('Error creating recipe:', error);
            showError('Failed to create recipe');
        }
    });
}

// Shopping List
function updateShoppingWeekSelector() {
    const weekSelector = document.getElementById('shopping-week-selector');
    if (weekSelector && currentWeekStart) {
        // Set the date selector to the current week start from menu board
        console.log('Setting week selector to:', currentWeekStart);
        weekSelector.value = currentWeekStart;
    }
}

async function generateShoppingList() {
    const weekSelector = document.getElementById('shopping-week-selector');
    let weekStart;
    
    console.log('=== SHOPPING LIST GENERATION DEBUG ===');
    console.log('Week selector value:', weekSelector?.value);
    console.log('Current menu board week (currentWeekStart):', currentWeekStart);
    
    // Always prioritize the current menu board week if no specific selection
    if (weekSelector && weekSelector.value && weekSelector.value !== currentWeekStart) {
        // Use the selected date as the week start
        const selectedDateString = weekSelector.value;
        console.log('Selected date string:', selectedDateString);
        
        // Parse the date more carefully to avoid timezone issues
        const [year, month, day] = selectedDateString.split('-').map(Number);
        const selectedDate = new Date(year, month - 1, day); // month is 0-indexed
        
        console.log('Parsed selected date:', selectedDate.toISOString());
        console.log('Selected date getDay():', selectedDate.getDay()); // 0=Sunday
        
        // Find the Sunday of that week (week starts on Sunday)
        const dayOfWeek = selectedDate.getDay(); // 0 = Sunday
        const weekStartDate = new Date(selectedDate);
        weekStartDate.setDate(selectedDate.getDate() - dayOfWeek);
        weekStart = weekStartDate.toISOString().split('T')[0];
        console.log('Calculated week start from selection:', weekStart);
        console.log('Days subtracted:', dayOfWeek);
        
        // If the user actually selected a Sunday (day 0), don't subtract anything
        if (dayOfWeek === 0) {
            console.log('Selected date is already a Sunday, using as-is');
            weekStart = selectedDateString;
        }
    } else {
        // Use the current menu board week
        weekStart = currentWeekStart;
        console.log('Using current menu board week:', weekStart);
        // Sync the selector
        if (weekSelector) {
            weekSelector.value = currentWeekStart;
            console.log('Synced week selector to:', currentWeekStart);
        }
    }

    console.log('FINAL week start for shopping list generation:', weekStart);
    console.log('Are they equal?', weekStart === currentWeekStart);
    console.log('==========================================');

    try {
        const items = await window.electronAPI.generateShoppingListFromWeek(weekStart);
        console.log('Generated items:', items);
        const categorizedList = await window.electronAPI.getCategorizedShoppingList(items);
        
        // Add any custom items for this week
        if (customShoppingItems[weekStart]) {
            customShoppingItems[weekStart].forEach(customItem => {
                const category = customItem.ingredient.category;
                if (!categorizedList[category]) {
                    categorizedList[category] = [];
                }
                categorizedList[category].push(customItem);
            });
        }
        
        renderShoppingList(categorizedList, weekStart);
    } catch (error) {
        console.error('Error generating shopping list:', error);
        showError('Failed to generate shopping list');
    }
}

function renderShoppingList(categorizedList, weekStart = null) {
    const container = document.getElementById('shopping-list-container');
    container.innerHTML = '';

    if (Object.keys(categorizedList).length === 0) {
        container.innerHTML = '<div class="loading">No items in shopping list. Add some meals to your menu board first!</div>';
        return;
    }

    // Add action buttons
    const actionsCard = document.createElement('div');
    actionsCard.className = 'card';
    actionsCard.innerHTML = `
        <h3>Shopping List Actions</h3>
        <div style="display: flex; gap: 10px; margin-top: 15px; flex-wrap: wrap;">
            <button class="button" id="walmart-add-to-cart-btn" style="background: linear-gradient(135deg, #004c91, #0071ce); color: white; font-weight: bold;">🤖 Smart Walmart Shopping</button>
            <button class="button secondary" id="walmart-login-btn">🏪 Login to Walmart</button>
            <button class="button" id="add-custom-item-btn">➕ Add Custom Item</button>
            <button class="button" id="share-text-btn">📱 Text List</button>
            <button class="button" id="share-email-btn">📧 Email List</button>
            <button class="button secondary" id="copy-list-btn">📋 Copy List</button>
            <button class="button secondary" id="print-list-btn">🖨️ Print List</button>
        </div>
        <div id="walmart-status" style="margin-top: 10px; padding: 10px; border-radius: 8px; background: rgba(0, 76, 145, 0.1); color: #004c91; font-size: 14px; display: none;">
            <strong>Smart Shopping:</strong> <span id="walmart-status-text">Opens intelligent shopping assistant in one tab</span>
        </div>
    `;
    container.appendChild(actionsCard);

    // Render categories
    Object.entries(categorizedList).forEach(([category, items]) => {
        const categorySection = document.createElement('div');
        categorySection.className = 'category-section card';
        
        categorySection.innerHTML = `
            <div class="category-header">${category}</div>
            ${items.map((item, index) => {
                const amount = item.totalAmount || 1;
                const unit = item.ingredient.unit || '';
                const displayAmount = unit ? `${amount} ${unit}` : `${amount}`;
                
                return `
                <div class="shopping-item" data-category="${category}" data-index="${index}">
                    <input type="checkbox" class="checkbox">
                    <div class="item-details">
                        <div class="item-name">${item.ingredient.name}</div>
                        <div class="item-amount">${displayAmount}</div>
                        <div style="font-size: 12px; color: #86868b;">For: ${item.recipes.join(', ')}</div>
                    </div>
                    <button class="delete-item-btn" style="background: #ff3b30; color: white; border: none; border-radius: 4px; padding: 5px 8px; font-size: 12px; cursor: pointer; margin-left: auto;">✕</button>
                </div>
            `}).join('')}
        `;
        
        container.appendChild(categorySection);
    });

    // Add event listeners for delete buttons
    document.querySelectorAll('.delete-item-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const itemElement = e.target.closest('.shopping-item');
            const category = itemElement.dataset.category;
            const index = parseInt(itemElement.dataset.index);
            
            const itemToDelete = categorizedList[category][index];
            
            // Remove the item from the categorized list
            categorizedList[category].splice(index, 1);
            
            // If it was a custom item, also remove from persistent storage
            if (weekStart && itemToDelete.recipes.includes('Custom Item') && customShoppingItems[weekStart]) {
                const customIndex = customShoppingItems[weekStart].findIndex(item => 
                    item.ingredient.name === itemToDelete.ingredient.name
                );
                if (customIndex !== -1) {
                    customShoppingItems[weekStart].splice(customIndex, 1);
                }
            }
            
            // If category is empty, remove it
            if (categorizedList[category].length === 0) {
                delete categorizedList[category];
            }
            
            // Re-render the shopping list
            renderShoppingList(categorizedList, weekStart);
        });
    });

    // Add custom item button
    document.getElementById('add-custom-item-btn')?.addEventListener('click', () => {
        showAddCustomItemModal(categorizedList, weekStart);
    });

    // Walmart integration buttons
    document.getElementById('walmart-login-btn')?.addEventListener('click', async () => {
        try {
            await window.electronAPI.openWalmartLogin();
            showWalmartStatus('Opening Walmart login page...');
        } catch (error) {
            showError('Failed to open Walmart login page');
        }
    });

    document.getElementById('walmart-add-to-cart-btn')?.addEventListener('click', async () => {
        try {
            const allItems = Object.values(categorizedList).flat();
            const itemNames = allItems.map(item => item.ingredient.name);
            
            if (itemNames.length === 0) {
                showError('No items in shopping list to add to cart');
                return;
            }

            showWalmartStatus(`Opening smart shopping assistant for ${itemNames.length} items...`);
            
            await window.electronAPI.openWalmartShoppingAssistant(itemNames);
            showWalmartStatus(`Smart shopping assistant opened! It will automatically find the best products for you.`);
        } catch (error) {
            console.error('Walmart integration error:', error);
            showError('Failed to open smart shopping assistant');
        }
    });

    // Add event listeners for actions
    document.getElementById('share-text-btn')?.addEventListener('click', async () => {
        try {
            const allItems = Object.values(categorizedList).flat();
            const shareableText = await window.electronAPI.createShoppingListText(allItems);
            showShareModal('text', shareableText);
        } catch (error) {
            showError('Failed to create shareable list');
        }
    });

    document.getElementById('share-email-btn')?.addEventListener('click', async () => {
        try {
            const allItems = Object.values(categorizedList).flat();
            const shareableText = await window.electronAPI.createShoppingListText(allItems);
            showShareModal('email', shareableText);
        } catch (error) {
            showError('Failed to create shareable list');
        }
    });

    document.getElementById('copy-list-btn')?.addEventListener('click', async () => {
        try {
            const allItems = Object.values(categorizedList).flat();
            const shareableText = await window.electronAPI.createShoppingListText(allItems);
            await navigator.clipboard.writeText(shareableText);
            showSuccessMessage('Shopping list copied to clipboard!');
        } catch (error) {
            showError('Failed to copy list to clipboard');
        }
    });

    document.getElementById('print-list-btn')?.addEventListener('click', () => {
        window.print();
    });
}

function showShareModal(shareType, shoppingListText) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
        background: white;
        padding: 20px;
        border-radius: 8px;
        max-width: 500px;
        width: 90%;
        max-height: 80%;
        overflow-y: auto;
    `;

    if (shareType === 'text') {
        content.innerHTML = `
            <h3>Share via Text</h3>
            <p>Copy the text below and share it via SMS or messaging app:</p>
            <textarea readonly style="width: 100%; height: 200px; margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">${shoppingListText}</textarea>
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button onclick="this.closest('.modal').remove()" style="padding: 10px 20px; background: #ddd; border: none; border-radius: 4px; cursor: pointer;">Close</button>
                <button onclick="navigator.clipboard.writeText('${shoppingListText.replace(/'/g, "\\'")}').then(() => showSuccessMessage('Copied to clipboard!')); this.closest('.modal').remove();" 
                        style="padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">Copy Text</button>
            </div>
        `;
    } else if (shareType === 'email') {
        const subject = encodeURIComponent('Shopping List - ' + new Date().toLocaleDateString());
        const body = encodeURIComponent(shoppingListText);
        const mailtoLink = `mailto:?subject=${subject}&body=${body}`;
        
        content.innerHTML = `
            <h3>Share via Email</h3>
            <p>Click the button below to open your email app with the shopping list:</p>
            <textarea readonly style="width: 100%; height: 200px; margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">${shoppingListText}</textarea>
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button onclick="this.closest('.modal').remove()" style="padding: 10px 20px; background: #ddd; border: none; border-radius: 4px; cursor: pointer;">Close</button>
                <button onclick="window.location.href='${mailtoLink}'" 
                        style="padding: 10px 20px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer;">Open Email</button>
            </div>
        `;
    }

    modal.appendChild(content);
    document.body.appendChild(modal);

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

function showAddCustomItemModal(categorizedList, weekStart) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
        background: white;
        padding: 20px;
        border-radius: 8px;
        max-width: 400px;
        width: 90%;
    `;

    content.innerHTML = `
        <h3>Add Custom Item</h3>
        <form id="custom-item-form">
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 500;">Item Name:</label>
                <input type="text" id="custom-item-name" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 500;">Amount:</label>
                <input type="number" id="custom-item-amount" min="0" step="0.1" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 500;">Unit:</label>
                <select id="custom-item-unit" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    <option value="pcs">pieces</option>
                    <option value="cups">cups</option>
                    <option value="tbsp">tablespoons</option>
                    <option value="tsp">teaspoons</option>
                    <option value="lbs">pounds</option>
                    <option value="oz">ounces</option>
                    <option value="g">grams</option>
                    <option value="ml">milliliters</option>
                    <option value="l">liters</option>
                    <option value="bags">bags</option>
                    <option value="boxes">boxes</option>
                    <option value="cans">cans</option>
                    <option value="bottles">bottles</option>
                </select>
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 500;">Category:</label>
                <select id="custom-item-category" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    <option value="produce">Produce</option>
                    <option value="dairy">Dairy</option>
                    <option value="meat">Meat & Seafood</option>
                    <option value="pantry">Pantry</option>
                    <option value="frozen">Frozen</option>
                    <option value="bakery">Bakery</option>
                    <option value="snacks">Snacks</option>
                    <option value="other">Other</option>
                </select>
            </div>
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button type="button" onclick="this.closest('.modal').remove()" style="padding: 10px 20px; background: #ddd; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
                <button type="submit" style="padding: 10px 20px; background: #007AFF; color: white; border: none; border-radius: 4px; cursor: pointer;">Add Item</button>
            </div>
        </form>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    // Handle form submission
    document.getElementById('custom-item-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('custom-item-name').value.trim();
        const amount = parseFloat(document.getElementById('custom-item-amount').value);
        const unit = document.getElementById('custom-item-unit').value;
        const category = document.getElementById('custom-item-category').value;

        if (!name || !amount) {
            alert('Please fill in all required fields');
            return;
        }

        // Create new shopping list item
        const customItem = {
            ingredient: {
                name: name,
                amount: amount,
                unit: unit,
                category: category
            },
            totalAmount: amount,
            recipes: ['Custom Item']
        };

        // Add to the appropriate category
        if (!categorizedList[category]) {
            categorizedList[category] = [];
        }
        categorizedList[category].push(customItem);

        // Save to persistent custom items for this week
        if (weekStart) {
            if (!customShoppingItems[weekStart]) {
                customShoppingItems[weekStart] = [];
            }
            customShoppingItems[weekStart].push(customItem);
        }

        // Re-render the shopping list
        renderShoppingList(categorizedList, weekStart);

        // Close modal and show success
        modal.remove();
        showSuccessMessage('Custom item added to shopping list!');
    });

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Modal Management
function setupModals() {
    const recipeModal = document.getElementById('recipe-modal');
    const cancelBtn = document.getElementById('cancel-recipe-btn');
    const recipeForm = document.getElementById('recipe-form');

    cancelBtn.addEventListener('click', () => {
        recipeModal.classList.add('hidden');
        resetRecipeForm();
    });

    recipeForm.addEventListener('submit', handleRecipeSubmit);
}

function showRecipeModal(recipe = null) {
    const modal = document.getElementById('recipe-modal');
    const title = document.getElementById('recipe-modal-title');
    
    editingRecipeId = recipe ? recipe.id : null;
    title.textContent = recipe ? 'Edit Recipe' : 'Add New Recipe';
    
    if (recipe) {
        populateRecipeForm(recipe);
    } else {
        resetRecipeForm();
    }
    
    modal.classList.remove('hidden');
    addInitialIngredientRow();
}

function resetRecipeForm() {
    document.getElementById('recipe-form').reset();
    document.getElementById('ingredients-container').innerHTML = '';
    editingRecipeId = null;
}

function populateRecipeForm(recipe) {
    document.getElementById('recipe-name').value = recipe.name;
    document.getElementById('recipe-category').value = recipe.category || '';
    document.getElementById('recipe-servings').value = recipe.servings || '';
    document.getElementById('recipe-prep-time').value = recipe.prepTime || '';
    document.getElementById('recipe-cook-time').value = recipe.cookTime || '';
    document.getElementById('recipe-instructions').value = recipe.instructions ? recipe.instructions.join('\n') : '';
    document.getElementById('recipe-tags').value = recipe.tags ? recipe.tags.join(', ') : '';

    // Populate ingredients
    const container = document.getElementById('ingredients-container');
    container.innerHTML = '';
    recipe.ingredients.forEach(ingredient => {
        addIngredientRow(ingredient);
    });
}

function addInitialIngredientRow() {
    const container = document.getElementById('ingredients-container');
    if (container.children.length === 0) {
        addIngredientRow();
    }
}

function addIngredientRow(ingredient = null) {
    const container = document.getElementById('ingredients-container');
    const row = document.createElement('div');
    row.className = 'ingredient-row';
    row.style.cssText = 'display: flex; gap: 10px; margin-bottom: 10px; align-items: center;';
    
    row.innerHTML = `
        <input type="text" placeholder="Ingredient name" value="${ingredient ? ingredient.name : ''}" style="flex: 2;">
        <input type="number" placeholder="Amount" value="${ingredient ? ingredient.amount : ''}" step="0.1" style="flex: 1;">
        <input type="text" placeholder="Unit" value="${ingredient ? ingredient.unit : ''}" style="flex: 1;">
        <input type="text" placeholder="Category" value="${ingredient ? ingredient.category || '' : ''}" style="flex: 1;">
        <button type="button" class="button secondary" style="padding: 8px;">Remove</button>
    `;

    // Add remove functionality
    row.querySelector('button').addEventListener('click', () => {
        if (container.children.length > 1) {
            container.removeChild(row);
        }
    });

    container.appendChild(row);
}

async function handleRecipeSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const ingredients = [];
    
    // Collect ingredients
    const ingredientRows = document.querySelectorAll('.ingredient-row');
    ingredientRows.forEach(row => {
        const inputs = row.querySelectorAll('input');
        const name = inputs[0].value.trim();
        const amount = parseFloat(inputs[1].value);
        const unit = inputs[2].value.trim();
        const category = inputs[3].value.trim();
        
        if (name && amount && unit) {
            ingredients.push({
                id: crypto.randomUUID(),
                name,
                amount,
                unit,
                category: category || 'other'
            });
        }
    });

    if (ingredients.length === 0) {
        alert('Please add at least one ingredient');
        return;
    }

    const recipe = {
        name: document.getElementById('recipe-name').value,
        category: document.getElementById('recipe-category').value || undefined,
        ingredients,
        servings: parseInt(document.getElementById('recipe-servings').value) || undefined,
        prepTime: parseInt(document.getElementById('recipe-prep-time').value) || undefined,
        cookTime: parseInt(document.getElementById('recipe-cook-time').value) || undefined,
        instructions: document.getElementById('recipe-instructions').value.split('\n').filter(line => line.trim()),
        tags: document.getElementById('recipe-tags').value.split(',').map(tag => tag.trim()).filter(tag => tag)
    };

    try {
        if (editingRecipeId) {
            await window.electronAPI.updateRecipe(editingRecipeId, recipe);
        } else {
            await window.electronAPI.addRecipe(recipe);
        }
        
        await loadRecipes();
        document.getElementById('recipe-modal').classList.add('hidden');
        resetRecipeForm();
    } catch (error) {
        console.error('Error saving recipe:', error);
        showError('Failed to save recipe');
    }
}

function editRecipe(recipe) {
    showRecipeModal(recipe);
}

// Event Listeners
function setupEventListeners() {
    document.getElementById('add-recipe-btn').addEventListener('click', () => showRecipeModal());
    document.getElementById('add-ingredient-btn').addEventListener('click', () => addIngredientRow());
    
    // Week navigation
    document.getElementById('prev-week')?.addEventListener('click', () => {
        const weekDate = new Date(currentWeekStart);
        weekDate.setDate(weekDate.getDate() - 7);
        currentWeekStart = weekDate.toISOString().split('T')[0];
        updateWeekDisplay();
        loadMenuBoard();
    });

    document.getElementById('next-week')?.addEventListener('click', () => {
        const weekDate = new Date(currentWeekStart);
        weekDate.setDate(weekDate.getDate() + 7);
        currentWeekStart = weekDate.toISOString().split('T')[0];
        updateWeekDisplay();
        loadMenuBoard();
    });

    // Shopping list generation
    document.getElementById('generate-list-btn')?.addEventListener('click', generateShoppingList);
    
    // Sync week button
    document.getElementById('sync-week-btn')?.addEventListener('click', () => {
        console.log('Manual sync requested - setting week selector to:', currentWeekStart);
        const weekSelector = document.getElementById('shopping-week-selector');
        if (weekSelector && currentWeekStart) {
            weekSelector.value = currentWeekStart;
            generateShoppingList(); // Automatically regenerate after sync
        }
    });
}

// Utility Functions
function addQuickIngredientRow() {
    const container = document.getElementById('quick-ingredients-container');
    const row = document.createElement('div');
    row.className = 'quick-ingredient-row';
    row.style.cssText = 'display: flex; gap: 10px; margin-bottom: 10px; align-items: center;';
    
    row.innerHTML = `
        <input type="text" placeholder="Ingredient name" style="flex: 2;" required>
        <input type="number" placeholder="Amount" value="1" step="0.1" style="flex: 1;" min="0">
        <input type="text" placeholder="Unit (cups, lbs, etc.)" style="flex: 1;">
        <button type="button" class="button secondary" style="padding: 8px; min-width: 70px;">Remove</button>
    `;

    // Add remove functionality
    row.querySelector('button').addEventListener('click', () => {
        const container = document.getElementById('quick-ingredients-container');
        if (container.children.length > 1) {
            container.removeChild(row);
        }
    });

    container.appendChild(row);
}

function getCategoryFromIngredientName(name) {
    const categoryMappings = {
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

    const lowerName = name.toLowerCase();
    return categoryMappings[lowerName] || 'other';
}

function showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #34c759;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        z-index: 1000;
        box-shadow: 0 4px 15px rgba(52, 199, 89, 0.3);
    `;
    successDiv.textContent = message;
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        document.body.removeChild(successDiv);
    }, 3000);
}

function showWalmartStatus(message) {
    const statusDiv = document.getElementById('walmart-status');
    const statusText = document.getElementById('walmart-status-text');
    
    if (statusDiv && statusText) {
        statusText.textContent = message;
        statusDiv.style.display = 'block';
        
        // Hide after 5 seconds
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 5000);
    }
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff3b30;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        z-index: 1000;
        box-shadow: 0 4px 15px rgba(255, 59, 48, 0.3);
    `;
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        document.body.removeChild(errorDiv);
    }, 4000);
}
