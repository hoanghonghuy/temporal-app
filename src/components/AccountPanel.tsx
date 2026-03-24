import { useMemo, useState } from "react";
import { Cloud, CloudOff, History, LoaderCircle, LogIn, LogOut, RefreshCw, UserRound, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/contexts/I18nContext";
import { useTemporalData } from "@/contexts/TemporalDataContext";
import { TemporalApiError } from "@/lib/temporal-api";
import { cn } from "@/lib/utils";

interface AccountPanelProps {
  onOpenHistory: () => void;
}

function getAccountErrorMessage(error: unknown, dictionary: ReturnType<typeof useI18n>["dictionary"]) {
  if (error instanceof TemporalApiError) {
    switch (error.code) {
      case "invalid_email":
        return dictionary.accountErrorInvalidEmail;
      case "weak_password":
        return dictionary.accountErrorWeakPassword;
      case "email_taken":
        return dictionary.accountErrorEmailTaken;
      case "invalid_credentials":
        return dictionary.accountErrorInvalidCredentials;
      case "invalid_refresh_token":
        return dictionary.accountErrorInvalidRefreshToken;
      case "auth_unavailable":
        return dictionary.accountErrorAuthUnavailable;
      default:
        return error.message || dictionary.accountErrorGeneric;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return dictionary.accountErrorGeneric;
}

export function AccountPanel({ onOpenHistory }: AccountPanelProps) {
  const { dictionary } = useI18n();
  const { apiConfigured, authStatus, dataMode, sessionUser, signIn, register, signOut, reloadCloudData, syncState, syncError } =
    useTemporalData();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const isSignedIn = authStatus === "signed_in" && sessionUser !== null;
  const isBusy = authStatus === "authenticating" || syncState === "loading" || syncState === "syncing";
  const accountTitle = sessionUser?.displayName || sessionUser?.email || dictionary.sidebarAccountSignedOut;
  const syncLabel = useMemo(() => {
    if (syncState === "loading" || syncState === "syncing") {
      return dictionary.sidebarSyncing;
    }

    if (dataMode === "cloud") {
      return syncError ? dictionary.sidebarSyncIssue : dictionary.sidebarSyncCloud;
    }

    return dictionary.sidebarSyncLocalOnly;
  }, [dataMode, dictionary, syncError, syncState]);

  const handleSubmit = async () => {
    setFormError(null);

    try {
      if (mode === "signin") {
        await signIn({ email, password });
      } else {
        await register({ email, password, displayName });
      }

      setPassword("");
      setIsOpen(false);
    } catch (error) {
      setFormError(getAccountErrorMessage(error, dictionary));
    }
  };

  const handleSignOut = async () => {
    setFormError(null);

    try {
      await signOut();
      setIsOpen(false);
    } catch (error) {
      setFormError(getAccountErrorMessage(error, dictionary));
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setIsOpen(nextOpen);
    if (!nextOpen) {
      setFormError(null);
    }
  };

  return (
    <>
      <div className="rounded-xl border border-primary/15 bg-background/95 p-2.5 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/10 bg-primary/[0.04] text-primary/80">
            <UserRound className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{dictionary.sidebarAccountLabel}</p>
            <p className="truncate font-serif text-sm text-foreground">{accountTitle}</p>
            <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              {dataMode === "cloud" ? (
                <Cloud className="h-3.5 w-3.5" />
              ) : (
                <CloudOff className="h-3.5 w-3.5" />
              )}
              <span>{syncLabel}</span>
            </div>
          </div>
          <div className="flex shrink-0 gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(true)}
              aria-label={dictionary.accountDialogOpen}
              title={dictionary.accountDialogOpen}
              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
            >
              {isBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
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

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="border-primary/20 p-0 sm:max-w-md">
          <div className="space-y-5 p-5">
            <DialogHeader className="space-y-2 text-left">
              <DialogTitle className="font-serif text-xl">{dictionary.accountDialogTitle}</DialogTitle>
              <DialogDescription>{isSignedIn ? dictionary.accountDialogSignedInDescription : dictionary.accountDialogDescription}</DialogDescription>
            </DialogHeader>

            {!apiConfigured ? (
              <div className="rounded-lg border border-primary/10 bg-primary/5 px-3 py-3 text-sm leading-6 text-muted-foreground">
                {dictionary.accountDialogUnavailable}
              </div>
            ) : isSignedIn && sessionUser ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-primary/10 bg-primary/[0.04] p-4">
                  <p className="font-serif text-base text-foreground">{sessionUser.displayName || sessionUser.email}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{sessionUser.email}</p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <Cloud className="h-3.5 w-3.5 text-primary" />
                    <span>{syncError ? dictionary.accountDialogCloudIssue : dictionary.accountDialogCloudReady}</span>
                  </div>
                  {syncError && (
                    <p className="mt-2 text-sm leading-6 text-destructive">{syncError}</p>
                  )}
                </div>
                <DialogFooter className="flex-row justify-between gap-2 sm:justify-between sm:space-x-0">
                  <Button variant="outline" onClick={() => void reloadCloudData()} disabled={isBusy}>
                    <RefreshCw className={cn("h-4 w-4", isBusy && "animate-spin")} />
                    {dictionary.accountDialogReload}
                  </Button>
                  <Button variant="destructive" onClick={() => void handleSignOut()} disabled={isBusy}>
                    <LogOut className="h-4 w-4" />
                    {dictionary.accountDialogSignOut}
                  </Button>
                </DialogFooter>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-1 rounded-xl border border-primary/10 bg-primary/[0.03] p-1">
                  <button
                    type="button"
                    onClick={() => setMode("signin")}
                    className={cn(
                      "rounded-lg px-3 py-2 text-sm transition-colors",
                      mode === "signin" ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {dictionary.accountDialogSignInTab}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("register")}
                    className={cn(
                      "rounded-lg px-3 py-2 text-sm transition-colors",
                      mode === "register" ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {dictionary.accountDialogRegisterTab}
                  </button>
                </div>

                <div className="space-y-3">
                  {mode === "register" && (
                    <div className="grid gap-1.5">
                      <Label htmlFor="account-display-name">{dictionary.accountDialogDisplayNameLabel}</Label>
                      <Input
                        id="account-display-name"
                        value={displayName}
                        placeholder={dictionary.accountDialogDisplayNamePlaceholder}
                        onChange={(event) => setDisplayName(event.target.value)}
                      />
                    </div>
                  )}

                  <div className="grid gap-1.5">
                    <Label htmlFor="account-email">{dictionary.accountDialogEmailLabel}</Label>
                    <Input
                      id="account-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      placeholder={dictionary.accountDialogEmailPlaceholder}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <Label htmlFor="account-password">{dictionary.accountDialogPasswordLabel}</Label>
                    <Input
                      id="account-password"
                      type="password"
                      autoComplete={mode === "signin" ? "current-password" : "new-password"}
                      value={password}
                      placeholder={dictionary.accountDialogPasswordPlaceholder}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                  </div>
                </div>

                {formError && (
                  <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm leading-6 text-destructive">
                    {formError}
                  </div>
                )}

                <DialogFooter className="sm:justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {mode === "signin" ? <LogIn className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
                    <span>{mode === "signin" ? dictionary.accountDialogLocalReady : dictionary.accountDialogRegisterHint}</span>
                  </div>
                  <Button onClick={() => void handleSubmit()} disabled={isBusy || !email.trim() || !password.trim()}>
                    {mode === "signin" ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                    {mode === "signin" ? dictionary.accountDialogSignIn : dictionary.accountDialogRegister}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
