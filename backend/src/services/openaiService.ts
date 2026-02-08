import OpenAI from 'openai';
import dotenv from 'dotenv';
import { UserProfile, IntakeEvaluation, WeeklyIntake, Macro } from '../types/index.js';

// 환경변수 로드
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * 지난주 섭취 기록 평가 프롬프트 생성
 */
function buildEvaluateIntakePrompt(
  userProfile: UserProfile,
  lastWeekIntake: WeeklyIntake
): string {
  const { user, health_conditions } = userProfile;
  
  // 건강 상태 정리
  const healthInfo = health_conditions.map(c => c.condition_type).join(', ') || '없음';
  const allergies = health_conditions
    .filter(c => c.condition_type.startsWith('allergy_'))
    .map(c => c.condition_type.replace('allergy_', ''))
    .join(', ') || '없음';

  // 섭취 데이터를 텍스트로 변환
  const intakeText = Object.entries(lastWeekIntake)
    .map(([day, meals]) => {
      const dayNames: any = {
        sun: '일요일', mon: '월요일', tue: '화요일', wed: '수요일',
        thu: '목요일', fri: '금요일', sat: '토요일'
      };
      return `${dayNames[day]}:
  아침: ${meals.breakfast.map(m => m.name).join(', ') || '없음'}
  점심: ${meals.lunch.map(m => m.name).join(', ') || '없음'}
  저녁: ${meals.dinner.map(m => m.name).join(', ') || '없음'}`;
    })
    .join('\n');

  return `당신은 전문 영양사입니다. 사용자의 주간 식사 섭취 기록을 분석하고 평가를 제공하세요.

사용자 프로필:
- 성별: ${user.gender === 'male' ? '남성' : user.gender === 'female' ? '여성' : '기타'}
- 나이: ${user.age}세
- 식단 목적: ${user.diet_goal === 'weight_gain' ? '체중 증가' : user.diet_goal === 'weight_loss' ? '체중 감량' : '현상 유지'}
- 식단 특성: ${user.diet_characteristics.join(', ') || '없음'}
- 건강 상태: ${healthInfo}
- 알러지: ${allergies}

지난 주 섭취 내역 (일요일~토요일):
${intakeText}

다음 JSON 형식으로만 응답하세요. 마크다운 형식이나 추가 텍스트 없이 순수 JSON만 출력하세요:

{
  "macro": {
    "calories": <일주일(7일) 전체 칼로리 합계(kcal)>,
    "carbs_g": <일주일(7일) 전체 탄수화물 합계(g)>,
    "protein_g": <일주일(7일) 전체 단백질 합계(g)>,
    "fat_g": <일주일(7일) 전체 지방 합계(g)>,
    "ratio": {
      "carbs_pct": <탄수화물 비율(%)>,
      "protein_pct": <단백질 비율(%)>,
      "fat_pct": <지방 비율(%)>
    }
  },
  "strengths": [
    "<잘된 점 1>",
    "<잘된 점 2>",
    "<잘된 점 3>"
  ],
  "weaknesses": [
    "<아쉬운 점 1>",
    "<아쉬운 점 2>",
    "<아쉬운 점 3>"
  ],
  "improvements": [
    "<개선 방법 1>",
    "<개선 방법 2>",
    "<개선 방법 3>",
    "<개선 방법 4>",
    "<개선 방법 5>"
  ],
  "cautions": [
    "<주의사항 1>",
    "<주의사항 2>",
    "<주의사항 3>"
  ]
}

요구사항:
- **중요: macro는 일주일(일~토, 7일) 전체 영양소의 총합입니다. 아침/점심/저녁 총 21끼의 영양소를 모두 합산하여 계산하세요.**
- 일주일치 영양소 총합 예시: 칼로리 14000~17500kcal, 탄수화물 2000~2500g, 단백질 500~700g, 지방 400~600g 수준
- 칼로리 계산: 탄수화물(4kcal/g) + 단백질(4kcal/g) + 지방(9kcal/g)
- 사용자의 식단 목적, 특성, 건강 상태 고려
- 잘된 점: 3~5개의 긍정적인 측면
- 아쉬운 점: 3~5개의 개선이 필요한 부분
- 개선 방법: 5~8개의 구체적이고 실행 가능한 제안
- 주의사항: 알러지와 건강 상태 관련 경고 3~5개
- 모든 텍스트는 한국어로 작성
- 마크다운 없이 순수 JSON만 출력`;
}

