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
import { ScrollText } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface HistoryPanelProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HistoryPanel({ isOpen, onOpenChange }: HistoryPanelProps) {
  const { history, clearHistory } = useHistory();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleConfirmDelete = () => {
    clearHistory();
    setShowDeleteConfirm(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col border-l-primary/15">
        <SheetHeader>
          <SheetTitle className="font-serif flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-primary" />
            Sử Ký Tính Toán
          </SheetTitle>
          <SheetDescription>
            Hiển thị 20 kết quả gần nhất.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-grow overflow-y-auto pr-4 -mr-4">
          {history.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground italic font-serif">
              Chưa lưu ký nào.
            </div>
          ) : (
            <ul className="space-y-4">
              {history.map((item) => (
                <li key={item.id} className="text-sm border-b border-primary/10 pb-3">
                  <p className="font-semibold text-primary font-serif">{item.type}</p>
                  <p className="whitespace-pre-wrap text-muted-foreground mt-1">{item.result}</p>
                  <p className="text-xs text-right text-muted-foreground/50 mt-1">{item.timestamp}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
        <SheetFooter className="mt-4">
          <Button 
            variant="destructive" 
            onClick={() => setShowDeleteConfirm(true)} 
            disabled={history.length === 0}
          >
            Xóa Sử Ký
          </Button>
        </SheetFooter>
      </SheetContent>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">Xóa tất cả lịch sử?</AlertDialogTitle>
            <AlertDialogDescription className="font-serif">
              Hành động này không thể hoàn tác. Tất cả {history.length} mục lịch sử sẽ bị xóa vĩnh viễn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-serif">Hủy</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-destructive hover:bg-destructive/90 font-serif"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
}