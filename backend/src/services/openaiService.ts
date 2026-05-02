import OpenAI from 'openai';
import dotenv from 'dotenv';
import { UserProfile, IntakeEvaluation, WeeklyIntake, Macro, DailyMeal } from '../types/index.js';
import { normalizeMealPlanRationale } from '../utils/rationaleUtils.js';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

function buildEvaluateIntakePrompt(
  userProfile: UserProfile,
  lastWeekIntake: WeeklyIntake
): string {
  const { user, health_conditions } = userProfile;

  const healthInfo = health_conditions.map(c => c.condition_type).join(', ') || 'none';
  const allergies = health_conditions
    .filter(c => c.condition_type.startsWith('allergy_'))
    .map(c => c.condition_type.replace('allergy_', ''))
    .join(', ') || 'none';

  const dayNames: Record<string, string> = {
    sun: 'Sunday', mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday',
    thu: 'Thursday', fri: 'Friday', sat: 'Saturday'
  };
  const intakeText = (Object.entries(lastWeekIntake) as [string, DailyMeal][])
    .map(([day, meals]) => {
      return `${dayNames[day]}:
  Breakfast: ${meals.breakfast.map(m => m.name).join(', ') || 'none'}
  Lunch: ${meals.lunch.map(m => m.name).join(', ') || 'none'}
  Dinner: ${meals.dinner.map(m => m.name).join(', ') || 'none'}`;
    })
    .join('\n');

  return `You are a professional nutritionist. Analyze the user's weekly meal intake and provide an evaluation.

User profile:
- Gender: ${user.gender === 'male' ? 'Male' : user.gender === 'female' ? 'Female' : 'Other'}
- Age: ${user.age}
- Diet goal: ${user.diet_goal === 'weight_gain' ? 'Weight gain' : user.diet_goal === 'weight_loss' ? 'Weight loss' : 'Maintenance'}
- Diet characteristics: ${user.diet_characteristics.join(', ') || 'none'}
- Health conditions: ${healthInfo}
- Allergies: ${allergies}

Last week's intake (Sunday–Saturday):
${intakeText}

Respond ONLY in the following JSON format. Output pure JSON with no markdown or extra text:

{
  "macro": {
    "calories": <total calories for 7 days (kcal)>,
    "carbs_g": <total carbs for 7 days (g)>,
    "protein_g": <total protein for 7 days (g)>,
    "fat_g": <total fat for 7 days (g)>,
    "ratio": {
      "carbs_pct": <carbs percentage>,
      "protein_pct": <protein percentage>,
      "fat_pct": <fat percentage>
    }
  },
  "strengths": [
    "<strength 1>",
    "<strength 2>",
    "<strength 3>"
  ],
  "weaknesses": [
    "<weakness 1>",
    "<weakness 2>",
    "<weakness 3>"
  ],
  "improvements": [
    "<improvement 1>",
    "<improvement 2>",
    "<improvement 3>",
    "<improvement 4>",
    "<improvement 5>"
  ],
  "cautions": [
    "<caution 1>",
    "<caution 2>",
    "<caution 3>"
  ]
}

Requirements:
- **Important: macro is the TOTAL for all 7 days. Sum all 21 meals (breakfast/lunch/dinner).**
- Example totals: calories 14000–17500 kcal, carbs 2000–2500g, protein 500–700g, fat 400–600g
- Calories: carbs(4 kcal/g) + protein(4 kcal/g) + fat(9 kcal/g)
- Consider user's diet goal, characteristics, and health
- Strengths: 3–5 positive aspects
- Weaknesses: 3–5 areas to improve
- Improvements: 5–8 specific, actionable suggestions
- Cautions: 3–5 warnings related to allergies and health
- Write ALL output text in English
- Output pure JSON only, no markdown`;
}

