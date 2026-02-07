import { startOfWeek, endOfWeek, format } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
import { WeekBounds } from '../types/index.js';

const TIMEZONE = 'Asia/Seoul';

/**
 * 현재 주의 경계(일요일~토요일)를 반환
 */
export function getCurrentWeekBounds(date: Date = new Date()): WeekBounds {
  const zonedDate = utcToZonedTime(date, TIMEZONE);
  const weekStart = startOfWeek(zonedDate, { weekStartsOn: 0 }); // 0 = 일요일
  const weekEnd = endOfWeek(zonedDate, { weekStartsOn: 0 }); // 6 = 토요일
  
  return {
    year: weekStart.getFullYear(),
    weekStartDate: format(weekStart, 'yyyy-MM-dd'),
    weekEndDate: format(weekEnd, 'yyyy-MM-dd')
  };
}

/**
 * 지난 주의 경계(일요일~토요일)를 반환
 */
export function getLastWeekBounds(date: Date = new Date()): WeekBounds {
  const lastWeekDate = new Date(date);
  lastWeekDate.setDate(lastWeekDate.getDate() - 7);
  return getCurrentWeekBounds(lastWeekDate);
}

/**
 * 특정 날짜가 속한 주의 경계를 반환
 */
export function getWeekBoundsForDate(date: Date): WeekBounds {
  return getCurrentWeekBounds(date);
}

/**
 * 두 주가 같은지 비교
 */
export function isSameWeek(week1: WeekBounds, week2: WeekBounds): boolean {
  return week1.year === week2.year && 
         week1.weekStartDate === week2.weekStartDate;
}
