import { convertLunar2Solar, getLunarMonthDays } from './lunar-converter';

export interface Holiday {
    name: string;
    date: Date;
}

// Tính Giao thừa dựa trên ngày cuối cùng của tháng 12 Âm lịch năm cũ
function _getTetHolidays(lunarNewYear: number): Holiday[] {
    const tetHolidays: Holiday[] = [];
    
    const lunarOldYear = lunarNewYear - 1;
    const lastDayOfOldYear = getLunarMonthDays(lunarOldYear, 12);
    const giaoThua = convertLunar2Solar(lastDayOfOldYear, 12, lunarOldYear, false);
    
    if (giaoThua) {
        tetHolidays.push({ name: `Giao Thừa`, date: giaoThua });
    }

    const tetMung1 = convertLunar2Solar(1, 1, lunarNewYear, false);
    if (!tetMung1) return tetHolidays;
    
    for(let i = 1; i <= 5; i++) {
        const tetDay = new Date(tetMung1.getTime() + (i - 1) * 86400000);
        tetHolidays.push({ name: `Mùng ${i} Tết`, date: tetDay });
    }
    
    return tetHolidays;
}


export function getVnHolidays(solarYear: number): Holiday[] {
    let holidays: Holiday[] = [];
    
    const tetHolidaysForCurrentSolarYear = _getTetHolidays(solarYear); 
    const tetHolidaysForNextSolarYear = _getTetHolidays(solarYear + 1);
    
    const gioTo1 = convertLunar2Solar(10, 3, solarYear, false);
    const gioTo2 = convertLunar2Solar(10, 3, solarYear + 1, false);

    const allLunarHolidays = [...tetHolidaysForCurrentSolarYear, ...tetHolidaysForNextSolarYear];
    if (gioTo1) allLunarHolidays.push({ name: `Giỗ Tổ Hùng Vương (10/3)`, date: gioTo1 });
    if (gioTo2) allLunarHolidays.push({ name: `Giỗ Tổ Hùng Vương (10/3)`, date: gioTo2 });

    allLunarHolidays.forEach(holiday => {
        if (holiday.date.getFullYear() === solarYear) {
            holidays.push(holiday);
        }
    });

    holidays.push({ name: `Tết Dương Lịch`, date: new Date(solarYear, 0, 1) });
    holidays.push({ name: `Ngày Giải phóng Miền Nam`, date: new Date(solarYear, 3, 30) });
    holidays.push({ name: `Ngày Quốc tế Lao động`, date: new Date(solarYear, 4, 1) });
    holidays.push({ name: `Ngày Quốc Khánh`, date: new Date(solarYear, 8, 2) });
    holidays.push({ name: `Nghỉ lễ Quốc Khánh`, date: new Date(solarYear, 8, 1) });
    
    const uniqueHolidays = new Map<string, Holiday>();
    holidays.sort((a, b) => a.date.getTime() - b.date.getTime()).forEach(h => {
        const key = h.date.toISOString().split('T')[0];
        if (!uniqueHolidays.has(key)) {
            uniqueHolidays.set(key, h);
        }
    });

    return Array.from(uniqueHolidays.values());
}