function buildGenerateMealPlanPrompt(
  userProfile: UserProfile,
  weekStartDate: string,
  weekEndDate: string,
  lastWeekSummary?: IntakeEvaluation,
  lastWeekIntake?: WeeklyIntake
): string {
  const { user, health_conditions } = userProfile;

  const healthInfo = health_conditions.map(c => c.condition_type).join(', ') || 'none';
  const allergies = health_conditions
    .filter(c => c.condition_type.startsWith('allergy_'))
    .map(c => c.condition_type.replace('allergy_', ''))
    .join(', ') || 'none';

  let lastWeekInfo = '';
  if (lastWeekSummary && lastWeekIntake) {
    const dayNames: Record<string, string> = {
      sun: 'Sunday', mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday',
      thu: 'Thursday', fri: 'Friday', sat: 'Saturday'
    };
    const intakeText = (Object.entries(lastWeekIntake) as [string, DailyMeal][])
      .map(([day, meals]) => {
        return `${dayNames[day]}: Breakfast(${meals.breakfast.map(m => m.name).join(', ')}), Lunch(${meals.lunch.map(m => m.name).join(', ')}), Dinner(${meals.dinner.map(m => m.name).join(', ')})`;
      })
      .join('\n');

    lastWeekInfo = `
Last week evaluation:
- Macros: Carbs ${lastWeekSummary.macro.carbs_g}g, Protein ${lastWeekSummary.macro.protein_g}g, Fat ${lastWeekSummary.macro.fat_g}g
- Strengths: ${lastWeekSummary.strengths.join(', ')}
- Weaknesses: ${lastWeekSummary.weaknesses.join(', ')}
- Improvements: ${lastWeekSummary.improvements.join(', ')}

Last week intake:
${intakeText}
`;
  }

  return `You are a professional nutritionist. Create a personalized weekly meal plan for the user.
For the rationale.notes paragraph shown in the app, write in a warm, conversational tone and explain in sufficient detail.

Create a personalized weekly meal plan.

User profile:
- Gender: ${user.gender === 'male' ? 'Male' : user.gender === 'female' ? 'Female' : 'Other'}
- Age: ${user.age}
- Diet goal: ${user.diet_goal === 'weight_gain' ? 'Weight gain' : user.diet_goal === 'weight_loss' ? 'Weight loss' : 'Maintenance'}
- Diet characteristics: ${user.diet_characteristics.join(', ') || 'none'}
- Health conditions: ${healthInfo}
- Allergies: ${allergies}
${lastWeekInfo}
This week:
- Start: ${weekStartDate}
- End: ${weekEndDate}

Respond ONLY in the following JSON format. Output pure JSON with no markdown or extra text:

{
  "week": {
    "start_date": "${weekStartDate}",
    "end_date": "${weekEndDate}"
  },
  "plan": {
    "sun": {
      "breakfast": ["<food1>", "<food2>", "<food3>"],
      "lunch": ["<food1>", "<food2>", "<food3>"],
      "dinner": ["<food1>", "<food2>", "<food3>"]
    },
    "mon": {
      "breakfast": ["<food1>", "<food2>", "<food3>"],
      "lunch": ["<food1>", "<food2>", "<food3>"],
      "dinner": ["<food1>", "<food2>", "<food3>"]
    },
    "tue": {
      "breakfast": ["<food1>", "<food2>", "<food3>"],
      "lunch": ["<food1>", "<food2>", "<food3>"],
      "dinner": ["<food1>", "<food2>", "<food3>"]
    },
    "wed": {
      "breakfast": ["<food1>", "<food2>", "<food3>"],
      "lunch": ["<food1>", "<food2>", "<food3>"],
      "dinner": ["<food1>", "<food2>", "<food3>"]
    },
    "thu": {
      "breakfast": ["<food1>", "<food2>", "<food3>"],
      "lunch": ["<food1>", "<food2>", "<food3>"],
      "dinner": ["<food1>", "<food2>", "<food3>"]
    },
    "fri": {
      "breakfast": ["<food1>", "<food2>", "<food3>"],
      "lunch": ["<food1>", "<food2>", "<food3>"],
      "dinner": ["<food1>", "<food2>", "<food3>"]
    },
    "sat": {
      "breakfast": ["<food1>", "<food2>", "<food3>"],
      "lunch": ["<food1>", "<food2>", "<food3>"],
      "dinner": ["<food1>", "<food2>", "<food3>"]
    }
  },
  "plan_macro": {
    "calories": <total for 7 days (kcal)>,
    "carbs_g": <total (g)>,
    "protein_g": <total (g)>,
    "fat_g": <total (g)>,
    "ratio": {
      "carbs_pct": <number>,
      "protein_pct": <number>,
      "fat_pct": <number>
    }
  },
  "rationale": {
    "considered": [
      "<how age/gender was reflected, one line>",
      "<how diet goal was reflected, one line>",
      "<how diet characteristics were reflected, one line>",
      "<how health/allergies were reflected, one line>",
      "<how last week was reflected, or 'no last week record' if none>"
    ],
    "notes": "<Single paragraph string: Cover (1) ingredients/meals actually used this week, (2) how last week feedback was applied (or this week's intent), (3) encouragement/tips. Use friendly tone. 500–950 characters. No bullets, numbers, or newlines. One continuous paragraph.>"
  },
  "shopping_list": {
    "Vegetables": ["<item1>", "<item2>"],
    "Fruits": ["<item1>"],
    "Meat & Seafood": ["<item1>", "<item2>"],
    "Dairy & Eggs": ["<item1>"],
    "Grains & Processed": ["<item1>", "<item2>"],
    "Seasonings & Other": ["<item1>"]
  },
  "substitutions": [
    {
      "avoid": ["<food to avoid>"],
      "replace_with": ["<alternative1>", "<alternative2>"]
    }
  ]
}

Requirements:
- 2–4 items per meal
- Use commonly available foods
- NEVER include allergenic foods
- Respect diet characteristics (vegan, vegetarian, etc.)
- Optimize for diet goal
- If last week data exists, address weaknesses and build on strengths
- **plan_macro is TOTAL for 7 days. Sum all 21 meals.**
- Example: calories 14000–17500, carbs 2000–2500g, protein 500–700g, fat 400–600g
- Calories: carbs(4) + protein(4) + fat(9) kcal/g
- **shopping_list keys: Vegetables, Fruits, Meat & Seafood, Dairy & Eggs, Grains & Processed, Seasonings & Other. Use empty [] for categories with no items.**
- rationale.considered: **English only.** Short factual lines, not report-style headers
- rationale.notes: **English only.** Single string, friendly tone, 500–950 chars, one paragraph. Avoid clichés like "balance" or "optimize". Include 1–2 specific foods from the plan
- Write ALL output text (plan, rationale, shopping_list, substitutions) in English. Never use Korean in rationale.considered or rationale.notes
- Output pure JSON only, no markdown`;
}

