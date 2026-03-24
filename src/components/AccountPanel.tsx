import { Cloud, CloudOff, History, LoaderCircle, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/contexts/I18nContext";
import { useTemporalData } from "@/contexts/TemporalDataContext";

interface AccountPanelProps {
  onOpenHistory: () => void;
  onNavigateAccount?: () => void;
}

export function AccountPanel({ onOpenHistory, onNavigateAccount }: AccountPanelProps) {
  const { dictionary } = useI18n();
  const { authStatus, dataMode, sessionUser, syncState, syncError, pendingFirstSyncChoice } = useTemporalData();
  const isBusy = authStatus === "authenticating" || syncState === "loading" || syncState === "syncing";
  const accountTitle = sessionUser?.displayName || sessionUser?.email || dictionary.sidebarAccountSignedOut;
  const syncLabel =
    syncState === "loading" || syncState === "syncing"
      ? dictionary.sidebarSyncing
      : pendingFirstSyncChoice
        ? dictionary.sidebarSyncPending
        : dataMode === "cloud"
          ? syncError
            ? dictionary.sidebarSyncIssue
            : dictionary.sidebarSyncCloud
          : dictionary.sidebarSyncLocalOnly;

  return (
    <div className="rounded-xl border border-primary/15 bg-background/95 p-2.5 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/10 bg-primary/[0.04] text-primary/80">
          <UserRound className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{dictionary.sidebarAccountLabel}</p>
          <p className="truncate font-serif text-sm text-foreground">{accountTitle}</p>
          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            {dataMode === "cloud" ? <Cloud className="h-3.5 w-3.5" /> : <CloudOff className="h-3.5 w-3.5" />}
            <span>{syncLabel}</span>
          </div>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground">
            <Link
              to="/account"
              onClick={onNavigateAccount}
              aria-label={dictionary.accountPageOpen}
              title={dictionary.accountPageOpen}
            >
              {isBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <UserRound className="h-4 w-4" />}
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenHistory}
            aria-label={dictionary.sidebarOpenHistory}
            title={dictionary.sidebarOpenHistory}
            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
          >
            <History className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
