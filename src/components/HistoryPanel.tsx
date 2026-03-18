import { useState } from "react";
import { ScrollText } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { Button } from "@/components/ui/button";
import { StatusPanel } from "@/components/ui/status-panel";
import { useHistory } from "@/contexts/HistoryContext";
import { useI18n } from "@/contexts/I18nContext";

interface HistoryPanelProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HistoryPanel({ isOpen, onOpenChange }: HistoryPanelProps) {
  const { history, clearHistory } = useHistory();
  const { dictionary } = useI18n();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleConfirmDelete = () => {
    clearHistory();
    setShowDeleteConfirm(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col border-l-primary/15">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 font-serif">
            <ScrollText className="h-5 w-5 text-primary" />
            {dictionary.historyTitle}
          </SheetTitle>
          <SheetDescription>{dictionary.historyDescription}</SheetDescription>
        </SheetHeader>

        <div className="themed-scrollbar -mr-4 flex-grow overflow-y-auto pr-4">
          {history.length === 0 ? (
            <StatusPanel variant="empty" message={dictionary.historyEmpty} className="h-full border-none bg-transparent shadow-none" />
          ) : (
            <ul className="space-y-4">
              {history.map((item) => (
                <li key={item.id} className="border-b border-primary/10 pb-3 text-sm">
                  <p className="font-serif font-semibold text-primary">{item.type}</p>
                  <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{item.result}</p>
                  <p className="mt-1 text-right text-xs text-muted-foreground/50">{item.timestamp}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <SheetFooter className="mt-4">
          <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)} disabled={history.length === 0}>
            {dictionary.historyClear}
          </Button>
        </SheetFooter>
      </SheetContent>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">{dictionary.historyConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription className="font-serif">
              {dictionary.historyConfirmBody(history.length)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-serif">{dictionary.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive font-serif hover:bg-destructive/90">
              {dictionary.confirmDelete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
}