export async function evaluateIntake(
  userProfile: UserProfile,
  lastWeekIntake: WeeklyIntake
): Promise<IntakeEvaluation> {
  const prompt = buildEvaluateIntakePrompt(userProfile, lastWeekIntake);

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error('OpenAI returned an empty response.');
    }

    const result = JSON.parse(content);
    return result;
  } catch (error: any) {
    console.error('Evaluate intake error:', error);
    throw new Error('An error occurred while generating the evaluation.');
  }
}

export async function generateMealPlan(
  userProfile: UserProfile,
  weekStartDate: string,
  weekEndDate: string,
  lastWeekSummary?: IntakeEvaluation,
  lastWeekIntake?: WeeklyIntake
): Promise<{
  plan: WeeklyIntake;
  plan_macro: Macro;
  rationale: { considered: string[]; notes: string };
  shopping_list: Record<string, string[]>;
  substitutions: Array<{ avoid: string[]; replace_with: string[] }>;
}> {
  const prompt = buildGenerateMealPlanPrompt(
    userProfile,
    weekStartDate,
    weekEndDate,
    lastWeekSummary,
    lastWeekIntake
  );

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      response_format: { type: 'json_object' }
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error('OpenAI returned an empty response.');
    }

    const result = JSON.parse(content);
    const rawList = result.shopping_list;
    const shopping_list =
      Array.isArray(rawList)
        ? { 'Other': rawList }
        : (typeof rawList === 'object' && rawList !== null ? rawList : { 'Other': [] });

    return {
      plan: result.plan,
      plan_macro: result.plan_macro,
      rationale: normalizeMealPlanRationale(result.rationale),
      shopping_list,
      substitutions: result.substitutions
    };
  } catch (error: any) {
    console.error('Meal plan generation error:', error);
    throw new Error('An error occurred while generating the meal plan.');
  }
}
