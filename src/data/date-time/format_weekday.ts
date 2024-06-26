import { FrontendTranslationData } from 'custom-card-helpers';

export const monthArray = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
export const weekdayArray = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const supportLocaleString = () => {
    try {
        new Date().toLocaleDateString('i');
    } catch (e) {
        return e.name === 'RangeError';
    }
    return false;
};

export const formatMonth = (date: Date | number, locale: FrontendTranslationData, short?: boolean): string => {
    if (typeof date !== 'object') {
        const _date = new Date(2017, 0, 26);
        _date.setMonth(_date.getMonth() + date);
        date = _date;
    }

    if (supportLocaleString()) {
        return date.toLocaleDateString(locale.language, {
            month: short ? 'short' : 'long',
        });
    } else {
        const month = date.getMonth();
        return short ? monthArray[month].substr(0, 3) : monthArray[month];
    }
};

export const formatWeekday = (date: Date | number, locale: FrontendTranslationData, short?: boolean): string => {


    if (typeof date !== 'object') {
        const _date = new Date(2017, 1, 26);
        _date.setDate(_date.getDate() + date);
        date = _date;
    }

    if (supportLocaleString()) {
        return date.toLocaleDateString(locale.language, {
            weekday: short ? 'short' : 'long',
        });
    } else {
        const weekday = date.getDay();
        return short ? weekdayArray[weekday].substr(0, 3) : weekdayArray[weekday];
    }
};

