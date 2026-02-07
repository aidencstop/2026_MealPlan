// 공통 타입 정의

export interface User {
  id: number;
  username: string;
  name: string;
  gender: 'male' | 'female' | 'other';
  age: number;
  diet_goal: 'weight_gain' | 'weight_loss' | 'maintenance';
  diet_characteristics: string[];
  created_at: Date;
  updated_at: Date;
}

export interface HealthCondition {
  id: number;
  user_id: number;
  condition_type: string;
  details: any;
  created_at: Date;
}

export interface Macro {
  carbs_g: number;
  protein_g: number;
  fat_g: number;
  ratio: {
    carbs_pct: number;
    protein_pct: number;
    fat_pct: number;
  };
}

export interface MealItem {
  name: string;
  portion?: string;
  note?: string;
}

export interface DailyMeal {
  breakfast: MealItem[];
  lunch: MealItem[];
  dinner: MealItem[];
}

export interface WeeklyIntake {
  sun: DailyMeal;
  mon: DailyMeal;
  tue: DailyMeal;
  wed: DailyMeal;
  thu: DailyMeal;
  fri: DailyMeal;
  sat: DailyMeal;
}

export interface IntakeEvaluation {
  macro: Macro;
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  cautions: string[];
}

export interface WeeklyIntakeRecord {
  id: number;
  user_id: number;
  year: number;
  week_start_date: string;
  week_end_date: string;
  intake_data: WeeklyIntake;
  macro: Macro;
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  cautions: string[];
  created_at: Date;
  updated_at: Date;
}

export interface MealPlanRationale {
  considered: string[];
  notes: string[];
}

export interface Substitution {
  avoid: string[];
  replace_with: string[];
}

export interface WeeklyMealPlan {
  id: number;
  user_id: number;
  year: number;
  week_start_date: string;
  week_end_date: string;
  plan_data: WeeklyIntake;
  plan_macro: Macro;
  rationale: MealPlanRationale;
  shopping_list: string[];
  substitutions: Substitution[];
  created_at: Date;
}

export interface UserProfile {
  user: User;
  health_conditions: HealthCondition[];
}

export interface WeekBounds {
  year: number;
  weekStartDate: string;
  weekEndDate: string;
}
