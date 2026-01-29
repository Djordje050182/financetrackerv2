import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Wallet, TrendingUp, DollarSign, Plus, Trash2, MessageCircle, Target, Calendar, Upload, FileText, HelpCircle, Search, Filter, SlidersHorizontal, BarChart3, MessageSquare, Coins } from 'lucide-react';

const FinanceTracker = () => {
  const [expenses, setExpenses] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    category: 'Eating & Drinking Out',
    date: new Date().toISOString().split('T')[0],
    suggestedCategory: null,
    confidence: null
  });
  const [aiResponse, setAiResponse] = useState('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [activeView, setActiveView] = useState('tracker');
  const [isLoading, setIsLoading] = useState(true);
  const [csvImportStatus, setCsvImportStatus] = useState('');
  const [isCategorizingExpense, setIsCategorizingExpense] = useState(false);
  const [pendingImports, setPendingImports] = useState([]);
  const [userPreferences, setUserPreferences] = useState({});
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [bulkUpdateModal, setBulkUpdateModal] = useState(null);
  const [saveNotification, setSaveNotification] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [modalFilter, setModalFilter] = useState('');
  const [modalSort, setModalSort] = useState('amount-desc');
  const [advisorTone, setAdvisorTone] = useState('encouraging');
  const [undoStack, setUndoStack] = useState([]);
  const [income, setIncome] = useState([]);
  const [aiChatMessages, setAiChatMessages] = useState([]);
  const [aiChatInput, setAiChatInput] = useState('');
  const [isAiChatLoading, setIsAiChatLoading] = useState(false);
  const [incomeImportStatus, setIncomeImportStatus] = useState('');
  const [pendingIncomeImports, setPendingIncomeImports] = useState([]);
  
  // New features
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [recurringExpenses, setRecurringExpenses] = useState([]);
  const [splitExpenseModal, setSplitExpenseModal] = useState(null);
  const [previousMonthData, setPreviousMonthData] = useState(null);

  const incomeCategories = ['Salary (Net)', 'Salary (Gross)', 'Freelance', 'Rental Income', 'Investment Income', 'Business Income', 'Government Benefits', 'Gift/Inheritance', 'Other'];
  const incomeCategoryColors = {
    'Salary (Net)': '#2ECC71',
    'Salary (Gross)': '#27AE60',
    'Freelance': '#3498DB',
    'Rental Income': '#9B59B6',
    'Investment Income': '#F39C12',
    'Business Income': '#E67E22',
    'Government Benefits': '#1ABC9C',
    'Gift/Inheritance': '#E74C3C',
    'Other': '#95A5A6'
  };

  const categories = ['Supermarket', 'Eating & Drinking Out', 'Coffee', 'Alcohol', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Subscriptions & Memberships', 'Rent & Mortgage', 'Health', 'Kids', 'Holiday', 'Other'];
  const categoryColors = {
    'Supermarket': '#2ECC71',
    'Eating & Drinking Out': '#FF6B6B',
    'Coffee': '#8B4513',
    'Alcohol': '#9B59B6',
    'Transport': '#4ECDC4',
    'Entertainment': '#FFE66D',
    'Shopping': '#A8E6CF',
    'Bills': '#FF8B94',
    'Subscriptions & Memberships': '#3498DB',
    'Rent & Mortgage': '#E67E22',
    'Health': '#C7CEEA',
    'Kids': '#FF69B4',
    'Holiday': '#FF8C00',
    'Other': '#B4A7D6'
  };

  // Helper to get category color with fallback for old/invalid categories
  const getCategoryColor = (category) => {
    return categoryColors[category] || categoryColors['Other'];
  };

  // Filter expenses by date range
  const getFilteredExpenses = () => {
    if (!dateRange.start && !dateRange.end) return expenses;
    
    return expenses.filter(e => {
      const expenseDate = new Date(e.date);
      if (dateRange.start && expenseDate < new Date(dateRange.start)) return false;
      if (dateRange.end && expenseDate > new Date(dateRange.end)) return false;
      return true;
    });
  };

  // Get comparison data for trends
  const getComparisonData = () => {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const thisMonth = expenses.filter(e => {
      const d = new Date(e.date);
      return d >= thisMonthStart;
    }).reduce((sum, e) => sum + e.amount, 0);

    const lastMonth = expenses.filter(e => {
      const d = new Date(e.date);
      return d >= lastMonthStart && d <= lastMonthEnd;
    }).reduce((sum, e) => sum + e.amount, 0);

    const change = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;

    return {
      thisMonth,
      lastMonth,
      change,
      isIncrease: thisMonth > lastMonth
    };
  };

  // Comprehensive merchant database
  const merchantDatabase = {
    'Supermarket': [
      'woolworths', 'woolies', 'coles', 'aldi', 'iga', 'foodworks',
      'grocery', 'supermarket', 'groceries',
      'harris farm', 'organic', 'fresh', 'fruit', 'veg', 'market',
      'butcher', 'deli'
    ],
    'Eating & Drinking Out': [
      'mcdonalds', 'mcdonald', 'kfc', 'hungry jacks', 'subway', 'dominos', 'pizza hut',
      'restaurant', 'bistro', 'bakery',
      'uber eats', 'menulog', 'deliveroo', 'doordash',
      'food', 'dining', 'lunch', 'dinner', 'breakfast', 'takeaway', 'take away',
      'grill', 'kitchen', 'eatery', 'noodle', 'sushi', 'thai', 'italian', 'chinese',
      'pizza', 'burger', 'chicken', 'fish and chips', 'kebab', 'poke',
      'vietnamese', 'japanese', 'korean', 'mexican', 'indian', 'greek',
      'bar', 'pub', 'hotel', 'tavern', 'brewery', 'brewing', 'taphouse', 'alehouse',
      'nightclub', 'club', 'lounge', 'cocktail bar', 'wine bar',
      'felons', 'little bang', 'balter', 'stone and wood', 'green beacon'
    ],
    'Coffee': [
      'cafe', 'coffee', 'espresso', 'barista', 'roasters', 'roastery', 'brew', 'bean', 'beans',
      'starbucks', 'gloria jeans', 'the coffee club', 'zarraffa',
      'campos', 'toby estate', 'allpress', 'single o', 'pablo', 'rusty',
      'latte', 'cappuccino', 'flat white', 'macchiato', 'mocha',
      'cup', 'grind', 'espresso bar', 'coffee bar', 'daily grind',
      'coffee shop', 'coffeehouse', 'coffee house', 'java', 'bean bar',
      'the grounds', 'single origin', 'specialty coffee', 'artisan coffee',
      'brewtown', 'coffee co', 'roasting', 'coffee roasting'
    ],
    'Alcohol': [
      'liquor', 'bottle shop', 'dan murphy', 'bws', 'vintage cellars', 'first choice',
      'wine', 'beer', 'spirits', 'brewhouse', 'winery', 'cellar'
    ],
    'Transport': [
      'shell', 'bp', 'caltex', 'ampol', '7-eleven', 'servo', 'petrol', 'fuel', 'gas station',
      'uber', 'taxi', 'cab', 'ola', 'didi', 'shebah', 'lyft',
      'opal', 'myki', 'transport', 'metro', 'train', 'bus', 'tram', 'ferry',
      'parking', 'toll', 'e-toll', 'etoll', 'rego', 'registration',
      'mechanic', 'service', 'tyre', 'tire', 'car wash', 'carwash', 'automotive', 'auto',
      'airport', 'flight', 'qantas', 'virgin', 'jetstar', 'airline',
      'car rental', 'rental car', 'hertz', 'budget', 'thrifty', 'europcar',
      'repairs', 'smash', 'panel', 'detailing'
    ],
    'Entertainment': [
      'cinema', 'movie', 'hoyts', 'event', 'village', 'reading',
      'gaming', 'playstation', 'xbox', 'nintendo', 'steam', 'game',
      'concert', 'ticketek', 'ticketmaster', 'festival', 'show', 'theatre',
      'sports', 'amusement', 'theme park'
    ],
    'Shopping': [
      'kmart', 'target', 'big w', 'myer', 'david jones',
      'bunnings', 'mitre 10', 'hardware', 'ikea',
      'jb hi-fi', 'jb hifi', 'harvey norman', 'good guys', 'electronics',
      'amazon', 'ebay', 'catch', 'kogan', 'online',
      'chemist', 'pharmacy', 'priceline', 'chemist warehouse',
      'clothing', 'fashion', 'shoes', 'apparel', 'retail',
      'officeworks', 'office', 'stationary',
      'jewel', 'gift', 'flower', 'florist'
    ],
    'Bills': [
      'telstra', 'optus', 'vodafone', 'phone', 'mobile', 'internet', 'nbn',
      'electricity', 'gas', 'water', 'energy', 'agl', 'origin', 'utilities',
      'council', 'rates', 'strata',
      'insurance', 'aami', 'nrma', 'budget direct', 'youi',
      'bank', 'interest', 'loan', 'payment', 'fee'
    ],
    'Subscriptions & Memberships': [
      'netflix', 'spotify', 'disney', 'stan', 'binge', 'paramount', 'apple tv',
      'youtube premium', 'amazon prime', 'hbo', 'streaming',
      'subscription', 'membership', 'monthly', 'annual', 'yearly',
      'gym', 'fitness', 'anytime fitness', 'f45', 'crossfit', 'yoga', 'pilates',
      'patreon', 'onlyfans', 'substack',
      'adobe', 'microsoft 365', 'office 365', 'dropbox', 'google one',
      'icloud', 'storage', 'cloud',
      'audible', 'kindle unlimited', 'scribd'
    ],
    'Rent & Mortgage': [
      'rent', 'rental', 'lease', 'landlord', 'tenant',
      'mortgage', 'home loan', 'housing loan',
      'real estate', 'property management', 'ray white', 'lj hooker',
      'realestate.com', 'domain', 'property manager',
      'rent payment', 'monthly rent', 'weekly rent',
      'mortgage payment', 'home repayment', 'loan repayment'
    ],
    'Health': [
      'pharmacy', 'chemist', 'medical', 'doctor', 'gp', 'clinic',
      'dentist', 'dental', 'orthodont',
      'physio', 'chiropract', 'massage', 'therapy', 'therapist',
      'hospital', 'health', 'medicare', 'bupa', 'medibank',
      'optical', 'optom', 'eye', 'glasses', 'vision',
      'vitamin', 'supplement', 'wellness'
    ],
    'Kids': [
      'childcare', 'child care', 'daycare', 'day care', 'kindy', 'kindergarten',
      'school', 'tuition', 'tutoring', 'education',
      'afterschool', 'before school', 'vacation care',
      'kids', 'children', 'child', 'baby', 'toddler',
      'toys', 'toy store', 'toys r us',
      'nappies', 'diapers', 'formula', 'baby food',
      'kids clothing', 'childrens', 'baby clothes',
      'sports club', 'swimming lessons', 'dance class', 'music lessons',
      'school fees', 'excursion', 'camp', 'uniform',
      'birthday party', 'kids party'
    ],
    'Holiday': [
      'hotel', 'motel', 'accommodation', 'airbnb', 'booking.com', 'expedia',
      'holiday', 'vacation', 'resort', 'travel', 'tourism',
      'airline', 'flight', 'qantas', 'virgin', 'jetstar',
      'cruise', 'tour', 'attraction', 'theme park'
    ]
  };

  // Smart local categorization before AI
  const smartCategorize = (description) => {
    const desc = description.toLowerCase().trim();
    
    // First check user preferences (learned behavior)
    if (userPreferences[desc]) {
      return { category: userPreferences[desc], confidence: 'high', source: 'learned' };
    }
    
    // Check for partial matches in user preferences (e.g., "Uber Eats Sydney" matches "uber eats")
    for (const [key, category] of Object.entries(userPreferences)) {
      if (desc.includes(key) || key.includes(desc)) {
        return { category, confidence: 'high', source: 'learned' };
      }
    }
    
    // Smart coffee detection - check before general merchant database
    const coffeeIndicators = [
      'cafe', 'coffee', 'espresso', 'barista', 'roasters', 'roastery', 'brew', 'bean', 'beans',
      'latte', 'cappuccino', 'flat white', 'macchiato', 'mocha',
      'starbucks', 'gloria jeans', 'the coffee club', 'zarraffa',
      'campos', 'toby estate', 'allpress', 'single o', 'pablo & rusty',
      'cup', 'grind', 'espresso bar', 'coffee bar', 'daily grind'
    ];
    
    const hasCoffeeKeyword = coffeeIndicators.some(keyword => desc.includes(keyword));
    
    // If it has coffee keywords, very likely coffee
    if (hasCoffeeKeyword) {
      return { category: 'Coffee', confidence: 'high', source: 'coffee-detection' };
    }
    
    // Check merchant database
    for (const [category, keywords] of Object.entries(merchantDatabase)) {
      for (const keyword of keywords) {
        if (desc.includes(keyword)) {
          return { category, confidence: 'high', source: 'database' };
        }
      }
    }
    
    // Pattern recognition
    if (desc.match(/\d{4}\s*\d{4}\s*\d{4}\s*\d{4}/)) {
      return { category: 'Bills', confidence: 'medium', source: 'pattern' }; // Card payment
    }
    
    if (desc.includes('www.') || desc.includes('.com') || desc.includes('.au')) {
      return { category: 'Shopping', confidence: 'medium', source: 'pattern' }; // Online purchase
    }
    
    // If nothing matches, return null to trigger AI
    return null;
  };

  // Load data from storage
  useEffect(() => {
    const loadData = async () => {
      try {
        // Try to load expenses
        try {
          const expensesData = await window.storage.get('finance-expenses');
          if (expensesData?.value) {
            setExpenses(JSON.parse(expensesData.value));
          }
        } catch (e) {
          console.log('No expenses data yet');
        }

        // Try to load budgets
        try {
          const budgetsData = await window.storage.get('finance-budgets');
          if (budgetsData?.value) {
            setBudgets(JSON.parse(budgetsData.value));
          }
        } catch (e) {
          console.log('No budgets data yet');
        }

        // Try to load preferences
        try {
          const preferencesData = await window.storage.get('finance-user-preferences');
          if (preferencesData?.value) {
            setUserPreferences(JSON.parse(preferencesData.value));
          }
        } catch (e) {
          console.log('No preferences data yet');
        }

        // Try to load income
        try {
          const incomeData = await window.storage.get('finance-income');
          if (incomeData?.value) {
            const loadedIncome = JSON.parse(incomeData.value);
            // Migrate old income entries to add category if missing
            const migratedIncome = loadedIncome.map(i => ({
              ...i,
              category: i.category || 'Salary (Net)' // Default category for old entries
            }));
            setIncome(migratedIncome);
            // Save migrated data if any changes were made
            if (migratedIncome.some((i, idx) => !loadedIncome[idx].category)) {
              saveIncome(migratedIncome);
            }
          }
        } catch (e) {
          console.log('No income data yet');
        }

        // Try to load savings goals
        try {
          const goalsData = await window.storage.get('finance-goals');
          if (goalsData?.value) {
            setSavingsGoals(JSON.parse(goalsData.value));
          }
        } catch (e) {
          console.log('No goals data yet');
        }
      } catch (error) {
        console.log('First time loading, no saved data yet');
      } finally {
        // Always set loading to false, even if there are errors
        setIsLoading(false);
      }
    };
    
    // Add a timeout fallback in case storage hangs
    const timeoutId = setTimeout(() => {
      console.log('Loading timeout, proceeding anyway');
      setIsLoading(false);
    }, 2000);
    
    loadData().then(() => clearTimeout(timeoutId));
    
    return () => clearTimeout(timeoutId);
  }, []);

  // Save expenses to storage
  const saveExpenses = async (newExpenses) => {
    try {
      await window.storage.set('finance-expenses', JSON.stringify(newExpenses));
    } catch (error) {
      console.error('Error saving expenses:', error);
    }
  };

  // Save budgets to storage
  const saveBudgets = async (newBudgets) => {
    try {
      await window.storage.set('finance-budgets', JSON.stringify(newBudgets));
    } catch (error) {
      console.error('Error saving budgets:', error);
    }
  };

  // Save user preferences to storage
  const saveUserPreferences = async (newPreferences) => {
    try {
      await window.storage.set('finance-user-preferences', JSON.stringify(newPreferences));
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  // Save income to storage
  const saveIncome = async (newIncome) => {
    try {
      await window.storage.set('finance-income', JSON.stringify(newIncome));
    } catch (error) {
      console.error('Error saving income:', error);
    }
  };

  // Save recurring expenses
  const saveRecurringExpenses = async (recurring) => {
    try {
      await window.storage.set('finance-recurring', JSON.stringify(recurring));
    } catch (error) {
      console.error('Error saving recurring:', error);
    }
  };

  // Save savings goals
  const saveSavingsGoals = async (goals) => {
    try {
      await window.storage.set('finance-goals', JSON.stringify(goals));
    } catch (error) {
      console.error('Error saving goals:', error);
    }
  };

  // Undo last action
  const undoLastAction = () => {
    if (undoStack.length === 0) {
      showSaveNotification('⚠️ Nothing to undo');
      return;
    }

    const lastAction = undoStack[undoStack.length - 1];
    
    if (lastAction.type === 'expense') {
      setExpenses(lastAction.previousState);
      saveExpenses(lastAction.previousState);
      showSaveNotification('↩️ Undone: Expense change');
    } else if (lastAction.type === 'income') {
      setIncome(lastAction.previousState);
      saveIncome(lastAction.previousState);
      showSaveNotification('↩️ Undone: Income change');
    }

    setUndoStack(undoStack.slice(0, -1));
  };

  // Add to undo stack
  const addToUndoStack = (type, previousState) => {
    setUndoStack([...undoStack.slice(-9), { type, previousState }]); // Keep last 10
  };

  // Learn from user's categorization choice
  const learnFromUserChoice = (description, category) => {
    const key = description.toLowerCase().trim();
    const updated = {
      ...userPreferences,
      [key]: category
    };
    setUserPreferences(updated);
    saveUserPreferences(updated);
  };

  // Find similar expenses based on description
  const findSimilarExpenses = (description) => {
    const cleanDesc = description.toLowerCase().trim();
    
    // Find exact matches and partial matches
    return expenses.filter(e => {
      const expenseDesc = e.description.toLowerCase().trim();
      // Exact match
      if (expenseDesc === cleanDesc) return true;
      
      // Extract merchant name (before location/branch info)
      const merchantName = cleanDesc.split(/[\(\-]/)[0].trim();
      const expenseMerchant = expenseDesc.split(/[\(\-]/)[0].trim();
      
      // Match if merchant names are similar
      if (merchantName.length > 3 && expenseMerchant.includes(merchantName)) return true;
      if (expenseMerchant.length > 3 && merchantName.includes(expenseMerchant)) return true;
      
      return false;
    });
  };

  // Initiate category change with bulk update check
  const initiateExpenseUpdate = (expenseId, newCategory) => {
    console.log('Initiating update for expense:', expenseId, 'to category:', newCategory);
    
    const expense = expenses.find(e => e.id === expenseId);
    if (!expense) {
      console.error('Expense not found:', expenseId);
      return;
    }

    console.log('Found expense:', expense.description);

    const similarExpenses = findSimilarExpenses(expense.description);
    console.log('Similar expenses found:', similarExpenses.length);
    
    const otherSimilar = similarExpenses.filter(e => e.id !== expenseId && e.category !== newCategory);
    console.log('Other similar expenses with different category:', otherSimilar.length);

    if (otherSimilar.length > 0) {
      console.log('Showing bulk update modal');
      // Show bulk update modal
      setBulkUpdateModal({
        expense,
        newCategory,
        similarExpenses: otherSimilar,
        allIds: [expenseId, ...otherSimilar.map(e => e.id)]
      });
    } else {
      console.log('No other similar expenses, updating single');
      // Just update this one
      updateSingleExpense(expenseId, newCategory, expense.description);
    }
  };

  // Show save notification
  const showSaveNotification = (message) => {
    setSaveNotification(message);
    setTimeout(() => setSaveNotification(''), 3000);
  };

  // Update single expense
  const updateSingleExpense = (id, newCategory, description) => {
    console.log('Updating single expense:', id, 'to', newCategory);
    const updatedExpenses = expenses.map(e => 
      e.id === id ? { ...e, category: newCategory } : e
    );
    console.log('Updated expenses:', updatedExpenses.filter(e => e.id === id));
    setExpenses(updatedExpenses);
    saveExpenses(updatedExpenses);
    learnFromUserChoice(description, newCategory);
    setEditingExpense(null);
    showSaveNotification('✓ Saved and learned preference');
  };

  // Update multiple expenses at once
  const updateMultipleExpenses = (ids, newCategory, description) => {
    console.log('Updating multiple expenses:', ids.length, 'to', newCategory);
    const updatedExpenses = expenses.map(e => 
      ids.includes(e.id) ? { ...e, category: newCategory } : e
    );
    console.log('Updated count:', updatedExpenses.filter(e => ids.includes(e.id)).length);
    setExpenses(updatedExpenses);
    saveExpenses(updatedExpenses);
    learnFromUserChoice(description, newCategory);
    setBulkUpdateModal(null);
    setEditingExpense(null);
    showSaveNotification(`✓ Updated ${ids.length} expenses and learned preference`);
  };

  // Update expense category with auto-apply to similar expenses
  const updateExpenseCategory = (id, newCategory) => {
    const expense = expenses.find(e => e.id === id);
    if (!expense) return;
    
    // Add to undo stack before changing
    addToUndoStack('expense', expenses);
    
    // Find all similar expenses
    const similarExpenses = findSimilarExpenses(expense.description);
    const idsToUpdate = similarExpenses.map(e => e.id);
    
    // Update all similar expenses at once
    const updatedExpenses = expenses.map(e => 
      idsToUpdate.includes(e.id) ? { ...e, category: newCategory } : e
    );
    
    setExpenses(updatedExpenses);
    saveExpenses(updatedExpenses);
    learnFromUserChoice(expense.description, newCategory);
    setEditingExpense(null);
    
    if (idsToUpdate.length > 1) {
      showSaveNotification(`✓ Updated ${idsToUpdate.length} similar expenses`);
    } else {
      showSaveNotification('✓ Category changed');
    }
  };

  // Search expenses by provider/description
  const searchExpenses = (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    const lowerQuery = query.toLowerCase();
    const results = expenses.filter(e => 
      e.description.toLowerCase().includes(lowerQuery)
    );
    setSearchResults(results);
  };

  // Bulk change category for all search results
  const bulkChangeSearchResults = (newCategory) => {
    if (searchResults.length === 0) return;
    
    // Add to undo stack before changing
    addToUndoStack('expense', expenses);
    
    const idsToUpdate = searchResults.map(e => e.id);
    const updatedExpenses = expenses.map(e => 
      idsToUpdate.includes(e.id) ? { ...e, category: newCategory } : e
    );
    
    setExpenses(updatedExpenses);
    saveExpenses(updatedExpenses);
    
    // Learn from the first result's description
    if (searchResults.length > 0) {
      learnFromUserChoice(searchResults[0].description, newCategory);
    }
    
    showSaveNotification(`✓ Updated ${idsToUpdate.length} expenses to ${newCategory}`);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Re-categorize all expenses based on current rules
  const recategorizeAllExpenses = () => {
    let changeCount = 0;
    const updatedExpenses = expenses.map(expense => {
      // First migrate old categories to new consolidated category
      if (expense.category === 'Eating Out' || expense.category === 'Drinking Out') {
        changeCount++;
        return { ...expense, category: 'Eating & Drinking Out' };
      }
      
      // Get what the current rules say this should be
      const smartResult = smartCategorize(expense.description);
      
      if (smartResult && smartResult.category !== expense.category) {
        changeCount++;
        return { ...expense, category: smartResult.category };
      }
      return expense;
    });
    
    if (changeCount > 0) {
      // Add to undo stack before changing
      addToUndoStack('expense', expenses);
      
      setExpenses(updatedExpenses);
      saveExpenses(updatedExpenses);
      showSaveNotification(`✓ Re-categorized ${changeCount} expenses with latest rules`);
    } else {
      showSaveNotification('✓ All expenses already correctly categorized');
    }
  };

  // Get filtered and sorted expenses for modal
  const getFilteredSortedExpenses = (category) => {
    let filtered = expenses.filter(e => e.category === category);
    
    // Apply filter
    if (modalFilter) {
      const lowerFilter = modalFilter.toLowerCase();
      filtered = filtered.filter(e => 
        e.description.toLowerCase().includes(lowerFilter)
      );
    }
    
    // Apply sort
    const sorted = [...filtered];
    switch (modalSort) {
      case 'date-desc':
        sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
        break;
      case 'date-asc':
        sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
        break;
      case 'amount-desc':
        sorted.sort((a, b) => b.amount - a.amount);
        break;
      case 'amount-asc':
        sorted.sort((a, b) => a.amount - b.amount);
        break;
      case 'name-asc':
        sorted.sort((a, b) => a.description.localeCompare(b.description));
        break;
      case 'name-desc':
        sorted.sort((a, b) => b.description.localeCompare(a.description));
        break;
      default:
        break;
    }
    
    return sorted;
  };

  const addExpense = () => {
    if (!newExpense.description || !newExpense.amount) return;
    
    const expense = {
      id: Date.now(),
      description: newExpense.description,
      amount: parseFloat(newExpense.amount),
      category: newExpense.category,
      date: newExpense.date
    };
    
    // Check if this exact transaction already exists
    if (isDuplicate(expense)) {
      showSaveNotification('⚠️ Duplicate expense - already exists');
      return;
    }
    
    // Add to undo stack before changing
    addToUndoStack('expense', expenses);
    
    const updatedExpenses = [...expenses, expense];
    setExpenses(updatedExpenses);
    saveExpenses(updatedExpenses);
    showSaveNotification('✓ Expense saved');
    
    setNewExpense({
      description: '',
      amount: '',
      category: 'Eating & Drinking Out',
      date: new Date().toISOString().split('T')[0],
      suggestedCategory: null,
      confidence: null
    });
  };

  const categorizeExpense = async (description) => {
    if (!description || description.length < 3) return;
    
    // First try smart local categorization
    const localResult = smartCategorize(description);
    if (localResult) {
      setNewExpense(prev => ({
        ...prev,
        suggestedCategory: localResult.category,
        confidence: localResult.confidence,
        category: localResult.category
      }));
      return;
    }
    
    // Fall back to AI for unclear cases
    setIsCategorizingExpense(true);
    
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 100,
          messages: [{
            role: "user",
            content: `Categorize this expense: "${description}"

Available categories: Food, Transport, Entertainment, Shopping, Bills, Health, Other

Respond ONLY with a JSON object in this exact format:
{"category": "CategoryName", "confidence": "high/medium/low"}

Examples:
- "ABC Company Pty Ltd" -> {"category": "Shopping", "confidence": "low"}
- "Payment - Thank You" -> {"category": "Other", "confidence": "low"}
- "Online Purchase" -> {"category": "Shopping", "confidence": "medium"}`
          }]
        })
      });

      const data = await response.json();
      const text = data.content[0].text.trim();
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const result = JSON.parse(cleanText);
      
      setNewExpense(prev => ({
        ...prev,
        suggestedCategory: result.category,
        confidence: result.confidence,
        category: result.category
      }));
    } catch (error) {
      console.error('Error categorizing:', error);
      setNewExpense(prev => ({
        ...prev,
        suggestedCategory: 'Other',
        confidence: 'low',
        category: 'Other'
      }));
    }
    
    setIsCategorizingExpense(false);
  };

  const handleDescriptionBlur = () => {
    if (newExpense.description && !newExpense.suggestedCategory) {
      categorizeExpense(newExpense.description);
    }
  };

  // Check if transaction is a duplicate
  const isDuplicate = (transaction) => {
    return expenses.some(existing => 
      existing.description === transaction.description &&
      existing.amount === transaction.amount &&
      existing.date === transaction.date
    );
  };

  // Filter out duplicates from a list of transactions
  const removeDuplicates = (transactions) => {
    const unique = transactions.filter(t => !isDuplicate(t));
    const duplicateCount = transactions.length - unique.length;
    return { unique, duplicateCount };
  };

  const parseCSV = (csvText) => {
    // Proper CSV parsing that handles quoted fields with commas
    const parseLine = (line) => {
      const fields = [];
      let field = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          fields.push(field.trim());
          field = '';
        } else {
          field += char;
        }
      }
      fields.push(field.trim());
      return fields;
    };
    
    const lines = csvText.split(/\r?\n/).filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = parseLine(lines[0]).map(h => h.toLowerCase().replace(/['"]/g, ''));
    
    const dateIndex = headers.findIndex(h => h.includes('date') || h.includes('transaction'));
    const descIndex = headers.findIndex(h => h.includes('description') || h.includes('merchant') || h.includes('name'));
    const amountIndex = headers.findIndex(h => 
      h.includes('amount') || 
      h.includes('debit') || 
      h.includes('credit') ||
      h.includes('withdrawal') || 
      h.includes('deposit')
    );
    
    if (dateIndex === -1 || descIndex === -1 || amountIndex === -1) {
      throw new Error('Could not find required columns (Date, Description, Amount). Please check your CSV format.');
    }

    const transactions = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseLine(lines[i]);
      
      const dateStr = values[dateIndex];
      const description = values[descIndex];
      let amountStr = values[amountIndex];
      
      if (!dateStr || !description || !amountStr) continue;
      
      // Handle amounts with dollar signs, commas, spaces, and quotes
      // e.g., '" -$7,386.90"' or '" $2,525.64"' or '-$64.03'
      const cleanAmount = amountStr
        .replace(/["']/g, '')  // Remove quotes
        .replace(/\$/g, '')    // Remove dollar signs
        .replace(/,/g, '')     // Remove commas
        .replace(/\s+/g, '')   // Remove spaces
        .replace(/[()]/g, ''); // Remove parentheses
      
      const amount = parseFloat(cleanAmount);
      
      if (isNaN(amount) || amount === 0) continue;
      
      let parsedDate;
      try {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          const day = parts[0].padStart(2, '0');
          const month = parts[1].padStart(2, '0');
          const year = parts[2].length === 2 ? '20' + parts[2] : parts[2];
          parsedDate = `${year}-${month}-${day}`;
        } else {
          parsedDate = new Date(dateStr).toISOString().split('T')[0];
        }
      } catch {
        parsedDate = new Date().toISOString().split('T')[0];
      }
      
      // Amount is already parsed as float above with its sign preserved
      if (!isNaN(amount) && amount !== 0) {
        transactions.push({
          description,
          amount, // Positive = income, Negative = expense
          date: parsedDate
        });
      }
    }
    
    return transactions;
  };

  const categorizeBatch = async (transactions) => {
    setCsvImportStatus(`Categorizing ${transactions.length} transactions...`);
    
    // First pass: use local merchant database + smart coffee detection
    const categorized = transactions.map(t => {
      // Smart coffee detection using amount + description
      const amount = parseFloat(t.amount);
      const desc = t.description.toLowerCase();
      
      // Coffee amount range check (AU$3-$20 is typical)
      const isCoffeeAmount = amount >= 3 && amount <= 20;
      
      // Coffee keyword indicators
      const coffeeKeywords = ['cafe', 'coffee', 'espresso', 'barista', 'roasters', 'brew', 'bean', 'beans', 'latte', 'cup', 'grind'];
      const hasCoffeeKeyword = coffeeKeywords.some(kw => desc.includes(kw));
      
      // Weak coffee indicators (common in cafe names but not definitive)
      const weakCoffeeIndicators = ['corner', 'street', 'house', 'store', 'co ', 'co.', 'brothers', 'sisters'];
      const hasWeakIndicator = weakCoffeeIndicators.some(kw => desc.includes(kw));
      
      // Strong coffee detection: clear keyword
      if (hasCoffeeKeyword) {
        return {
          ...t,
          category: 'Coffee',
          confidence: 'high',
          needsAI: false
        };
      }
      
      // Medium coffee detection: right price range + weak indicator (like "Smith Street Coffee Co")
      if (isCoffeeAmount && hasWeakIndicator && desc.length < 40) {
        return {
          ...t,
          category: 'Coffee',
          confidence: 'medium',
          needsAI: false
        };
      }
      
      // Otherwise try normal categorization
      const localResult = smartCategorize(t.description);
      if (localResult) {
        return {
          ...t,
          category: localResult.category,
          confidence: localResult.confidence,
          needsAI: false
        };
      }
      return {
        ...t,
        category: 'Other',
        confidence: 'low',
        needsAI: true
      };
    });
    
    const needsAI = categorized.filter(t => t.needsAI);
    
    if (needsAI.length === 0) {
      // All categorized locally!
      setCsvImportStatus(`✓ Categorized ${transactions.length} transactions using smart detection`);
      return categorized.map((t, i) => ({ ...t, id: Date.now() + i }));
    }
    
    // Second pass: use AI for unclear ones
    setCsvImportStatus(`${categorized.length - needsAI.length} auto-categorized, analyzing ${needsAI.length} unclear transactions with AI...`);
    
    try {
      // Process in chunks of 20 to avoid token limits
      const chunkSize = 20;
      const aiResults = [];
      
      for (let i = 0; i < needsAI.length; i += chunkSize) {
        const chunk = needsAI.slice(i, i + chunkSize);
        
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 2000,
            messages: [{
              role: "user",
              content: `You are categorizing bank transactions. Many descriptions are vague like "Card Purchase", "EFTPOS", "Payment", or company names you don't recognize.

Categories: Supermarket, Eating & Drinking Out, Coffee, Alcohol, Transport, Entertainment, Shopping, Bills, Subscriptions & Memberships, Rent & Mortgage, Health, Kids, Holiday, Other

COFFEE DETECTION RULES:
- Amounts $3-$20 at cafes/coffee shops → Coffee
- Keywords: cafe, coffee, espresso, barista, beans, roasters → Coffee
- Generic small purchases without clear indicators → ask yourself if it could be coffee

For unclear transactions:
- Generic descriptions like "Card Purchase", "Payment", "EFTPOS" → Shopping (medium confidence)
- Business names you don't recognize → Shopping (low confidence)  
- Utility/phone companies → Bills (high confidence)
- Streaming services (Netflix, Spotify, Disney+) → Subscriptions & Memberships
- Gym memberships, fitness subscriptions → Subscriptions & Memberships
- Anything with "subscription", "monthly membership", "annual membership" → Subscriptions & Memberships
- Rent payments, mortgage payments, real estate → Rent & Mortgage
- Childcare, school fees, kids activities, toys → Kids
- Gas stations, mechanics → Transport
- Supermarkets (Woolworths, Coles, IGA) → Supermarket
- Cafes, coffee shops → Coffee
- Fast food, restaurants, takeaway, bars, pubs → Eating & Drinking Out
- Bottle shops (Dan Murphy's, BWS) → Alcohol
- Hotels, flights, travel → Holiday
- Utilities (electricity, gas, water, internet, phone bills) → Bills
- Insurance → Bills

Transactions to categorize:
${chunk.map((t, idx) => `${idx}: "${t.description}" ($${t.amount})`).join('\n')}

Respond ONLY with a JSON array (no markdown):
[{"index": 0, "category": "CategoryName", "confidence": "high/medium/low"}, ...]

Include ALL ${chunk.length} transactions.`
            }]
          })
        });

        const data = await response.json();
        const text = data.content[0].text.trim();
        const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const results = JSON.parse(cleanText);
        aiResults.push(...results);
      }
      
      // Merge AI results back
      let aiIndex = 0;
      const final = categorized.map(t => {
        if (t.needsAI) {
          const aiResult = aiResults[aiIndex++];
          return {
            ...t,
            category: aiResult.category,
            confidence: aiResult.confidence
          };
        }
        return t;
      });
      
      const highConf = final.filter(t => t.confidence === 'high').length;
      const medConf = final.filter(t => t.confidence === 'medium').length;
      const lowConf = final.filter(t => t.confidence === 'low').length;
      
      setCsvImportStatus(`✓ Categorized: ${highConf} high confidence, ${medConf} medium, ${lowConf} low - please review`);
      
      return final.map((t, i) => ({ ...t, id: Date.now() + i }));
      
    } catch (error) {
      console.error('Error with AI categorization:', error);
      setCsvImportStatus('⚠️ AI categorization failed, using best guesses - please review carefully');
      return categorized.map((t, i) => ({ ...t, id: Date.now() + i }));
    }
  };

  const handleCSVUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setCsvImportStatus('Reading file...');
    
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    try {
      let csvText = '';
      
      // Handle different file types
      if (fileExtension === 'pdf') {
        setCsvImportStatus('⚠️ PDF files not yet supported. Please export as CSV/Excel from your bank.');
        event.target.value = '';
        return;
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        setCsvImportStatus('⚠️ Excel files not yet supported. Please save as CSV first.');
        event.target.value = '';
        return;
      } else if (fileExtension === 'csv' || fileExtension === 'txt') {
        // Read as text
        csvText = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = (e) => reject(e);
          reader.readAsText(file);
        });
      } else {
        setCsvImportStatus('⚠️ Unsupported file type. Please use CSV format.');
        event.target.value = '';
        return;
      }

      const transactions = parseCSV(csvText);
      
      if (transactions.length === 0) {
        setCsvImportStatus('No valid transactions found in file');
        event.target.value = '';
        return;
      }

      setCsvImportStatus(`Found ${transactions.length} transactions. Analyzing...`);

      // Separate income and expenses based on amount
      const incomeEntries = [];
      const expenseEntries = [];
      
      transactions.forEach(t => {
        if (t.amount > 0) {
          // Positive amount = income
          incomeEntries.push({
            id: Date.now() + Math.random(),
            source: t.description,
            amount: t.amount,
            date: t.date,
            category: 'Salary (Net)' // Default, user can change
          });
        } else if (t.amount < 0) {
          // Negative amount = expense (convert to positive)
          expenseEntries.push({
            ...t,
            amount: Math.abs(t.amount)
          });
        }
      });

      setCsvImportStatus(`Separated: ${expenseEntries.length} expenses, ${incomeEntries.length} income. Categorizing expenses...`);

      // Check for duplicate expenses
      const { unique: uniqueExpenses, duplicateCount: expenseDuplicates } = removeDuplicates(expenseEntries);
      
      // Categorize expenses
      const categorizedExpenses = uniqueExpenses.length > 0 ? await categorizeBatch(uniqueExpenses) : [];
      
      // Set both pending imports
      setPendingImports(categorizedExpenses);
      setPendingIncomeImports(incomeEntries);
      
      const summaryParts = [];
      if (categorizedExpenses.length > 0) {
        summaryParts.push(`${categorizedExpenses.length} expense${categorizedExpenses.length !== 1 ? 's' : ''}`);
        if (expenseDuplicates > 0) summaryParts.push(`(${expenseDuplicates} duplicate${expenseDuplicates !== 1 ? 's' : ''} skipped)`);
      }
      if (incomeEntries.length > 0) {
        summaryParts.push(`${incomeEntries.length} income entr${incomeEntries.length !== 1 ? 'ies' : 'y'}`);
      }
      
      setCsvImportStatus(`✅ Ready to import: ${summaryParts.join(', ')}. Review below.`);
    } catch (error) {
      setCsvImportStatus(`Error: ${error.message}`);
    }
    
    event.target.value = '';
  };

  const confirmIncomeImport = () => {
    addToUndoStack('income', income);
    const updatedIncome = [...income, ...pendingIncomeImports];
    setIncome(updatedIncome);
    saveIncome(updatedIncome);
    
    const successMessage = `✅ Import Complete! Successfully added ${pendingIncomeImports.length} income entries`;
    setIncomeImportStatus(successMessage);
    showSaveNotification(successMessage);
    
    setPendingIncomeImports([]);
    setTimeout(() => setIncomeImportStatus(''), 5000);
  };

  const updatePendingIncomeCategory = (id, category) => {
    setPendingIncomeImports(prev => 
      prev.map(i => i.id === id ? { ...i, category } : i)
    );
  };

  const confirmImport = () => {
    let messages = [];
    
    // Import expenses if any
    if (pendingImports.length > 0) {
      addToUndoStack('expense', expenses);
      const updatedExpenses = [...expenses, ...pendingImports];
      setExpenses(updatedExpenses);
      saveExpenses(updatedExpenses);
      messages.push(`${pendingImports.length} expense${pendingImports.length !== 1 ? 's' : ''}`);
      setPendingImports([]);
    }
    
    // Import income if any
    if (pendingIncomeImports.length > 0) {
      addToUndoStack('income', income);
      const updatedIncome = [...income, ...pendingIncomeImports];
      setIncome(updatedIncome);
      saveIncome(updatedIncome);
      messages.push(`${pendingIncomeImports.length} income entr${pendingIncomeImports.length !== 1 ? 'ies' : 'y'}`);
      setPendingIncomeImports([]);
    }
    
    // Clear message and show success
    const successMessage = messages.length > 0 
      ? `✅ Import Complete! Added ${messages.join(' and ')}`
      : '✅ Import Complete!';
    
    setCsvImportStatus(successMessage);
    setIncomeImportStatus('');
    showSaveNotification(successMessage);
    
    // Clear status after 5 seconds
    setTimeout(() => {
      setCsvImportStatus('');
      setIncomeImportStatus('');
    }, 5000);
  };

  const updatePendingCategory = (id, category) => {
    setPendingImports(prev => 
      prev.map(t => t.id === id ? { ...t, category } : t)
    );
  };

  const deleteExpense = (id) => {
    // Add to undo stack before deleting
    addToUndoStack('expense', expenses);
    
    const updatedExpenses = expenses.filter(e => e.id !== id);
    setExpenses(updatedExpenses);
    saveExpenses(updatedExpenses);
    showSaveNotification('✓ Expense deleted');
  };

  const updateBudget = (category, amount) => {
    const updatedBudgets = { ...budgets, [category]: parseFloat(amount) || 0 };
    setBudgets(updatedBudgets);
    saveBudgets(updatedBudgets);
    showSaveNotification('✓ Budget saved');
  };

  const getCategoryTotal = (category) => {
    return getFilteredExpenses()
      .filter(e => e.category === category)
      .reduce((sum, e) => sum + e.amount, 0);
  };

  const getTotalExpenses = () => {
    return getFilteredExpenses().reduce((sum, e) => sum + e.amount, 0);
  };

  const getPieChartData = () => {
    return categories.map(cat => ({
      name: cat,
      value: getCategoryTotal(cat)
    })).filter(d => d.value > 0);
  };

  const getMonthlyData = () => {
    const monthlyTotals = {};
    getFilteredExpenses().forEach(e => {
      const month = e.date.substring(0, 7);
      monthlyTotals[month] = (monthlyTotals[month] || 0) + e.amount;
    });
    
    return Object.entries(monthlyTotals)
      .sort()
      .slice(-6)
      .map(([month, total]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        amount: total
      }));
  };

  const getAIAdvice = async () => {
    setIsLoadingAI(true);
    setAiResponse('');
    
    const summary = {
      totalExpenses: getTotalExpenses(),
      categoryBreakdown: categories.map(cat => ({
        category: cat,
        spent: getCategoryTotal(cat),
        budget: budgets[cat] || 0
      })).filter(c => c.spent > 0),
      recentExpenses: expenses.slice(-5).map(e => ({
        description: e.description,
        amount: e.amount,
        category: e.category
      }))
    };

    const toneInstructions = advisorTone === 'brutal' 
      ? `You are a brutally honest financial advisor who doesn't sugarcoat anything. Be direct, blunt, and call out poor spending habits. Use phrases like "You're wasting money on...", "This is ridiculous...", "You need to stop...", "Seriously?". Be tough but constructive. Channel the energy of a disappointed parent or a drill sergeant. Make them feel the shame of their bad decisions while still providing actionable advice.`
      : `You are a friendly, encouraging financial advisor who provides supportive and positive guidance.`;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `${toneInstructions}

Analyze this spending data:

Total Expenses: $${summary.totalExpenses.toFixed(2)}

Category Breakdown:
${summary.categoryBreakdown.map(c => 
  `- ${c.category}: $${c.spent.toFixed(2)}${c.budget > 0 ? ` (Budget: $${c.budget})` : ''}`
).join('\n')}

Recent Transactions:
${summary.recentExpenses.map(e => `- ${e.description} ($${e.amount}) - ${e.category}`).join('\n')}

Provide:
1. A brief spending analysis (2-3 sentences)
2. 2-3 specific, actionable tips to improve their finances
3. ${advisorTone === 'brutal' ? 'A harsh reality check about their worst spending habit' : 'One positive observation about their spending habits'}

Keep it ${advisorTone === 'brutal' ? 'brutally honest and direct' : 'conversational and encouraging'}, under 200 words.`
          }]
        })
      });

      const data = await response.json();
      const advice = data.content[0].text;
      setAiResponse(advice);
    } catch (error) {
      setAiResponse("I'm having trouble connecting right now. Please try again in a moment!");
    }
    
    setIsLoadingAI(false);
  };

  const handleAiChat = async () => {
    const userMessage = aiChatInput.trim();
    if (!userMessage) return;

    // Add user message
    const newMessages = [...aiChatMessages, { role: 'user', content: userMessage }];
    setAiChatMessages(newMessages);
    setAiChatInput('');
    setIsAiChatLoading(true);

    // Prepare data summary
    const dataSummary = {
      totalExpenses: getTotalExpenses(),
      totalIncome: income.reduce((sum, i) => sum + i.amount, 0),
      categories: categories.map(cat => ({
        category: cat,
        spent: getCategoryTotal(cat),
        count: expenses.filter(e => e.category === cat).length,
        budget: budgets[cat] || 0
      })).filter(c => c.spent > 0),
      recentExpenses: expenses.slice(-10).map(e => ({
        description: e.description,
        amount: e.amount,
        category: e.category,
        date: e.date
      }))
    };

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 500,
          messages: [{
            role: "user",
            content: `You are a helpful financial assistant analyzing spending data. Answer the user's question based on this data:

Total Expenses: $${dataSummary.totalExpenses.toFixed(2)}
Total Income: $${dataSummary.totalIncome.toFixed(2)}
Net: $${(dataSummary.totalIncome - dataSummary.totalExpenses).toFixed(2)}

Category Breakdown:
${dataSummary.categories.map(c => 
  `- ${c.category}: $${c.spent.toFixed(2)} (${c.count} transactions)${c.budget > 0 ? ` Budget: $${c.budget}` : ''}`
).join('\n')}

Recent Transactions:
${dataSummary.recentExpenses.map(e => `- ${e.description}: $${e.amount} (${e.category}, ${e.date})`).join('\n')}

User's question: ${userMessage}

Provide a direct, concise answer (2-3 sentences max). Be specific with numbers and percentages.`
          }]
        })
      });

      const data = await response.json();
      const aiMessage = data.content[0].text;
      
      setAiChatMessages([...newMessages, { role: 'assistant', content: aiMessage }]);
    } catch (error) {
      setAiChatMessages([...newMessages, { role: 'assistant', content: "Sorry, I'm having trouble analyzing that right now. Please try again!" }]);
    }
    
    setIsAiChatLoading(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white text-xl">Loading your finances...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-8">
      {/* Save Notification Toast */}
      {saveNotification && (
        <div className="fixed top-4 right-4 z-[70] animate-fade-in">
          <div className="bg-emerald-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
            <span className="text-lg">✓</span>
            <span className="font-semibold">{saveNotification}</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 mb-6 shadow-xl">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-3">
              <Wallet className="text-white" size={32} />
              <h1 className="text-3xl font-bold text-white">Finance Tracker</h1>
            </div>
            {undoStack.length > 0 && (
              <button
                onClick={undoLastAction}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                ↩️ Undo
              </button>
            )}
          </div>
          <div className="text-white text-lg">
            Total Expenses: <span className="font-bold text-2xl">${getTotalExpenses().toFixed(2)}</span>
            {income.reduce((sum, i) => sum + i.amount, 0) > 0 && (
              <span className="ml-4">
                Income: <span className="font-bold text-2xl">${income.reduce((sum, i) => sum + i.amount, 0).toFixed(2)}</span>
                <span className="ml-2 text-sm">
                  (Net: ${(income.reduce((sum, i) => sum + i.amount, 0) - getTotalExpenses()).toFixed(2)})
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Date Range Filter & Trends */}
        <div className="bg-slate-800 rounded-xl p-6 mb-6 shadow-xl">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Date Range Filter */}
            <div>
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Calendar size={20} />
                Filter by Date Range
              </h3>
              
              {/* Quick Presets */}
              <div className="flex flex-wrap gap-2 mb-3">
                <button
                  onClick={() => {
                    const now = new Date();
                    const start = new Date(now.getFullYear(), now.getMonth(), 1);
                    setDateRange({
                      start: start.toISOString().split('T')[0],
                      end: now.toISOString().split('T')[0]
                    });
                  }}
                  className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
                >
                  This Month
                </button>
                <button
                  onClick={() => {
                    const now = new Date();
                    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    const end = new Date(now.getFullYear(), now.getMonth(), 0);
                    setDateRange({
                      start: start.toISOString().split('T')[0],
                      end: end.toISOString().split('T')[0]
                    });
                  }}
                  className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
                >
                  Last Month
                </button>
                <button
                  onClick={() => {
                    const now = new Date();
                    const start = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
                    setDateRange({
                      start: start.toISOString().split('T')[0],
                      end: now.toISOString().split('T')[0]
                    });
                  }}
                  className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
                >
                  Last 3 Months
                </button>
                <button
                  onClick={() => {
                    const now = new Date();
                    const start = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
                    setDateRange({
                      start: start.toISOString().split('T')[0],
                      end: now.toISOString().split('T')[0]
                    });
                  }}
                  className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
                >
                  Last 6 Months
                </button>
                <button
                  onClick={() => {
                    const now = new Date();
                    const start = new Date(now.getFullYear(), now.getMonth() - 12, now.getDate());
                    setDateRange({
                      start: start.toISOString().split('T')[0],
                      end: now.toISOString().split('T')[0]
                    });
                  }}
                  className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
                >
                  Last Year
                </button>
                <button
                  onClick={() => {
                    const now = new Date();
                    const start = new Date(now.getFullYear(), 0, 1);
                    setDateRange({
                      start: start.toISOString().split('T')[0],
                      end: now.toISOString().split('T')[0]
                    });
                  }}
                  className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
                >
                  Year to Date
                </button>
                <button
                  onClick={() => setDateRange({start: '', end: ''})}
                  className="px-3 py-1 bg-slate-600 hover:bg-slate-500 text-white text-sm rounded-lg transition-colors"
                >
                  All Time
                </button>
              </div>

              {/* Custom Date Inputs */}
              <div className="flex gap-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                  className="flex-1 bg-slate-700 text-white px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Start date"
                />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                  className="flex-1 bg-slate-700 text-white px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="End date"
                />
              </div>
              
              {(dateRange.start || dateRange.end) && (
                <p className="text-slate-400 text-sm mt-2">
                  Showing {getFilteredExpenses().length} of {expenses.length} expenses
                </p>
              )}
            </div>

            {/* Month over Month Comparison */}
            <div>
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <TrendingUp size={20} />
                This Month vs Last Month
              </h3>
              {(() => {
                const comparison = getComparisonData();
                return (
                  <div className="bg-slate-700 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <div className="text-slate-400 text-sm">This Month</div>
                        <div className="text-white text-xl font-bold">${comparison.thisMonth.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-sm">Last Month</div>
                        <div className="text-white text-xl font-bold">${comparison.lastMonth.toFixed(2)}</div>
                      </div>
                    </div>
                    <div className={`flex items-center gap-2 ${comparison.isIncrease ? 'text-red-400' : 'text-emerald-400'}`}>
                      {comparison.isIncrease ? '📈' : '📉'}
                      <span className="font-semibold">
                        {comparison.isIncrease ? '+' : ''}{comparison.change.toFixed(1)}%
                      </span>
                      <span className="text-slate-300 text-sm">
                        {comparison.isIncrease ? 'increase' : 'decrease'} in spending
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-slate-800 rounded-xl p-4 mb-6 shadow-xl">
          <div className="flex gap-3 mb-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchExpenses(e.target.value);
                }}
                placeholder="Search expenses by provider (e.g., 'Felons', 'Little Bang', 'Woolworths')..."
                className="w-full bg-slate-700 text-white pl-10 pr-4 py-3 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            {searchResults.length > 0 && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Re-categorize All Button */}
          {expenses.length > 0 && (
            <button
              onClick={recategorizeAllExpenses}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <SlidersHorizontal size={18} />
              Re-categorize All Expenses (Apply Latest Rules)
            </button>
          )}
          
          {searchResults.length > 0 && (
            <div className="mt-4 bg-slate-700 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <div className="text-white font-semibold">
                  Found {searchResults.length} expense{searchResults.length !== 1 ? 's' : ''}
                  <span className="text-slate-400 text-sm ml-2">
                    (Total: ${searchResults.reduce((sum, e) => sum + e.amount, 0).toFixed(2)})
                  </span>
                </div>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto mb-3">
                {searchResults.map(expense => (
                  <div key={expense.id} className="bg-slate-600 rounded p-3 flex justify-between items-center">
                    <div className="flex-1">
                      <div className="text-white text-sm font-medium">{expense.description}</div>
                      <div className="text-slate-400 text-xs flex gap-3">
                        <span>{new Date(expense.date).toLocaleDateString()}</span>
                        <span className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: categoryColors[expense.category] + '40', color: categoryColors[expense.category] }}>
                          {expense.category}
                        </span>
                      </div>
                    </div>
                    <div className="text-emerald-400 font-bold ml-3">
                      ${expense.amount.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <div className="text-slate-300 text-sm mb-2">Change all to:</div>
                <div className="flex gap-2 flex-wrap">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => bulkChangeSearchResults(cat)}
                      className="px-4 py-2 rounded-lg font-semibold transition-all hover:scale-105"
                      style={{ 
                        backgroundColor: categoryColors[cat],
                        color: 'white'
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { id: 'tracker', label: 'Add Expense', icon: Plus },
            { id: 'import', label: 'Import CSV', icon: Upload },
            { id: 'income', label: 'Income', icon: Coins },
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            { id: 'budgets', label: 'Budgets', icon: Target },
            { id: 'ai-chat', label: 'AI Chat', icon: MessageSquare },
            { id: 'advisor', label: 'AI Advisor', icon: MessageCircle }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveView(id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                activeView === id
                  ? 'bg-emerald-500 text-white shadow-lg'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <Icon size={20} />
              {label}
            </button>
          ))}
        </div>

        {/* Add Expense View */}
        {activeView === 'tracker' && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Add Expense Form */}
            <div className="bg-slate-800 rounded-xl p-6 shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Plus size={24} />
                Add New Expense
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-slate-300 block mb-2">Description</label>
                  <input
                    type="text"
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({...newExpense, description: e.target.value, suggestedCategory: null})}
                    onBlur={handleDescriptionBlur}
                    className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="e.g., Woolworths, Shell, Netflix..."
                  />
                  {isCategorizingExpense && (
                    <p className="text-sm text-slate-400 mt-1">🤖 AI is analyzing...</p>
                  )}
                </div>

                <div>
                  <label className="text-slate-300 block mb-2">Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                    className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-2 flex items-center gap-2">
                    Category
                    {newExpense.suggestedCategory && (
                      <span className={`text-xs px-2 py-1 rounded ${
                        newExpense.confidence === 'high' ? 'bg-emerald-600 text-white' :
                        newExpense.confidence === 'medium' ? 'bg-yellow-600 text-white' :
                        'bg-orange-600 text-white'
                      }`}>
                        AI: {newExpense.confidence} confidence
                      </span>
                    )}
                  </label>
                  <select
                    value={newExpense.category}
                    onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                    className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  {newExpense.confidence === 'low' && (
                    <p className="text-xs text-orange-400 mt-1 flex items-center gap-1">
                      <HelpCircle size={12} />
                      AI wasn't sure - please verify this category
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-slate-300 block mb-2">Date</label>
                  <input
                    type="date"
                    value={newExpense.date}
                    onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                    className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <button
                  onClick={addExpense}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={20} />
                  Add Expense
                </button>
              </div>
            </div>

            {/* Recent Expenses */}
            <div className="bg-slate-800 rounded-xl p-6 shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Calendar size={24} />
                Recent Expenses
              </h2>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {expenses.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">No expenses yet. Add your first one!</p>
                ) : (
                  expenses.slice().reverse().map(expense => (
                    <div key={expense.id} className="bg-slate-700 rounded-lg p-4 flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-semibold text-white">{expense.description}</div>
                        <div className="text-sm text-slate-400 flex items-center gap-2 mt-1">
                          <span className="px-2 py-1 rounded" style={{ backgroundColor: categoryColors[expense.category] + '40', color: categoryColors[expense.category] }}>
                            {expense.category}
                          </span>
                          <span>{new Date(expense.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-emerald-400">${expense.amount.toFixed(2)}</span>
                        <button
                          onClick={() => deleteExpense(expense.id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* CSV Import View */}
        {activeView === 'import' && (
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-xl p-6 shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Upload size={24} />
                Smart Import - Income & Expenses
              </h2>
              
              <div className="bg-slate-700 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                  <FileText size={18} />
                  Universal Import Features:
                </h3>
                <ul className="text-slate-300 space-y-2 ml-4 list-disc">
                  <li><strong>Auto-separates:</strong> Positive amounts → Income, Negative amounts → Expenses</li>
                  <li><strong>Smart categorization:</strong> AI + merchant database for expenses</li>
                  <li><strong>Duplicate detection:</strong> Won't import the same transaction twice</li>
                  <li><strong>Review before import:</strong> Adjust categories as needed</li>
                  <li><strong>Works with any bank:</strong> Requires Date, Description, Amount columns</li>
                </ul>
                <p className="text-sm text-slate-400 mt-3">
                  💡 Export from NAB, CommBank, Westpac, ANZ, or any other bank as CSV
                </p>
              </div>

              <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleCSVUpload}
                  className="hidden"
                  id="csv-upload"
                />
                <label
                  htmlFor="csv-upload"
                  className="cursor-pointer flex flex-col items-center gap-3"
                >
                  <Upload size={48} className="text-slate-400" />
                  <div>
                    <p className="text-white font-semibold mb-1">Click to upload bank statement (CSV)</p>
                    <p className="text-slate-400 text-sm">Automatically handles income and expenses</p>
                  </div>
                </label>
              </div>

              {csvImportStatus && (
                <div className={`mt-4 p-4 rounded-lg ${
                  csvImportStatus.includes('Error') ? 'bg-red-900/30 text-red-300 border border-red-500' :
                  csvImportStatus.includes('✅ Import Complete') ? 'bg-emerald-900/30 text-emerald-300 border border-emerald-500' :
                  csvImportStatus.includes('duplicates') ? 'bg-blue-900/30 text-blue-300 border border-blue-500' :
                  csvImportStatus.includes('Review') ? 'bg-emerald-900/30 text-emerald-300 border border-emerald-500' :
                  'bg-blue-900/30 text-blue-300 border border-blue-500'
                }`}>
                  <div className="flex items-center gap-2">
                    {csvImportStatus.includes('Processing') || csvImportStatus.includes('Analyzing') || csvImportStatus.includes('Categorizing') ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-300 border-t-transparent"></div>
                    ) : csvImportStatus.includes('✅') ? (
                      <span className="text-xl">✅</span>
                    ) : null}
                    <span>{csvImportStatus}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Review Imported Transactions */}
            {(pendingImports.length > 0 || pendingIncomeImports.length > 0) && (
              <div className="space-y-6">
                {/* Review Expenses */}
                {pendingImports.length > 0 && (
                  <div className="bg-slate-800 rounded-xl p-6 shadow-xl">
                    <h3 className="text-xl font-bold text-white mb-4">
                      💳 Review Expenses ({pendingImports.length})
                    </h3>
                    
                    <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
                      {pendingImports.map(transaction => (
                        <div key={transaction.id} className="bg-slate-700 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <div className="font-semibold text-white">{transaction.description}</div>
                              <div className="text-sm text-slate-400">
                                {new Date(transaction.date).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="text-lg font-bold text-red-400">
                              -${transaction.amount.toFixed(2)}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <select
                              value={transaction.category}
                              onChange={(e) => updatePendingCategory(transaction.id, e.target.value)}
                              className="flex-1 bg-slate-600 text-white px-3 py-2 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                            >
                              {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                            <span className={`text-xs px-2 py-1 rounded ${
                              transaction.confidence === 'high' ? 'bg-emerald-600 text-white' :
                              transaction.confidence === 'medium' ? 'bg-yellow-600 text-white' :
                              'bg-orange-600 text-white'
                            }`}>
                              {transaction.confidence}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Review Income */}
                {pendingIncomeImports.length > 0 && (
                  <div className="bg-slate-800 rounded-xl p-6 shadow-xl">
                    <h3 className="text-xl font-bold text-white mb-4">
                      💰 Review Income ({pendingIncomeImports.length})
                    </h3>
                    
                    <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
                      {pendingIncomeImports.map(item => (
                        <div key={item.id} className="bg-slate-700 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <div className="font-semibold text-white">{item.source}</div>
                              <div className="text-sm text-slate-400">
                                {new Date(item.date).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="text-lg font-bold text-emerald-400">
                              +${item.amount.toFixed(2)}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <label className="text-slate-400 text-sm">Category:</label>
                            <select
                              value={item.category}
                              onChange={(e) => updatePendingIncomeCategory(item.id, e.target.value)}
                              className="flex-1 bg-slate-600 text-white px-3 py-2 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                            >
                              {incomeCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Combined Import Button */}
                <div className="bg-slate-800 rounded-xl p-6 shadow-xl">
                  <div className="flex gap-3">
                    <button
                      onClick={confirmImport}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-lg transition-colors"
                    >
                      Import All ({pendingImports.length} expenses{pendingIncomeImports.length > 0 && `, ${pendingIncomeImports.length} income`})
                    </button>
                    <button
                      onClick={() => {
                        setPendingImports([]);
                        setPendingIncomeImports([]);
                        setCsvImportStatus('');
                      }}
                      className="px-6 bg-slate-600 hover:bg-slate-500 text-white font-bold py-3 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Income View */}
        {activeView === 'income' && (
          <div className="space-y-6">
            {/* Income Entry and CSV Import */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Manual Income Entry */}
              <div className="bg-slate-800 rounded-xl p-6 shadow-xl">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <Coins size={24} />
                  Add Income
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-slate-300 block mb-2">Source</label>
                    <input
                      type="text"
                      id="income-source"
                      placeholder="e.g., Monthly Salary, Client Payment"
                      className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-2">Category</label>
                    <select
                      id="income-category"
                      className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      {incomeCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-2">Amount ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      id="income-amount"
                      placeholder="0.00"
                      className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-2">Date</label>
                    <input
                      type="date"
                      id="income-date"
                      defaultValue={new Date().toISOString().split('T')[0]}
                      className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  <button
                    onClick={() => {
                      const source = document.getElementById('income-source').value;
                      const category = document.getElementById('income-category').value;
                      const amount = parseFloat(document.getElementById('income-amount').value);
                      const date = document.getElementById('income-date').value;
                      
                      if (!source || !amount) return;
                      
                      addToUndoStack('income', income);
                      const newIncome = [...income, { id: Date.now(), source, category, amount, date }];
                      setIncome(newIncome);
                      saveIncome(newIncome);
                      showSaveNotification('✓ Income added');
                      
                      document.getElementById('income-source').value = '';
                      document.getElementById('income-amount').value = '';
                      document.getElementById('income-date').value = new Date().toISOString().split('T')[0];
                    }}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus size={20} />
                    Add Income
                  </button>
                </div>
              </div>

              {/* Import Info */}
              <div className="bg-slate-800 rounded-xl p-6 shadow-xl">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <Upload size={24} />
                  Import Income from CSV
                </h2>
                
                <div className="bg-blue-900/30 border border-blue-500 rounded-lg p-4">
                  <p className="text-blue-200 mb-3">
                    <strong>💡 Use the "Import CSV" tab</strong> to upload your bank statements.
                  </p>
                  <p className="text-blue-200 text-sm mb-2">
                    The smart importer will automatically:
                  </p>
                  <ul className="text-blue-200 text-sm space-y-1 ml-4 list-disc">
                    <li>Detect positive amounts as income</li>
                    <li>Detect negative amounts as expenses</li>
                    <li>Let you categorize both before importing</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Income Summary & List */}
            <div className="bg-slate-800 rounded-xl p-6 shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-4">Income History</h2>
              
              <div className="mb-4 bg-slate-700 rounded-lg p-4">
                <div className="text-slate-300 text-sm">Total Income</div>
                <div className="text-emerald-400 text-3xl font-bold">
                  ${income.reduce((sum, i) => sum + i.amount, 0).toFixed(2)}
                </div>
                <div className="text-slate-400 text-sm mt-2">
                  Net: ${(income.reduce((sum, i) => sum + i.amount, 0) - getTotalExpenses()).toFixed(2)}
                  {income.reduce((sum, i) => sum + i.amount, 0) > 0 && (
                    <span className="ml-2">
                      ({((1 - getTotalExpenses() / income.reduce((sum, i) => sum + i.amount, 0)) * 100).toFixed(1)}% saved)
                    </span>
                  )}
                </div>
              </div>

              {/* Income by Category */}
              {income.length > 0 && (
                <div className="mb-4 space-y-2">
                  {incomeCategories.map(cat => {
                    const catTotal = income.filter(i => i.category === cat).reduce((sum, i) => sum + i.amount, 0);
                    if (catTotal === 0) return null;
                    const catCount = income.filter(i => i.category === cat).length;
                    return (
                      <div key={cat} className="bg-slate-600 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: incomeCategoryColors[cat] }}></span>
                            <span className="text-white font-medium">{cat}</span>
                            <span className="text-slate-400 text-sm">({catCount})</span>
                          </div>
                          <span className="text-emerald-400 font-bold">${catTotal.toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {income.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">No income entries yet</p>
                ) : (
                  income.slice().reverse().map(item => (
                    <div key={item.id} className="bg-slate-700 rounded-lg p-4 flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-semibold text-white">{item.source}</div>
                        <div className="text-sm text-slate-400 flex items-center gap-2">
                          {new Date(item.date).toLocaleDateString()}
                          <span className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: incomeCategoryColors[item.category] + '40', color: incomeCategoryColors[item.category] }}>
                            {item.category}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-emerald-400">${item.amount.toFixed(2)}</span>
                        <button
                          onClick={() => {
                            addToUndoStack('income', income);
                            const newIncome = income.filter(i => i.id !== item.id);
                            setIncome(newIncome);
                            saveIncome(newIncome);
                            showSaveNotification('✓ Income deleted');
                          }}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Overview View */}
        {activeView === 'overview' && (
          <div className="space-y-6">
            {/* Category Spending */}
            <div className="bg-slate-800 rounded-xl p-6 shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-6">Spending by Category</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* Pie Chart */}
                <div className="flex items-center justify-center">
                  {getPieChartData().length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={getPieChartData()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {getPieChartData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={categoryColors[entry.name]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-slate-400">No expense data yet</p>
                  )}
                </div>

                {/* Category List with click to view details */}
                <div className="space-y-3">
                  {categories.map(cat => {
                    const total = getCategoryTotal(cat);
                    if (total === 0) return null;
                    const categoryExpenses = expenses.filter(e => e.category === cat);
                    return (
                      <div key={cat} className="bg-slate-700 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold text-white">{cat}</span>
                          <span className="text-emerald-400 font-bold">${total.toFixed(2)}</span>
                        </div>
                        <div className="h-2 bg-slate-600 rounded-full overflow-hidden mb-2">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${(total / getTotalExpenses()) * 100}%`,
                              backgroundColor: categoryColors[cat]
                            }}
                          />
                        </div>
                        <button
                          onClick={() => setSelectedCategory(cat)}
                          className="text-sm text-slate-400 hover:text-emerald-400 transition-colors"
                        >
                          View {categoryExpenses.length} transactions →
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Monthly Trend */}
            <div className="bg-slate-800 rounded-xl p-6 shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-6">Monthly Spending Trend</h2>
              {getMonthlyData().length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getMonthlyData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis dataKey="month" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip 
                      formatter={(value) => `$${value.toFixed(2)}`}
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                    />
                    <Bar dataKey="amount" fill="#10b981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-slate-400 text-center">No monthly data yet</p>
              )}
            </div>
          </div>
        )}

        {/* Category Detail Modal */}
        {selectedCategory && (
          <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 overflow-y-auto p-4" onClick={() => {
            setSelectedCategory(null);
            setModalFilter('');
            setModalSort('amount-desc');
          }}>
            <div className="bg-slate-800 rounded-xl max-w-2xl w-full my-8 flex flex-col max-h-[calc(100vh-4rem)]" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-slate-700 flex-shrink-0">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full" style={{ backgroundColor: getCategoryColor(selectedCategory) }}></span>
                    {selectedCategory} Expenses
                  </h3>
                  <button
                    onClick={() => {
                      setSelectedCategory(null);
                      setModalFilter('');
                      setModalSort('amount-desc');
                    }}
                    className="text-slate-400 hover:text-white text-2xl leading-none"
                  >
                    ×
                  </button>
                </div>
                <p className="text-slate-400 mb-4">
                  Total: ${getCategoryTotal(selectedCategory).toFixed(2)}
                </p>

                {/* Filter and Sort Controls */}
                <div className="flex gap-3 flex-col sm:flex-row">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      value={modalFilter}
                      onChange={(e) => setModalFilter(e.target.value)}
                      placeholder="Filter by name..."
                      className="w-full bg-slate-700 text-white text-sm pl-9 pr-3 py-2 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div className="relative">
                    <SlidersHorizontal className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                    <select
                      value={modalSort}
                      onChange={(e) => setModalSort(e.target.value)}
                      className="bg-slate-700 text-white text-sm pl-9 pr-8 py-2 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none appearance-none cursor-pointer"
                    >
                      <option value="date-desc">Date (Newest)</option>
                      <option value="date-asc">Date (Oldest)</option>
                      <option value="amount-desc">Amount (High-Low)</option>
                      <option value="amount-asc">Amount (Low-High)</option>
                      <option value="name-asc">Name (A-Z)</option>
                      <option value="name-desc">Name (Z-A)</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 min-h-0">
                <div className="space-y-3">
                  {getFilteredSortedExpenses(selectedCategory).length === 0 ? (
                    <p className="text-slate-400 text-center py-8">
                      {modalFilter ? 'No expenses match your filter' : 'No expenses in this category'}
                    </p>
                  ) : (
                    getFilteredSortedExpenses(selectedCategory).map(expense => (
                      <div key={expense.id} className="bg-slate-700 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="font-semibold text-white">{expense.description}</div>
                            <div className="text-sm text-slate-400">
                              {new Date(expense.date).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="text-lg font-bold text-emerald-400">
                            ${expense.amount.toFixed(2)}
                          </div>
                        </div>
                        
                        {editingExpense === expense.id ? (
                          <div className="mt-3">
                            <div className="text-xs text-slate-400 mb-2">Select new category:</div>
                            <select
                              value={expense.category}
                              onChange={(e) => {
                                const newCategory = e.target.value;
                                if (newCategory !== expense.category) {
                                  updateExpenseCategory(expense.id, newCategory);
                                }
                              }}
                              onBlur={() => setEditingExpense(null)}
                              className="w-full bg-slate-600 text-white px-3 py-2 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                              autoFocus
                            >
                              {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => setEditingExpense(null)}
                              className="text-xs text-slate-400 hover:text-slate-300 mt-2"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingExpense(expense.id)}
                            className="text-sm text-slate-400 hover:text-emerald-400 transition-colors mt-2"
                          >
                            Change category
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Update Confirmation Modal */}
        {bulkUpdateModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
            <div className="bg-slate-800 rounded-xl max-w-lg w-full p-6 border-2 border-emerald-500">
              <h3 className="text-xl font-bold text-white mb-4">
                📦 Update Multiple Expenses?
              </h3>
              
              <p className="text-slate-300 mb-4">
                Found <span className="font-bold text-emerald-400">{bulkUpdateModal.similarExpenses.length} other expense(s)</span> from the same or similar merchant:
              </p>

              <div className="bg-slate-700 rounded-lg p-3 mb-4 max-h-48 overflow-y-auto">
                <div className="font-semibold text-white mb-2">
                  "{bulkUpdateModal.expense.description}"
                </div>
                <div className="space-y-1 text-sm">
                  {bulkUpdateModal.similarExpenses.slice(0, 5).map(e => (
                    <div key={e.id} className="text-slate-400 flex justify-between">
                      <span>{e.description}</span>
                      <span className="text-slate-500">${e.amount.toFixed(2)}</span>
                    </div>
                  ))}
                  {bulkUpdateModal.similarExpenses.length > 5 && (
                    <div className="text-slate-500 italic">
                      ...and {bulkUpdateModal.similarExpenses.length - 5} more
                    </div>
                  )}
                </div>
              </div>

              <p className="text-slate-300 mb-6">
                Change all to <span className="font-bold" style={{ color: categoryColors[bulkUpdateModal.newCategory] }}>
                  {bulkUpdateModal.newCategory}
                </span>?
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => updateMultipleExpenses(
                    bulkUpdateModal.allIds,
                    bulkUpdateModal.newCategory,
                    bulkUpdateModal.expense.description
                  )}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-lg transition-colors"
                >
                  Yes, Update All {bulkUpdateModal.allIds.length}
                </button>
                <button
                  onClick={() => {
                    updateSingleExpense(
                      bulkUpdateModal.expense.id,
                      bulkUpdateModal.newCategory,
                      bulkUpdateModal.expense.description
                    );
                    setBulkUpdateModal(null);
                  }}
                  className="flex-1 bg-slate-600 hover:bg-slate-500 text-white font-bold py-3 rounded-lg transition-colors"
                >
                  Just This One
                </button>
              </div>
              
              <button
                onClick={() => setBulkUpdateModal(null)}
                className="w-full mt-3 text-slate-400 hover:text-white py-2 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Analytics View */}
        {activeView === 'analytics' && (
          <div className="space-y-6">
            {/* Spending Statistics */}
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-slate-800 rounded-xl p-4 shadow-xl">
                <div className="text-slate-400 text-sm">Avg per Day</div>
                <div className="text-white text-2xl font-bold">
                  ${(() => {
                    const filtered = getFilteredExpenses();
                    if (filtered.length === 0) return '0.00';
                    const dates = filtered.map(e => new Date(e.date).getTime());
                    const oldestDate = Math.min(...dates);
                    const newestDate = Math.max(...dates);
                    const daysDiff = Math.max(1, Math.ceil((newestDate - oldestDate) / (1000 * 60 * 60 * 24))) + 1;
                    return (getTotalExpenses() / daysDiff).toFixed(2);
                  })()}
                </div>
                <div className="text-slate-400 text-xs mt-1">
                  {getFilteredExpenses().length > 0 && (() => {
                    const filtered = getFilteredExpenses();
                    const dates = filtered.map(e => new Date(e.date).getTime());
                    const oldestDate = Math.min(...dates);
                    const newestDate = Math.max(...dates);
                    const daysDiff = Math.max(1, Math.ceil((newestDate - oldestDate) / (1000 * 60 * 60 * 24))) + 1;
                    return `Over ${daysDiff} days`;
                  })()}
                </div>
              </div>
              
              <div className="bg-slate-800 rounded-xl p-4 shadow-xl">
                <div className="text-slate-400 text-sm">Avg per Week</div>
                <div className="text-white text-2xl font-bold">
                  ${(() => {
                    const filtered = getFilteredExpenses();
                    if (filtered.length === 0) return '0.00';
                    const dates = filtered.map(e => new Date(e.date).getTime());
                    const oldestDate = Math.min(...dates);
                    const newestDate = Math.max(...dates);
                    const weeksDiff = Math.max(1, Math.ceil((newestDate - oldestDate) / (1000 * 60 * 60 * 24 * 7)));
                    return (getTotalExpenses() / weeksDiff).toFixed(2);
                  })()}
                </div>
                <div className="text-slate-400 text-xs mt-1">
                  {getFilteredExpenses().length > 0 && (() => {
                    const filtered = getFilteredExpenses();
                    const dates = filtered.map(e => new Date(e.date).getTime());
                    const oldestDate = Math.min(...dates);
                    const newestDate = Math.max(...dates);
                    const weeksDiff = Math.max(1, Math.ceil((newestDate - oldestDate) / (1000 * 60 * 60 * 24 * 7)));
                    return `Over ${weeksDiff} weeks`;
                  })()}
                </div>
              </div>
              
              <div className="bg-slate-800 rounded-xl p-4 shadow-xl">
                <div className="text-slate-400 text-sm">Total Transactions</div>
                <div className="text-white text-2xl font-bold">{getFilteredExpenses().length}</div>
                <div className="text-slate-400 text-xs mt-1">
                  {getFilteredExpenses().length > 0 && (() => {
                    const filtered = getFilteredExpenses();
                    const dates = filtered.map(e => new Date(e.date));
                    const oldestDate = new Date(Math.min(...dates.map(d => d.getTime())));
                    const newestDate = new Date(Math.max(...dates.map(d => d.getTime())));
                    return `${oldestDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${newestDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
                  })()}
                </div>
              </div>
              
              <div className="bg-slate-800 rounded-xl p-4 shadow-xl">
                <div className="text-slate-400 text-sm">Avg Transaction</div>
                <div className="text-white text-2xl font-bold">
                  ${getFilteredExpenses().length > 0 ? (getTotalExpenses() / getFilteredExpenses().length).toFixed(2) : '0.00'}
                </div>
                <div className="text-slate-400 text-xs mt-1">Per purchase</div>
              </div>
            </div>

            {/* Top Suppliers by Category */}
            <div className="bg-slate-800 rounded-xl p-6 shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-6">Top Suppliers by Category</h2>
              
              <div className="space-y-6">
                {categories.map(category => {
                  const categoryExpenses = getFilteredExpenses().filter(e => e.category === category);
                  if (categoryExpenses.length === 0) return null;
                  
                  // Group by supplier
                  const supplierTotals = {};
                  categoryExpenses.forEach(e => {
                    const supplier = e.description;
                    supplierTotals[supplier] = (supplierTotals[supplier] || 0) + e.amount;
                  });
                  
                  // Sort and get top 5
                  const topSuppliers = Object.entries(supplierTotals)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5);
                  
                  const categoryTotal = getCategoryTotal(category);
                  
                  return (
                    <div key={category} className="bg-slate-700 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-white flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: getCategoryColor(category) }}></span>
                          {category}
                        </h3>
                        <span className="text-slate-400 text-sm">
                          ${categoryTotal.toFixed(2)} total
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        {topSuppliers.map(([supplier, amount], idx) => {
                          const percentage = (amount / categoryTotal) * 100;
                          const count = categoryExpenses.filter(e => e.description === supplier).length;
                          
                          return (
                            <div key={supplier} className="bg-slate-600 rounded p-3">
                              <div className="flex justify-between items-center mb-2">
                                <div className="flex-1">
                                  <div className="text-white text-sm font-medium">{supplier}</div>
                                  <div className="text-slate-400 text-xs">
                                    {count} transaction{count !== 1 ? 's' : ''} • Avg ${(amount / count).toFixed(2)}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-emerald-400 font-bold">${amount.toFixed(2)}</div>
                                  <div className="text-slate-400 text-xs">{percentage.toFixed(1)}%</div>
                                </div>
                              </div>
                              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{
                                    width: `${percentage}%`,
                                    backgroundColor: categoryColors[category]
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Budgets View */}
        {activeView === 'budgets' && (
          <div className="bg-slate-800 rounded-xl p-6 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Target size={24} />
              Set Budget Goals
            </h2>
            
            <div className="space-y-4">
              {categories.map(cat => {
                const spent = getCategoryTotal(cat);
                const budget = budgets[cat] || 0;
                const percentage = budget > 0 ? (spent / budget) * 100 : 0;
                const isOverBudget = spent > budget && budget > 0;

                return (
                  <div key={cat} className="bg-slate-700 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-semibold text-white text-lg">{cat}</span>
                      <div className="flex items-center gap-4">
                        <span className={`font-bold ${isOverBudget ? 'text-red-400' : 'text-emerald-400'}`}>
                          ${spent.toFixed(2)} / ${budget.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-3 items-center mb-2">
                      <input
                        type="number"
                        step="10"
                        value={budget || ''}
                        onChange={(e) => updateBudget(cat, e.target.value)}
                        className="flex-1 bg-slate-600 text-white px-3 py-2 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        placeholder="Set budget..."
                      />
                      <DollarSign className="text-slate-400" size={20} />
                    </div>

                    {budget > 0 && (
                      <div className="h-3 bg-slate-600 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isOverBudget ? 'bg-red-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    )}

                    {isOverBudget && (
                      <p className="text-red-400 text-sm mt-2">
                        ⚠️ Over budget by ${(spent - budget).toFixed(2)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* AI Chat View */}
        {activeView === 'ai-chat' && (
          <div className="bg-slate-800 rounded-xl p-6 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <MessageSquare size={24} />
              AI Chat - Ask About Your Spending
            </h2>
            
            <p className="text-slate-300 mb-6">
              Ask questions like "Am I spending too much on coffee?", "What's my biggest expense category?", "How much did I spend last month?"
            </p>

            {/* Chat Messages */}
            <div className="bg-slate-700 rounded-lg p-4 mb-4 h-96 overflow-y-auto">
              {aiChatMessages.length === 0 ? (
                <div className="text-slate-400 text-center py-8">
                  <MessageSquare size={48} className="mx-auto mb-3 opacity-50" />
                  <p>Start a conversation about your spending!</p>
                  <p className="text-sm mt-2">Try: "How much am I spending on eating out?"</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {aiChatMessages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-lg p-3 ${
                        msg.role === 'user' 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-slate-600 text-slate-100'
                      }`}>
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      </div>
                    </div>
                  ))}
                  {isAiChatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-slate-600 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-300 border-t-transparent"></div>
                          <span className="text-slate-300">Analyzing...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="flex gap-3">
              <input
                type="text"
                value={aiChatInput}
                onChange={(e) => setAiChatInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (aiChatInput.trim() && !isAiChatLoading) {
                      handleAiChat();
                    }
                  }
                }}
                placeholder="Ask about your spending..."
                className="flex-1 bg-slate-700 text-white px-4 py-3 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                disabled={isAiChatLoading}
              />
              <button
                onClick={() => {
                  if (aiChatInput.trim() && !isAiChatLoading) {
                    handleAiChat();
                  }
                }}
                disabled={isAiChatLoading || !aiChatInput.trim()}
                className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-colors"
              >
                Send
              </button>
            </div>
            
            {aiChatMessages.length > 0 && (
              <button
                onClick={() => setAiChatMessages([])}
                className="text-slate-400 hover:text-slate-300 text-sm mt-3"
              >
                Clear conversation
              </button>
            )}
          </div>
        )}

        {/* AI Advisor View */}
        {activeView === 'advisor' && (
          <div className="bg-slate-800 rounded-xl p-6 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <MessageCircle size={24} />
              AI Financial Advisor
            </h2>
            
            <p className="text-slate-300 mb-4">
              Get personalized advice based on your spending patterns and budget goals.
            </p>

            {/* Tone Selector */}
            <div className="mb-6 bg-slate-700 rounded-lg p-4">
              <label className="text-slate-300 font-semibold mb-3 block">Advisor Tone:</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setAdvisorTone('encouraging')}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                    advisorTone === 'encouraging'
                      ? 'bg-emerald-500 text-white shadow-lg'
                      : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                  }`}
                >
                  😊 Encouraging
                  <div className="text-xs mt-1 opacity-80">Supportive & positive</div>
                </button>
                <button
                  onClick={() => setAdvisorTone('brutal')}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                    advisorTone === 'brutal'
                      ? 'bg-red-500 text-white shadow-lg'
                      : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                  }`}
                >
                  🔥 Brutal Honesty
                  <div className="text-xs mt-1 opacity-80">No sugarcoating</div>
                </button>
              </div>
            </div>

            <button
              onClick={getAIAdvice}
              disabled={isLoadingAI || expenses.length === 0}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-colors mb-6"
            >
              {isLoadingAI ? 'Analyzing your finances...' : `Get ${advisorTone === 'brutal' ? 'Brutal' : 'Friendly'} AI Advice`}
            </button>

            {expenses.length === 0 && (
              <p className="text-slate-400 text-center py-4">
                Add some expenses first to get personalized advice!
              </p>
            )}

            {aiResponse && (
              <div className={`rounded-lg p-6 ${
                advisorTone === 'brutal' 
                  ? 'bg-red-900/20 border-2 border-red-500' 
                  : 'bg-slate-700'
              }`}>
                <div className="prose prose-invert max-w-none">
                  <div className="text-slate-200 whitespace-pre-wrap">{aiResponse}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FinanceTracker;
