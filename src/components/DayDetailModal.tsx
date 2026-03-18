import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { getHolidayCategoryLabel, type Holiday } from "@/lib/vn-holidays";
import {
  convertSolar2Lunar,
  MAX_SUPPORTED_LUNAR_YEAR,
  MIN_SUPPORTED_LUNAR_YEAR,
} from "@/lib/lunar-converter";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { Clock, Star } from "lucide-react";

interface DayDetailModalProps {
  selectedDay: Date | null;
  onClose: () => void;
  holidaysInYear: Holiday[];
}

const getZodiacHours = (chiNgay: string): string => {
  const zodiacHoursMap: { [key: string]: string[] } = {
    Tý: ["Tý (23-1)", "Sửu (1-3)", "Mão (5-7)", "Ngọ (11-13)", "Thân (15-17)", "Dậu (17-19)"],
    Sửu: ["Dần (3-5)", "Mão (5-7)", "Tỵ (9-11)", "Thân (15-17)", "Tuất (19-21)", "Hợi (21-23)"],
    Dần: ["Tý (23-1)", "Sửu (1-3)", "Thìn (7-9)", "Tỵ (9-11)", "Mùi (13-15)", "Tuất (19-21)"],
    Mão: ["Tý (23-1)", "Dần (3-5)", "Mão (5-7)", "Ngọ (11-13)", "Mùi (13-15)", "Dậu (17-19)"],
    Thìn: ["Dần (3-5)", "Thìn (7-9)", "Tỵ (9-11)", "Thân (15-17)", "Dậu (17-19)", "Hợi (21-23)"],
    Tỵ: ["Sửu (1-3)", "Thìn (7-9)", "Ngọ (11-13)", "Mùi (13-15)", "Tuất (19-21)", "Hợi (21-23)"],
    Ngọ: ["Tý (23-1)", "Sửu (1-3)", "Mão (5-7)", "Ngọ (11-13)", "Thân (15-17)", "Dậu (17-19)"],
    Mùi: ["Dần (3-5)", "Mão (5-7)", "Tỵ (9-11)", "Thân (15-17)", "Tuất (19-21)", "Hợi (21-23)"],
    Thân: ["Tý (23-1)", "Sửu (1-3)", "Thìn (7-9)", "Tỵ (9-11)", "Mùi (13-15)", "Tuất (19-21)"],
    Dậu: ["Tý (23-1)", "Dần (3-5)", "Mão (5-7)", "Ngọ (11-13)", "Mùi (13-15)", "Dậu (17-19)"],
    Tuất: ["Dần (3-5)", "Thìn (7-9)", "Tỵ (9-11)", "Thân (15-17)", "Dậu (17-19)", "Hợi (21-23)"],
    Hợi: ["Sửu (1-3)", "Thìn (7-9)", "Ngọ (11-13)", "Mùi (13-15)", "Tuất (19-21)", "Hợi (21-23)"],
  };
  return (zodiacHoursMap[chiNgay] || []).join(", ");
};

export function DayDetailModal({ selectedDay, onClose, holidaysInYear }: DayDetailModalProps) {
  const navigate = useNavigate();

  if (!selectedDay) return null;

  const lunarInfo = convertSolar2Lunar(selectedDay.getDate(), selectedDay.getMonth() + 1, selectedDay.getFullYear());
  const holidayInfo = holidaysInYear
    .filter((holiday) => format(holiday.date, "yyyy-MM-dd") === format(selectedDay, "yyyy-MM-dd"))
    .sort((left, right) => left.name.localeCompare(right.name, "vi"));

  const handleUseDate = () => {
    const dateString = format(selectedDay, "dd/MM/yyyy");
    navigate(`/tools/date-converter?date=${encodeURIComponent(dateString)}`);
  };

  return (
    <Dialog
      open={!!selectedDay}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent
        variant="sheet"
        className="border-primary/20 lg:w-full lg:max-w-[425px]"
        onEscapeKeyDown={onClose}
      >
        <div className="flex max-h-[88dvh] flex-col overflow-hidden">
          <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-primary/15 lg:hidden" />

          <div className="themed-scrollbar overflow-y-auto px-4 pb-4 pt-3 lg:px-0 lg:pb-0 lg:pt-0">
            <DialogHeader className="pr-8 text-left">
              <DialogTitle className="text-2xl font-serif">{format(selectedDay, "dd/MM/yyyy")}</DialogTitle>
              <DialogDescription className="font-serif italic">
                {format(selectedDay, "eeee", { locale: vi })}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {!lunarInfo ? (
                <div className="rounded-lg border border-primary/10 bg-muted/50 p-4 text-center">
                  <p className="font-serif text-lg font-bold text-foreground">Ngoài phạm vi âm lịch hỗ trợ</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Temporal hiện hỗ trợ chuyển đổi Âm lịch trong giai đoạn {MIN_SUPPORTED_LUNAR_YEAR} - {MAX_SUPPORTED_LUNAR_YEAR}.
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border border-primary/10 bg-primary/5 p-4 text-center">
                  {(() => {
                    const [lunarDay, lunarMonth, , isLeap, dayCan, dayChi, monthCan, yearCan, yearChi] = lunarInfo;
                    const THANG_CHI = ["", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi", "Tý", "Sửu"];
                    return (
                      <>
                        <p className="mb-2 font-serif text-lg font-bold text-primary sm:text-xl">
                          Ngày {lunarDay} tháng {lunarMonth} {isLeap ? "(nhuận)" : ""} Âm Lịch
                        </p>
                        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-primary/10 pt-3 text-sm">
                          <div>
                            <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">Năm</p>
                            <p className="font-serif font-medium">{yearCan} {yearChi}</p>
                          </div>
                          <div>
                            <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">Tháng</p>
                            <p className="font-serif font-medium">{monthCan} {THANG_CHI[lunarMonth]}</p>
                          </div>
                          <div>
                            <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">Ngày</p>
                            <p className="font-serif font-medium">{dayCan} {dayChi}</p>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {holidayInfo.length > 0 && (
                <div className="grid gap-2">
                  {holidayInfo.map((holiday) => (
                    <article
                      key={`${holiday.name}-${holiday.date.toISOString()}`}
                      className="rounded-xl border border-primary/12 bg-background/70 px-3 py-2 shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Star className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium leading-5 text-foreground">{holiday.name}</p>
                          <div className="mt-1 flex flex-wrap gap-2">
                            <span className="rounded-full border border-primary/15 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                              {getHolidayCategoryLabel(holiday.category)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {lunarInfo && (
                <div className="rounded-lg border border-primary/5 bg-accent/50 p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="font-serif text-sm font-semibold">Giờ Hoàng Đạo</span>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{getZodiacHours(lunarInfo[5])}</p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="border-t border-primary/10 bg-background/95 px-4 pb-4 pt-3 backdrop-blur-sm lg:border-0 lg:bg-transparent lg:px-0 lg:pb-0 lg:pt-0">
            <Button onClick={handleUseDate} className="w-full bg-primary hover:bg-primary/90 lg:w-auto">
              Sử dụng ngày này
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
