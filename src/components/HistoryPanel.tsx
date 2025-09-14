import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { useHistory } from "@/contexts/HistoryContext";
import { Button } from "./ui/button";

interface HistoryPanelProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HistoryPanel({ isOpen, onOpenChange }: HistoryPanelProps) {
  const { history, clearHistory } = useHistory();

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Lịch Sử Tính Toán</SheetTitle>
          <SheetDescription>
            Hiển thị 20 kết quả tính toán gần nhất của bạn.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-grow overflow-y-auto pr-4 -mr-4">
          {history.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Chưa có lịch sử nào.
            </div>
          ) : (
            <ul className="space-y-4">
              {history.map((item) => (
                <li key={item.id} className="text-sm border-b pb-2">
                  <p className="font-semibold text-primary">{item.type}</p>
                  <p className="whitespace-pre-wrap text-muted-foreground">{item.result}</p>
                  <p className="text-xs text-right text-muted-foreground/50">{item.timestamp}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
        <SheetFooter className="mt-4">
          <Button variant="destructive" onClick={clearHistory} disabled={history.length === 0}>
            Xóa Lịch Sử
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}