/**
 * 금주 주간 식단 추천 프롬프트 생성
 */
function buildGenerateMealPlanPrompt(
  userProfile: UserProfile,
  weekStartDate: string,
  weekEndDate: string,
  lastWeekSummary?: IntakeEvaluation,
  lastWeekIntake?: WeeklyIntake
): string {
  const { user, health_conditions } = userProfile;
  
  const healthInfo = health_conditions.map(c => c.condition_type).join(', ') || '없음';
  const allergies = health_conditions
    .filter(c => c.condition_type.startsWith('allergy_'))
    .map(c => c.condition_type.replace('allergy_', ''))
    .join(', ') || '없음';

  let lastWeekInfo = '';
  if (lastWeekSummary && lastWeekIntake) {
    const intakeText = Object.entries(lastWeekIntake)
      .map(([day, meals]) => {
        const dayNames: any = {
          sun: '일요일', mon: '월요일', tue: '화요일', wed: '수요일',
          thu: '목요일', fri: '금요일', sat: '토요일'
        };
        return `${dayNames[day]}: 아침(${meals.breakfast.map(m => m.name).join(', ')}), 점심(${meals.lunch.map(m => m.name).join(', ')}), 저녁(${meals.dinner.map(m => m.name).join(', ')})`;
      })
      .join('\n');

    lastWeekInfo = `
지난 주 평가:
- 영양소: 탄수화물 ${lastWeekSummary.macro.carbs_g}g, 단백질 ${lastWeekSummary.macro.protein_g}g, 지방 ${lastWeekSummary.macro.fat_g}g
- 잘된 점: ${lastWeekSummary.strengths.join(', ')}
- 아쉬운 점: ${lastWeekSummary.weaknesses.join(', ')}
- 개선 필요: ${lastWeekSummary.improvements.join(', ')}

지난 주 섭취 내역:
${intakeText}
`;
  }

  return `당신은 전문 영양사입니다. 사용자를 위한 맞춤형 주간 식단을 생성하세요.

사용자 프로필:
- 성별: ${user.gender === 'male' ? '남성' : user.gender === 'female' ? '여성' : '기타'}
- 나이: ${user.age}세
- 식단 목적: ${user.diet_goal === 'weight_gain' ? '체중 증가' : user.diet_goal === 'weight_loss' ? '체중 감량' : '현상 유지'}
- 식단 특성: ${user.diet_characteristics.join(', ') || '없음'}
- 건강 상태: ${healthInfo}
- 알러지: ${allergies}
${lastWeekInfo}
금주 기간:
- 시작일: ${weekStartDate}
- 종료일: ${weekEndDate}

다음 JSON 형식으로만 응답하세요. 마크다운 형식이나 추가 텍스트 없이 순수 JSON만 출력하세요:

{
  "week": {
    "start_date": "${weekStartDate}",
    "end_date": "${weekEndDate}"
  },
  "plan": {
    "sun": {
      "breakfast": ["<음식1>", "<음식2>", "<음식3>"],
      "lunch": ["<음식1>", "<음식2>", "<음식3>"],
      "dinner": ["<음식1>", "<음식2>", "<음식3>"]
    },
    "mon": {
      "breakfast": ["<음식1>", "<음식2>", "<음식3>"],
      "lunch": ["<음식1>", "<음식2>", "<음식3>"],
      "dinner": ["<음식1>", "<음식2>", "<음식3>"]
    },
    "tue": {
      "breakfast": ["<음식1>", "<음식2>", "<음식3>"],
      "lunch": ["<음식1>", "<음식2>", "<음식3>"],
      "dinner": ["<음식1>", "<음식2>", "<음식3>"]
    },
    "wed": {
      "breakfast": ["<음식1>", "<음식2>", "<음식3>"],
      "lunch": ["<음식1>", "<음식2>", "<음식3>"],
      "dinner": ["<음식1>", "<음식2>", "<음식3>"]
    },
    "thu": {
      "breakfast": ["<음식1>", "<음식2>", "<음식3>"],
      "lunch": ["<음식1>", "<음식2>", "<음식3>"],
      "dinner": ["<음식1>", "<음식2>", "<음식3>"]
    },
    "fri": {
      "breakfast": ["<음식1>", "<음식2>", "<음식3>"],
      "lunch": ["<음식1>", "<음식2>", "<음식3>"],
      "dinner": ["<음식1>", "<음식2>", "<음식3>"]
    },
    "sat": {
      "breakfast": ["<음식1>", "<음식2>", "<음식3>"],
      "lunch": ["<음식1>", "<음식2>", "<음식3>"],
      "dinner": ["<음식1>", "<음식2>", "<음식3>"]
    }
  },
  "plan_macro": {
    "calories": <일주일(7일) 전체 칼로리 합계(kcal)>,
    "carbs_g": <일주일(7일) 전체 탄수화물 합계(g)>,
    "protein_g": <일주일(7일) 전체 단백질 합계(g)>,
    "fat_g": <일주일(7일) 전체 지방 합계(g)>,
    "ratio": {
      "carbs_pct": <탄수화물 비율(%)>,
      "protein_pct": <단백질 비율(%)>,
      "fat_pct": <지방 비율(%)>
    }
  },
  "rationale": {
    "considered": [
      "<고려사항 1: 성별/나이>",
      "<고려사항 2: 식단 목적>",
      "<고려사항 3: 식단 특성>",
      "<고려사항 4: 건강 상태>",
      "<고려사항 5: 지난주 반영 여부>"
    ],
    "notes": [
      "<전체 전략 설명>",
      "<중점 분야>",
      "<사용자 니즈 반영 방식>"
    ]
  },
  "shopping_list": [
    "<재료1>",
    "<재료2>",
    "<재료3>"
  ],
  "substitutions": [
    {
      "avoid": ["<피해야 할 음식>"],
      "replace_with": ["<대체 음식1>", "<대체 음식2>"]
    }
  ]
}

요구사항:
- 각 끼니는 2~4가지 음식으로 구성
- 모든 음식은 한국에서 구하기 쉬운 일반적인 음식
- 알러지 음식 절대 포함 금지
- 식단 특성 준수 (예: 비건, 베지테리언)
- 식단 목적에 맞게 최적화
- 지난주 데이터가 있으면 약점 보완 및 강점 강화
- **중요: plan_macro는 일주일(일~토, 7일) 전체 영양소의 총합입니다. 아침/점심/저녁 총 21끼의 영양소를 모두 합산하여 계산하세요.**
- 일주일치 영양소 총합 예시: 칼로리 14000~17500kcal, 탄수화물 2000~2500g, 단백질 500~700g, 지방 400~600g 수준
- 칼로리 계산: 탄수화물(4kcal/g) + 단백질(4kcal/g) + 지방(9kcal/g)
- 모든 텍스트는 한국어로 작성
- 마크다운 없이 순수 JSON만 출력`;
}

/**
 * 지난주 섭취 기록 평가
 */
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
      throw new Error('OpenAI 응답이 비어있습니다.');
    }

    const result = JSON.parse(content);
    return result;
  } catch (error: any) {
    console.error('섭취 기록 평가 에러:', error);
    throw new Error('AI 평가 생성 중 오류가 발생했습니다.');
  }
}

/**
 * 주간 식단 생성
 */
export async function generateMealPlan(
  userProfile: UserProfile,
  weekStartDate: string,
  weekEndDate: string,
  lastWeekSummary?: IntakeEvaluation,
  lastWeekIntake?: WeeklyIntake
): Promise<{
  plan: WeeklyIntake;
  plan_macro: Macro;
  rationale: { considered: string[]; notes: string[] };
  shopping_list: string[];
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
      throw new Error('OpenAI 응답이 비어있습니다.');
    }

    const result = JSON.parse(content);
    
    return {
      plan: result.plan,
      plan_macro: result.plan_macro,
      rationale: result.rationale,
      shopping_list: result.shopping_list,
      substitutions: result.substitutions
    };
  } catch (error: any) {
    console.error('식단 생성 에러:', error);
    throw new Error('AI 식단 생성 중 오류가 발생했습니다.');
  }
}
