import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { Download, ScrollText, Share2, Upload } from "lucide-react";
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
import {
  applyTemporalDataBundle,
  createTemporalDataBundle,
  getTemporalDataBundleCounts,
  getTemporalDataFilename,
  parseTemporalDataBundle,
  type TemporalDataBundle,
} from "@/lib/app-data-transfer";

interface HistoryPanelProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HistoryPanel({ isOpen, onOpenChange }: HistoryPanelProps) {
  const { history, clearHistory } = useHistory();
  const { dictionary } = useI18n();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pendingImportBundle, setPendingImportBundle] = useState<TemporalDataBundle | null>(null);
  const [dataFeedback, setDataFeedback] = useState<{ message: string; variant: "success" | "error" | "info" } | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const dataCopy = dictionary.dataPortability;
  const canShareFiles = useMemo(() => {
    if (typeof navigator === "undefined" || typeof File === "undefined" || typeof navigator.share !== "function") {
      return false;
    }

    if (typeof navigator.canShare !== "function") {
      return false;
    }

    try {
      return navigator.canShare({
        files: [new File(["{}"], "temporal-data.json", { type: "application/json" })],
      });
    } catch {
      return false;
    }
  }, []);

  const handleConfirmDelete = () => {
    clearHistory();
    setShowDeleteConfirm(false);
  };
  const handleExport = () => {
    if (typeof window === "undefined") {
      return;
    }

    const bundle = createTemporalDataBundle(window.localStorage);
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = getTemporalDataFilename(bundle);
    link.click();
    URL.revokeObjectURL(url);
    setDataFeedback({ message: dataCopy.exportSuccess, variant: "success" });
  };

  const handleShare = async () => {
    if (typeof window === "undefined" || !canShareFiles) {
      return;
    }

    const bundle = createTemporalDataBundle(window.localStorage);
    const file = new File([JSON.stringify(bundle, null, 2)], getTemporalDataFilename(bundle), {
      type: "application/json",
    });

    try {
      await navigator.share({
        title: dataCopy.shareTitle,
        files: [file],
      });
      setDataFeedback({ message: dataCopy.shareSuccess, variant: "success" });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      setDataFeedback({ message: dataCopy.shareError, variant: "error" });
    }
  };

  const handleOpenImport = () => {
    importInputRef.current?.click();
  };

  const handleImportFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    try {
      const parsed = parseTemporalDataBundle(JSON.parse(await file.text()));
      if (!parsed) {
        setDataFeedback({ message: dataCopy.importInvalid, variant: "error" });
        return;
      }

      setPendingImportBundle(parsed);
    } catch {
      setDataFeedback({ message: dataCopy.importInvalid, variant: "error" });
    }
  };

  const handleConfirmImport = () => {
    if (typeof window === "undefined" || !pendingImportBundle) {
      return;
    }

    applyTemporalDataBundle(pendingImportBundle, window.localStorage);
    setPendingImportBundle(null);
    setDataFeedback({ message: dataCopy.importSuccess, variant: "success" });
  };

  const pendingImportCounts = pendingImportBundle ? getTemporalDataBundleCounts(pendingImportBundle) : null;

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

        <div className="mt-4 rounded-2xl border border-primary/10 bg-primary/[0.04] p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ScrollText className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="font-serif text-sm font-semibold text-foreground">{dataCopy.title}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{dataCopy.description}</p>
            </div>
          </div>

          {dataFeedback && (
            <div
              className={
                dataFeedback.variant === "success"
                  ? "mt-3 rounded-md bg-green-100/50 p-2 text-center font-serif text-sm text-green-600 dark:bg-green-900/20 dark:text-green-400"
                  : dataFeedback.variant === "error"
                    ? "mt-3 rounded-md bg-destructive/10 p-2 text-center font-serif text-sm text-destructive"
                    : "mt-3 rounded-md bg-primary/10 p-2 text-center font-serif text-sm text-primary"
              }
            >
              {dataFeedback.message}
            </div>
          )}

          <div className="mt-3 flex flex-col gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4" />
              {dataCopy.export}
            </Button>
            {canShareFiles && (
              <Button variant="outline" onClick={() => void handleShare()}>
                <Share2 className="h-4 w-4" />
                {dataCopy.share}
              </Button>
            )}
            <Button variant="secondary" onClick={handleOpenImport}>
              <Upload className="h-4 w-4" />
              {dataCopy.import}
            </Button>
            <input
              ref={importInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(event) => void handleImportFileChange(event)}
            />
          </div>

          <p className="mt-3 text-xs leading-5 text-muted-foreground">{dataCopy.importHint}</p>
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

      <AlertDialog open={!!pendingImportBundle} onOpenChange={(open) => !open && setPendingImportBundle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">{dataCopy.importConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription className="font-serif">
              <span className="space-y-2">
                <span className="block">{dataCopy.importConfirmBody}</span>
                {pendingImportCounts && (
                  <span className="block space-y-1 text-left text-sm">
                    <span className="block">{dataCopy.historyLabel}: {pendingImportCounts.history}</span>
                    <span className="block">{dataCopy.countdownsLabel}: {pendingImportCounts.savedCountdowns}</span>
                    <span className="block">{dataCopy.notesLabel}: {pendingImportCounts.savedDayNotes}</span>
                    <span className="block">{dataCopy.favoritesLabel}: {pendingImportCounts.savedFavoriteDays}</span>
                  </span>
                )}
                <span className="block">{dataCopy.importReplaceHint}</span>
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-serif">{dictionary.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmImport} className="font-serif">
              {dataCopy.importConfirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
}
