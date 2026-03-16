import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { Holiday } from "@/lib/vn-holidays";
import { convertSolar2Lunar } from "@/lib/lunar-converter";
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

  const [lunarDay, lunarMonth, , isLeap, dayCan, dayChi, monthCan, yearCan, yearChi] =
    convertSolar2Lunar(selectedDay.getDate(), selectedDay.getMonth() + 1, selectedDay.getFullYear());

  const holidayInfo = holidaysInYear.find(h => format(h.date, 'yyyy-MM-dd') === format(selectedDay, 'yyyy-MM-dd'));

  const handleUseDate = () => {
    const dateString = format(selectedDay, "dd/MM/yyyy");
    navigate(`/tools?date=${encodeURIComponent(dateString)}`);
  };

  return (
    <Dialog open={!!selectedDay} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[425px] border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif">
            {format(selectedDay, "dd/MM/yyyy")}
          </DialogTitle>
          <DialogDescription className="font-serif italic">
            {format(selectedDay, "eeee", { locale: vi })}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="text-center p-4 rounded-lg bg-primary/5 border border-primary/10">
            <p className="font-bold text-xl text-primary font-serif">
              Ngày {lunarDay} tháng {lunarMonth} {isLeap ? "(nhuận)" : ""}
            </p>
            <p className="font-serif text-foreground/80">Năm {yearCan} {yearChi}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Ngày {dayCan} {dayChi} · Tháng {monthCan}
            </p>
          </div>
          {holidayInfo && (
            <div className="text-center p-2.5 bg-destructive/10 text-destructive rounded-md border border-destructive/20 flex items-center justify-center gap-2">
              <Star className="h-4 w-4" />
              <span className="font-medium">{holidayInfo.name}</span>
            </div>
          )}
          <div className="p-3 rounded-lg bg-accent/50 border border-primary/5">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-primary" />
              <span className="font-semibold font-serif text-sm">Giờ Hoàng Đạo</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{getZodiacHours(dayChi)}</p>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleUseDate} className="bg-primary hover:bg-primary/90">Sử dụng ngày này</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}