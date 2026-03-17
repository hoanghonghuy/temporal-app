import { Suspense, lazy, useEffect } from "react"; // Import useEffect
import { useSearchParams, useLocation } from "react-router-dom"; // Import useLocation

const DateConverter = lazy(async () => {
  const module = await import("@/components/tools/DateConverter");
  return { default: module.DateConverter };
});
const DateDifferenceCalculator = lazy(async () => {
  const module = await import("@/components/tools/DateDifferenceCalculator");
  return { default: module.DateDifferenceCalculator };
});
const DateCalculator = lazy(async () => {
  const module = await import("@/components/tools/DateCalculator");
  return { default: module.DateCalculator };
});
const AgeCalculator = lazy(async () => {
  const module = await import("@/components/tools/AgeCalculator");
  return { default: module.AgeCalculator };
});
const EventCountdown = lazy(async () => {
  const module = await import("@/components/tools/EventCountdown");
  return { default: module.EventCountdown };
});
const WorkingDaysCalculator = lazy(async () => {
  const module = await import("@/components/tools/WorkingDaysCalculator");
  return { default: module.WorkingDaysCalculator };
});
const LeapYearChecker = lazy(async () => {
  const module = await import("@/components/tools/LeapYearChecker");
  return { default: module.LeapYearChecker };
});
const DayOfWeekFinder = lazy(async () => {
  const module = await import("@/components/tools/DayOfWeekFinder");
  return { default: module.DayOfWeekFinder };
});

function ToolFallback() {
  return (
    <div className="rounded-lg border border-primary/10 bg-card/80 p-6 text-center text-sm text-muted-foreground gold-glow flex flex-col items-center gap-3">
      <div className="inline-flex">
        <div className="h-5 w-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
      <span className="font-serif">Đang tải pháp khí...</span>
    </div>
  );
}

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 scroll-mt-20">
      <Suspense fallback={<ToolFallback />}>
        <DateConverter id="date-converter" key={dateFromUrl} initialDate={dateFromUrl} />
      </Suspense>
      <Suspense fallback={<ToolFallback />}>
        <DateDifferenceCalculator id="date-difference" />
      </Suspense>
      <Suspense fallback={<ToolFallback />}>
        <DateCalculator id="date-calculator" />
      </Suspense>
      <Suspense fallback={<ToolFallback />}>
        <AgeCalculator id="age-calculator" />
      </Suspense>
      <Suspense fallback={<ToolFallback />}>
        <EventCountdown id="event-countdown" />
      </Suspense>
      <Suspense fallback={<ToolFallback />}>
        <WorkingDaysCalculator id="working-days-calculator" />
      </Suspense>
      <Suspense fallback={<ToolFallback />}>
        <LeapYearChecker id="leap-year" />
      </Suspense>
      <Suspense fallback={<ToolFallback />}>
        <DayOfWeekFinder id="day-of-week-finder" />
      </Suspense>
    </div>
  );
}

