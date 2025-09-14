import { useEffect } from "react"; // Import useEffect
import { useSearchParams, useLocation } from "react-router-dom"; // Import useLocation
import { AgeCalculator } from "@/components/tools/AgeCalculator";
import { DateCalculator } from "@/components/tools/DateCalculator";
import { DateConverter } from "@/components/tools/DateConverter";
import { DateDifferenceCalculator } from "@/components/tools/DateDifferenceCalculator";
import { DayOfWeekFinder } from "@/components/tools/DayOfWeekFinder";
import { EventCountdown } from "@/components/tools/EventCountdown";
import { LeapYearChecker } from "@/components/tools/LeapYearChecker";
import { WorkingDaysCalculator } from "@/components/tools/WorkingDaysCalculator";

export function ToolsPage() {
  const [searchParams] = useSearchParams();
  const dateFromUrl = searchParams.get('date');
  const location = useLocation(); // Lấy thông tin về URL hiện tại

  // Effect để xử lý việc cuộn trang
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.substring(1);
      const element = document.getElementById(id);
      if (element) {
        // Cuộn đến element đó một cách mượt mà
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [location]); // Chạy lại mỗi khi URL thay đổi

  return (
    // Thêm class 'scroll-mt-20' để khi nhảy link, tiêu đề card không bị header che mất
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 scroll-mt-20">
      <DateConverter id="date-converter" key={dateFromUrl} initialDate={dateFromUrl} />
      <DateDifferenceCalculator id="date-difference" />
      <DateCalculator id="date-calculator" />
      <AgeCalculator id="age-calculator" />
      <EventCountdown id="event-countdown" />
      <WorkingDaysCalculator id="working-days-calculator" />
      <LeapYearChecker id="leap-year" />
      <DayOfWeekFinder id="day-of-week-finder" />
    </div>
  );
}

