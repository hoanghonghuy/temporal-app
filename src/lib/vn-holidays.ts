import { format } from "date-fns";
import { convertLunar2Solar, getLunarMonthDays, isSupportedLunarYear } from "./lunar-converter";

export type HolidayCategory = "public" | "traditional" | "folk_festival" | "observance";

export interface Holiday {
  name: string;
  date: Date;
  category: HolidayCategory;
  isDayOff: boolean;
}

interface SolarHolidayDefinition {
  name: string;
  month: number;
  day: number;
  category: HolidayCategory;
  isDayOff?: boolean;
}

interface LunarHolidayDefinition {
  name: string;
  lunarMonth: number;
  lunarDay: number;
  category: HolidayCategory;
  isDayOff?: boolean;
}

const SOLAR_HOLIDAY_DEFINITIONS: SolarHolidayDefinition[] = [
  { name: "Tết Dương lịch", month: 1, day: 1, category: "public", isDayOff: true },
  { name: "Valentine (Lễ tình nhân)", month: 2, day: 14, category: "observance" },
  { name: "Ngày Thầy thuốc Việt Nam", month: 2, day: 27, category: "observance" },
  { name: "Quốc tế Phụ nữ", month: 3, day: 8, category: "observance" },
  { name: "Ngày thành lập Đoàn TNCS Hồ Chí Minh", month: 3, day: 26, category: "observance" },
  { name: "Ngày Giải phóng miền Nam, thống nhất đất nước", month: 4, day: 30, category: "public", isDayOff: true },
  { name: "Ngày Quốc tế Lao động", month: 5, day: 1, category: "public", isDayOff: true },
  { name: "Ngày sinh Chủ tịch Hồ Chí Minh", month: 5, day: 19, category: "observance" },
  { name: "Quốc tế Thiếu nhi", month: 6, day: 1, category: "observance" },
  { name: "Ngày Báo chí Cách mạng Việt Nam", month: 6, day: 21, category: "observance" },
  { name: "Ngày Gia đình Việt Nam", month: 6, day: 28, category: "observance" },
  { name: "Ngày Thương binh - Liệt sĩ", month: 7, day: 27, category: "observance" },
  { name: "Ngày Cách mạng Tháng Tám thành công", month: 8, day: 19, category: "observance" },
  { name: "Quốc khánh Việt Nam", month: 9, day: 2, category: "public", isDayOff: true },
  { name: "Ngày Doanh nhân Việt Nam", month: 10, day: 13, category: "observance" },
  { name: "Ngày Phụ nữ Việt Nam", month: 10, day: 20, category: "observance" },
  { name: "Ngày Nhà giáo Việt Nam", month: 11, day: 20, category: "observance" },
  { name: "Ngày thành lập Quân đội Nhân dân Việt Nam", month: 12, day: 22, category: "observance" },
  { name: "Đêm Giáng Sinh", month: 12, day: 24, category: "observance" },
  { name: "Lễ Giáng Sinh", month: 12, day: 25, category: "observance" },
];

const LUNAR_HOLIDAY_DEFINITIONS: LunarHolidayDefinition[] = [
  { name: "Khai hội chùa Hương (mùng 6 tháng Giêng)", lunarMonth: 1, lunarDay: 6, category: "folk_festival" },
  { name: "Khai hội Yên Tử (mùng 10 tháng Giêng)", lunarMonth: 1, lunarDay: 10, category: "folk_festival" },
  { name: "Hội Lim (13 tháng Giêng)", lunarMonth: 1, lunarDay: 13, category: "folk_festival" },
  { name: "Khai ấn Đền Trần (14 tháng Giêng)", lunarMonth: 1, lunarDay: 14, category: "folk_festival" },
  { name: "Rằm tháng Giêng (Tết Nguyên Tiêu)", lunarMonth: 1, lunarDay: 15, category: "traditional" },
  { name: "Tết Hàn Thực (3/3)", lunarMonth: 3, lunarDay: 3, category: "traditional" },
  { name: "Giỗ Tổ Hùng Vương (10/3)", lunarMonth: 3, lunarDay: 10, category: "public", isDayOff: true },
  { name: "Hội Gióng Phù Đổng (mùng 9 tháng 4)", lunarMonth: 4, lunarDay: 9, category: "folk_festival" },
  { name: "Lễ Phật Đản (15/4)", lunarMonth: 4, lunarDay: 15, category: "traditional" },
  { name: "Lễ vía Bà Chúa Xứ Núi Sam (24/4)", lunarMonth: 4, lunarDay: 24, category: "folk_festival" },
  { name: "Tết Đoan Ngọ (5/5)", lunarMonth: 5, lunarDay: 5, category: "traditional" },
  { name: "Lễ Thất Tịch (7/7)", lunarMonth: 7, lunarDay: 7, category: "traditional" },
  { name: "Lễ Vu Lan (15/7)", lunarMonth: 7, lunarDay: 15, category: "traditional" },
  { name: "Tết Trung Nguyên / Xá tội vong nhân (15/7)", lunarMonth: 7, lunarDay: 15, category: "traditional" },
  { name: "Tết Trung Thu (15/8)", lunarMonth: 8, lunarDay: 15, category: "traditional" },
  { name: "Ông Công Ông Táo chầu trời (23/12)", lunarMonth: 12, lunarDay: 23, category: "traditional" },
];

