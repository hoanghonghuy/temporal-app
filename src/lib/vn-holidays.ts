import { convertLunar2Solar, getLunarMonthDays } from './lunar-converter';

export interface Holiday {
    name: string;
    date: Date;
}

function _getTetHolidays(lunarNewYear: number): Holiday[] {
    const tetHolidays: Holiday[] = [];
    
    // --- Tính Giao thừa ---
    const lunarOldYear = lunarNewYear - 1;
    const lastDayOfOldYear = getLunarMonthDays(lunarOldYear, 12);
    const giaoThua = convertLunar2Solar(lastDayOfOldYear, 12, lunarOldYear, false);
    
    if (giaoThua) {
        tetHolidays.push({ name: `Giao Thừa`, date: giaoThua });
    }

    // --- Tính các ngày Tết ---
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
    
    // ================== CÁC NGÀY LỄ ÂM LỊCH ==================
    // Các ngày lễ chính thức
    const tetHolidays1 = _getTetHolidays(solarYear); 
    const tetHolidays2 = _getTetHolidays(solarYear + 1);
    const gioTo1 = convertLunar2Solar(10, 3, solarYear, false);
    const gioTo2 = convertLunar2Solar(10, 3, solarYear + 1, false);

    // Các ngày lễ, kỷ niệm Âm lịch khác
    const ongTao1 = convertLunar2Solar(23, 12, solarYear - 1, false);
    const ongTao2 = convertLunar2Solar(23, 12, solarYear, false);
    const tetDoanNgo1 = convertLunar2Solar(5, 5, solarYear, false);
    const tetDoanNgo2 = convertLunar2Solar(5, 5, solarYear + 1, false);
    const leVuLan1 = convertLunar2Solar(15, 7, solarYear, false);
    const leVuLan2 = convertLunar2Solar(15, 7, solarYear + 1, false);
    const tetTrungThu1 = convertLunar2Solar(15, 8, solarYear, false);
    const tetTrungThu2 = convertLunar2Solar(15, 8, solarYear + 1, false);

    const allLunarHolidays = [...tetHolidays1, ...tetHolidays2];
    if (gioTo1) allLunarHolidays.push({ name: `Giỗ Tổ Hùng Vương (10/3)`, date: gioTo1 });
    if (gioTo2) allLunarHolidays.push({ name: `Giỗ Tổ Hùng Vương (10/3)`, date: gioTo2 });
    if (ongTao1) allLunarHolidays.push({ name: `Ông Táo về trời (23/12)`, date: ongTao1 });
    if (ongTao2) allLunarHolidays.push({ name: `Ông Táo về trời (23/12)`, date: ongTao2 });
    if (tetDoanNgo1) allLunarHolidays.push({ name: `Tết Đoan Ngọ (5/5)`, date: tetDoanNgo1 });
    if (tetDoanNgo2) allLunarHolidays.push({ name: `Tết Đoan Ngọ (5/5)`, date: tetDoanNgo2 });
    if (leVuLan1) allLunarHolidays.push({ name: `Lễ Vu Lan (15/7)`, date: leVuLan1 });
    if (leVuLan2) allLunarHolidays.push({ name: `Lễ Vu Lan (15/7)`, date: leVuLan2 });
    if (tetTrungThu1) allLunarHolidays.push({ name: `Tết Trung Thu (15/8)`, date: tetTrungThu1 });
    if (tetTrungThu2) allLunarHolidays.push({ name: `Tết Trung Thu (15/8)`, date: tetTrungThu2 });
    
    // Lọc các ngày lễ Âm lịch thuộc năm dương lịch đang xét
    allLunarHolidays.forEach(holiday => {
        if (holiday?.date.getFullYear() === solarYear) {
            holidays.push(holiday);
        }
    });

    // ================== CÁC NGÀY LỄ DƯƠNG LỊCH ==================
    // Các ngày lễ chính thức
    holidays.push({ name: `Tết Dương Lịch`, date: new Date(solarYear, 0, 1) });
    holidays.push({ name: `Ngày Giải phóng Miền Nam`, date: new Date(solarYear, 3, 30) });
    holidays.push({ name: `Ngày Quốc tế Lao động`, date: new Date(solarYear, 4, 1) });
    holidays.push({ name: `Ngày Quốc Khánh`, date: new Date(solarYear, 8, 2) });
    holidays.push({ name: `Nghỉ lễ Quốc Khánh`, date: new Date(solarYear, 8, 1) });
    
    // Các ngày lễ, kỷ niệm Dương lịch khác
    holidays.push({ name: `Valentine (Lễ tình nhân)`, date: new Date(solarYear, 1, 14) });
    holidays.push({ name: `Quốc tế Phụ nữ`, date: new Date(solarYear, 2, 8) });
    holidays.push({ name: `Ngày Phụ nữ Việt Nam`, date: new Date(solarYear, 9, 20) });
    holidays.push({ name: `Ngày Nhà giáo Việt Nam`, date: new Date(solarYear, 10, 20) });
    holidays.push({ name: `Lễ Giáng Sinh`, date: new Date(solarYear, 11, 25) });
    
    // Sắp xếp và loại bỏ các ngày trùng lặp (nếu có)
    const uniqueHolidays = new Map<string, Holiday>();
    holidays.sort((a, b) => a.date.getTime() - b.date.getTime()).forEach(h => {
        const key = h.date.toISOString().split('T')[0];
        if (!uniqueHolidays.has(key)) {
            uniqueHolidays.set(key, h);
        }
    });

    return Array.from(uniqueHolidays.values());
}