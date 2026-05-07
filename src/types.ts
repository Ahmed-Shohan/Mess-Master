/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Member {
  id: string;
  name: string;
  joinedAt: number;
}

export interface MealAttendance {
  breakfast: number; // 0 or 1 (usually 1 if present)
  lunch: number;
  dinner: number;
}

export interface DailyMealRecord {
  date: string; // YYYY-MM-DD
  members: Record<string, MealAttendance>; // memberId -> attendance
}

export type TransactionType = 'DEPOSIT' | 'EXPENSE';

export interface Transaction {
  id: string;
  memberId?: string; // Who paid (for deposits) or who spent (for expenses)
  amount: number;
  type: TransactionType;
  description: string;
  timestamp: number;
}

export interface SharedExpense {
  id: string;
  amount: number;
  description: string;
  timestamp: number;
}

export interface GuestRecord {
  id: string;
  memberId: string;
  guestName: string;
  startDate: string;
  endDate: string;
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
}

export interface AppState {
  members: Member[];
  mealRecords: DailyMealRecord[];
  transactions: Transaction[];
  sharedExpenses: SharedExpense[];
  guestRecords: GuestRecord[];
}

export const MEAL_COSTS = {
  BREAKFAST: 5,
  LUNCH: 20,
  DINNER: 10,
};

export const RICE_POTS = {
  BREAKFAST: 0.5,
  LUNCH: 1,
  DINNER: 0.5,
};
