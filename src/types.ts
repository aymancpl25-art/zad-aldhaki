export type UserType = "family" | "employee" | "student";

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  userType: UserType;
  budgetLimit: number;
  currency: string;
  familyCount?: number;
  preferences?: string;
  createdAt: string;
}

export interface Meal {
  name: string;
  category: string;
  estimatedCost: number;
  ingredients: string[];
  isCompleted?: boolean;
}

export interface DailyMeals {
  breakfast: Meal;
  lunch: Meal;
  dinner: Meal;
  snack: Meal;
}

export interface DayPlan {
  dayName: string; // e.g. "السبت", "الأحد"
  meals: DailyMeals;
}

export interface MealPlan {
  id: string;
  userId: string;
  planType: "weekly" | "monthly";
  startDate: string;
  endDate: string;
  meals: DayPlan[]; // Array of 7 days
  totalEstimatedCost: number;
  savingTips?: string[];
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  category: string; // e.g., "بقالة", "مطاعم", "مستلزمات طوارئ"
  date: string;
  notes: string;
  createdAt: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: string;
  category: string; // e.g., "خضار وفواكه", "لحوم وأسماك", "ألبان وأجبان"
  isBought: boolean;
  estimatedCost?: number;
}

export interface ShoppingList {
  id: string;
  userId: string;
  items: ShoppingItem[];
  updatedAt: string;
}