const HOLIDAY_CATEGORY_LABELS: Record<HolidayCategory, string> = {
  public: "Ngày nghỉ - lễ chính",
  traditional: "Lễ truyền thống",
  folk_festival: "Lễ hội dân gian",
  observance: "Ngày kỷ niệm",
};

function createHoliday(
  name: string,
  date: Date,
  category: HolidayCategory,
  isDayOff = false
): Holiday {
  return { name, date, category, isDayOff };
}

function pushHolidayIfValid(
  holidays: Holiday[],
  name: string,
  date: Date | null,
  category: HolidayCategory,
  isDayOff = false
) {
  if (date) {
    holidays.push(createHoliday(name, date, category, isDayOff));
  }
}

function getTetHolidays(lunarNewYear: number): Holiday[] {
  const tetHolidays: Holiday[] = [];
  if (!isSupportedLunarYear(lunarNewYear)) {
    return tetHolidays;
  }

  const lunarOldYear = lunarNewYear - 1;
  const lastDayOfOldYear = isSupportedLunarYear(lunarOldYear) ? getLunarMonthDays(lunarOldYear, 12) : null;
  const giaoThua = lastDayOfOldYear ? convertLunar2Solar(lastDayOfOldYear, 12, lunarOldYear, false) : null;

  pushHolidayIfValid(tetHolidays, "Giao Thừa", giaoThua, "traditional");

  const mung1Tet = convertLunar2Solar(1, 1, lunarNewYear, false);
  if (!mung1Tet) {
    return tetHolidays;
  }

  for (let day = 1; day <= 5; day += 1) {
    const tetDate = new Date(mung1Tet.getTime() + (day - 1) * 86400000);
    tetHolidays.push(createHoliday(`Mùng ${day} Tết`, tetDate, "traditional", true));
  }

  return tetHolidays;
}

function getSolarHolidays(solarYear: number): Holiday[] {
  return SOLAR_HOLIDAY_DEFINITIONS.map((holiday) =>
    createHoliday(
      holiday.name,
      new Date(solarYear, holiday.month - 1, holiday.day),
      holiday.category,
      holiday.isDayOff ?? false
    )
  );
}

function getLunarHolidays(solarYear: number): Holiday[] {
  const holidays: Holiday[] = [];
  const candidateLunarYears = [solarYear - 1, solarYear, solarYear + 1];

  for (const lunarYear of candidateLunarYears) {
    if (!isSupportedLunarYear(lunarYear)) {
      continue;
    }

    holidays.push(...getTetHolidays(lunarYear));

    for (const holiday of LUNAR_HOLIDAY_DEFINITIONS) {
      const date = convertLunar2Solar(holiday.lunarDay, holiday.lunarMonth, lunarYear, false);
      pushHolidayIfValid(holidays, holiday.name, date, holiday.category, holiday.isDayOff ?? false);
    }
  }

  return holidays.filter((holiday) => holiday.date.getFullYear() === solarYear);
}

export function getHolidayCategoryLabel(category: HolidayCategory): string {
  return HOLIDAY_CATEGORY_LABELS[category];
}

export function getVnHolidays(solarYear: number): Holiday[] {
  const holidays = [...getSolarHolidays(solarYear)];

  if (!isSupportedLunarYear(solarYear)) {
    return dedupeHolidays(holidays);
  }

  holidays.push(...getLunarHolidays(solarYear));
  return dedupeHolidays(holidays);
}

function dedupeHolidays(holidays: Holiday[]) {
  const uniqueHolidays = new Map<string, Holiday>();

  holidays
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .forEach((holiday) => {
      const key = `${format(holiday.date, "yyyy-MM-dd")}::${holiday.name}`;
      if (!uniqueHolidays.has(key)) {
        uniqueHolidays.set(key, holiday);
      }
    });

  return Array.from(uniqueHolidays.values());
}
