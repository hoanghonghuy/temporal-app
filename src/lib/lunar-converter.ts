import { LUNAR_INFO } from "./lunar-data";
const CAN_NAMES = ["Canh", "Tân", "Nhâm", "Quý", "Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ"];
const CHI_NAMES = ["Thân", "Dậu", "Tuất", "Hợi", "Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi"];

export const MIN_SUPPORTED_LUNAR_YEAR = 1900;
export const MAX_SUPPORTED_LUNAR_YEAR = 2100;
export const MIN_SUPPORTED_SOLAR_DATE = new Date(1900, 0, 31);
export const MAX_SUPPORTED_SOLAR_DATE = new Date(2100, 11, 31);

export function isSupportedLunarYear(year: number) {
    return year >= MIN_SUPPORTED_LUNAR_YEAR && year <= MAX_SUPPORTED_LUNAR_YEAR;
}

export function getLunarMonthDays(y: number, m: number) { return ((LUNAR_INFO[y - 1900] & (0x10000 >> m)) ? 30 : 29); }
function getLeapMonth(y: number) { return (LUNAR_INFO[y - 1900] & 0xf); }
function getLeapMonthDays(y: number) { return getLeapMonth(y) ? ((LUNAR_INFO[y - 1900] & 0x10000) ? 30 : 29) : 0; }
function getLunarYearDays(y: number) {
    let i, sum = 348;
    for (i = 0x8000; i > 0x8; i >>= 1) sum += (LUNAR_INFO[y - 1900] & i) ? 1 : 0;
    return (sum + getLeapMonthDays(y));
}
function jdn(dd: number, mm: number, yy: number) {
    const a = Math.floor((14 - mm) / 12);
    const y = yy + 4800 - a;
    const m = mm + 12 * a - 3;
    return dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

export type LunarDateInfo = [number, number, number, boolean, string, string, string, string, string];

export function convertSolar2Lunar(dd: number, mm: number, yy: number): LunarDateInfo | null {
    if (!isSupportedLunarYear(yy)) return null;

    const date = new Date(Date.UTC(yy, mm - 1, dd));
    const date1900 = new Date(Date.UTC(1900, 0, 31));
    let offset = (date.getTime() - date1900.getTime()) / 86400000;
    let lunarYear, daysInYear = 0;
    for (lunarYear = 1900; lunarYear < 2101 && offset >= 0; lunarYear++) {
        daysInYear = getLunarYearDays(lunarYear);
        offset -= daysInYear;
    }
    if (offset < 0) {
        offset += daysInYear;
        lunarYear--;
    }
    if (!isSupportedLunarYear(lunarYear)) return null;

    const leapMonth = getLeapMonth(lunarYear);
    let isLeap = false;
    let lunarMonth: number;
    for (lunarMonth = 1; lunarMonth <= 12; lunarMonth++) {
        let daysInMonth;
        if (leapMonth > 0 && lunarMonth === (leapMonth + 1) && !isLeap) {
            daysInMonth = getLeapMonthDays(lunarYear);
            if (offset < daysInMonth) { isLeap = true; break; }
            offset -= daysInMonth;
        }
        daysInMonth = getLunarMonthDays(lunarYear, lunarMonth);
        if (offset < daysInMonth) { isLeap = false; break; }
        offset -= daysInMonth;
    }
    const lunarDay = offset + 1;
    const jd = jdn(dd, mm, yy);
    const dayCan = CAN_NAMES[jd % 10];
    const dayChi = CHI_NAMES[jd % 12];
    const monthCan = CAN_NAMES[((lunarYear - 1900) * 12 + lunarMonth + 11) % 10];
    const yearCan = CAN_NAMES[(lunarYear - 4) % 10];
    const yearChi = CHI_NAMES[(lunarYear - 4) % 12];
    return [lunarDay, lunarMonth, lunarYear, isLeap, dayCan, dayChi, monthCan, yearCan, yearChi];
}

export function convertLunar2Solar(ld: number, lm: number, ly: number, isLeap: boolean): Date | null {
    if (!isSupportedLunarYear(ly)) return null;
    
    const leapMonth = getLeapMonth(ly);
    if (isLeap && (!leapMonth || lm !== leapMonth)) return null;

    let offset = 0;
    // Cộng dồn số ngày của tất cả các năm TRƯỚC năm cần tính
    for (let i = 1900; i < ly; i++) {
        offset += getLunarYearDays(i);
    }

    // Cộng dồn số ngày của các tháng TRƯỚC tháng cần tính (trong cùng năm)
    for (let m = 1; m < lm; m++) {
        offset += getLunarMonthDays(ly, m);
        // Nếu có tháng nhuận xen vào trước tháng cần tính, cộng cả số ngày của tháng nhuận
        if (leapMonth && m === leapMonth) {
            offset += getLeapMonthDays(ly);
        }
    }

    // Nếu chính tháng cần tính là tháng nhuận, ta cần cộng thêm số ngày của tháng thường tương ứng
    if (isLeap) {
        offset += getLunarMonthDays(ly, lm);
    }

    // Cuối cùng, cộng số ngày trong tháng cần tính
    offset += ld - 1;

    // Ngày gốc là 31/01/1900 Dương lịch (tức mùng 1 Tết năm Canh Tý)
    const baseDate = new Date(Date.UTC(1900, 0, 31));
    const resultDateInUTC = new Date(baseDate.getTime() + offset * 86400000);
    
    // Chuyển đổi từ UTC về ngày cục bộ để tránh sai lệch múi giờ
    return new Date(resultDateInUTC.getUTCFullYear(), resultDateInUTC.getUTCMonth(), resultDateInUTC.getUTCDate());
}