import { WeekdayType, EDayType, MonthType, EMonthType, MonthDaysType, EMonthDaysType } from '../../types';

export function monthType(month: MonthType) {
    if (month.includes('monthly')) return EMonthType.Monthly;
    return EMonthType.Custom;
}

export function monthdaysType(monthdays: MonthDaysType) {
    if (monthdays.includes('all')) return EMonthDaysType.All;
    return EMonthDaysType.Custom;
}
export function weekdayType(weekday: WeekdayType) {
    if (weekday.includes('daily')) return EDayType.Daily;
    if (weekday.includes('workday')) return EDayType.Workday;
    if (weekday.includes('weekend')) return EDayType.Weekend;
    return EDayType.Custom;
}
