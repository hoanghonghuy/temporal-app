import { useMemo, useState } from "react";
import { Cloud, CloudOff, KeyRound, LoaderCircle, LogIn, LogOut, RefreshCw, Shield, Sparkles, UserPlus, UserRound } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusPanel } from "@/components/ui/status-panel";
import { useHistory } from "@/contexts/HistoryContext";
import { useI18n } from "@/contexts/I18nContext";
import { useTemporalData } from "@/contexts/TemporalDataContext";
import { TemporalApiError } from "@/lib/temporal-api";
import { cn } from "@/lib/utils";

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

export function AccountPage() {
  const { dictionary, localeTag } = useI18n();
  const { history } = useHistory();
  const {
    apiConfigured,
    authStatus,
    dataMode,
    sessionUser,
    signIn,
    register,
    signOut,
    reloadCloudData,
    syncState,
    syncError,
    pendingFirstSyncChoice,
    keepCloudData,
    replaceCloudWithLocalData,
    mergeCloudWithLocalData,
    savedCountdowns,
    savedDayNotes,
    savedFavoriteDays,
  } = useTemporalData();
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [showForgotPasswordPlaceholder, setShowForgotPasswordPlaceholder] = useState(false);

  const isSignedIn = authStatus === "signed_in" && sessionUser !== null;
  const isBusy = authStatus === "authenticating" || syncState === "loading" || syncState === "syncing";
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

  const dataRows = useMemo(
    () => [
      { label: dictionary.dataPortability.countdownsLabel, value: savedCountdowns.length },
      { label: dictionary.dataPortability.notesLabel, value: savedDayNotes.length },
      { label: dictionary.dataPortability.favoritesLabel, value: savedFavoriteDays.length },
      { label: dictionary.accountPageHistoryLabel, value: history.length },
    ],
    [dictionary, history.length, savedCountdowns.length, savedDayNotes.length, savedFavoriteDays.length]
  );

  const formatCounts = (counts: NonNullable<typeof pendingFirstSyncChoice>["localCounts"]) => [
    `${dictionary.dataPortability.countdownsLabel}: ${counts.savedCountdowns}`,
    `${dictionary.dataPortability.notesLabel}: ${counts.savedDayNotes}`,
    `${dictionary.dataPortability.favoritesLabel}: ${counts.savedFavoriteDays}`,
  ];

  const handleSubmit = async () => {
    setFormError(null);

    try {
      await (mode === "signin"
        ? signIn({ email, password })
        : register({ email, password, displayName }));

      setDisplayName("");
      setPassword("");
      setShowForgotPasswordPlaceholder(false);
    } catch (error) {
      setFormError(getAccountErrorMessage(error, dictionary));
    }
  };

  const handleSignOut = async () => {
    setFormError(null);

    try {
      await signOut();
      setPassword("");
    } catch (error) {
      setFormError(getAccountErrorMessage(error, dictionary));
    }
  };

  const handleForgotPasswordPlaceholder = () => {
    setShowForgotPasswordPlaceholder(true);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <section className="rounded-[28px] border border-primary/15 bg-card/95 p-5 shadow-sm sm:p-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-primary/80">
          <Sparkles className="h-3.5 w-3.5" />
          <span>{dictionary.accountPageBadge}</span>
        </div>
        <h1 className="mt-3 font-serif text-2xl text-foreground sm:text-3xl">{dictionary.accountPageTitle}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">{dictionary.accountPageDescription}</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
        <div className="space-y-4">
          {!apiConfigured ? (
            <StatusPanel variant="info" message={dictionary.accountDialogUnavailable} />
          ) : isSignedIn && sessionUser ? (
            <>
              {pendingFirstSyncChoice && (
                <Card className="border-primary/15 bg-primary/[0.05] shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl">{dictionary.accountFirstSyncTitle}</CardTitle>
                    <CardDescription className="leading-6">{dictionary.accountFirstSyncDescription}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-primary/10 bg-background/75 p-4">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{dictionary.accountFirstSyncLocalLabel}</p>
                        <div className="mt-2 space-y-1 text-sm text-foreground">
                          {formatCounts(pendingFirstSyncChoice.localCounts).map((line) => (
                            <p key={line}>{line}</p>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-xl border border-primary/10 bg-background/75 p-4">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{dictionary.accountFirstSyncCloudLabel}</p>
                        <div className="mt-2 space-y-1 text-sm text-foreground">
                          {formatCounts(pendingFirstSyncChoice.cloudCounts).map((line) => (
                            <p key={line}>{line}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button onClick={() => void mergeCloudWithLocalData()} disabled={isBusy} className="sm:flex-1">
                        {dictionary.accountFirstSyncMerge}
                      </Button>
                      <Button onClick={() => void replaceCloudWithLocalData()} disabled={isBusy} variant="secondary" className="sm:flex-1">
                        {dictionary.accountFirstSyncUseLocal}
                      </Button>
                      <Button variant="outline" onClick={keepCloudData} disabled={isBusy} className="sm:flex-1">
                        {dictionary.accountFirstSyncKeepCloud}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="border-primary/12 bg-card/95 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-primary/10 bg-primary/[0.04] text-primary/80">
                      <UserRound className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-xl">{dictionary.accountPageProfileTitle}</CardTitle>
                      <CardDescription className="mt-1 leading-6">{dictionary.accountPageProfileDescription}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 rounded-2xl border border-primary/10 bg-primary/[0.03] p-4">
                    <div>
                      <p className="font-serif text-lg text-foreground">{sessionUser.displayName || sessionUser.email}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{sessionUser.email}</p>
                    </div>
                    <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.18em]">{dictionary.accountPageJoinedLabel}</p>
                        <p className="mt-1 text-foreground">
                          {format(new Date(sessionUser.createdAt), "dd/MM/yyyy")}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.18em]">{dictionary.accountPageUpdatedLabel}</p>
                        <p className="mt-1 text-foreground">
                          {new Date(sessionUser.updatedAt).toLocaleString(localeTag)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {dataMode === "cloud" ? <Cloud className="h-4 w-4 text-primary" /> : <CloudOff className="h-4 w-4" />}
                      <span>{syncLabel}</span>
                    </div>
                    {syncError && <p className="text-sm leading-6 text-destructive">{syncError}</p>}
                    {formError && <p className="text-sm leading-6 text-destructive">{formError}</p>}
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button variant="outline" onClick={() => void reloadCloudData()} disabled={isBusy} className="sm:flex-1">
                      <RefreshCw className={cn("h-4 w-4", isBusy && "animate-spin")} />
                      {dictionary.accountDialogReload}
                    </Button>
                    <Button variant="destructive" onClick={() => void handleSignOut()} disabled={isBusy} className="sm:flex-1">
                      <LogOut className="h-4 w-4" />
                      {dictionary.accountDialogSignOut}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary/12 bg-card/95 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/10 bg-primary/[0.04] text-primary/80">
                      <Shield className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle>{dictionary.accountPageSecurityTitle}</CardTitle>
                      <CardDescription className="mt-1 leading-6">{dictionary.accountPageSecurityDescription}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" onClick={handleForgotPasswordPlaceholder} className="w-full sm:w-auto">
                    <KeyRound className="h-4 w-4" />
                    {dictionary.accountPageForgotPassword}
                  </Button>
                  {showForgotPasswordPlaceholder && (
                    <div className="rounded-xl border border-dashed border-primary/15 bg-primary/[0.03] px-4 py-3 text-sm leading-6 text-muted-foreground">
                      {dictionary.accountPageForgotPasswordPlaceholder}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="border-primary/12 bg-card/95 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">{dictionary.accountDialogTitle}</CardTitle>
                <CardDescription className="leading-6">{dictionary.accountDialogDescription}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                      <Label htmlFor="account-display-name-page">{dictionary.accountDialogDisplayNameLabel}</Label>
                      <Input
                        id="account-display-name-page"
                        value={displayName}
                        placeholder={dictionary.accountDialogDisplayNamePlaceholder}
                        onChange={(event) => setDisplayName(event.target.value)}
                      />
                    </div>
                  )}

                  <div className="grid gap-1.5">
                    <Label htmlFor="account-email-page">{dictionary.accountDialogEmailLabel}</Label>
                    <Input
                      id="account-email-page"
                      type="email"
                      autoComplete="email"
                      value={email}
                      placeholder={dictionary.accountDialogEmailPlaceholder}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <Label htmlFor="account-password-page">{dictionary.accountDialogPasswordLabel}</Label>
                    <Input
                      id="account-password-page"
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

                {showForgotPasswordPlaceholder && mode === "signin" && (
                  <div className="rounded-xl border border-dashed border-primary/15 bg-primary/[0.03] px-4 py-3 text-sm leading-6 text-muted-foreground">
                    {dictionary.accountPageForgotPasswordPlaceholder}
                  </div>
                )}

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {mode === "signin" ? <LogIn className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
                    <span>{mode === "signin" ? dictionary.accountDialogLocalReady : dictionary.accountDialogRegisterHint}</span>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    {mode === "signin" && (
                      <Button variant="ghost" onClick={handleForgotPasswordPlaceholder} className="sm:w-auto">
                        <KeyRound className="h-4 w-4" />
                        {dictionary.accountPageForgotPassword}
                      </Button>
                    )}
                    <Button onClick={() => void handleSubmit()} disabled={isBusy || !email.trim() || !password.trim()}>
                      {isBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : mode === "signin" ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                      {mode === "signin" ? dictionary.accountDialogSignIn : dictionary.accountDialogRegister}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card className="border-primary/12 bg-card/95 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle>{dictionary.accountPageDataTitle}</CardTitle>
              <CardDescription className="leading-6">{dictionary.accountPageDataDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-2xl border border-primary/10 bg-primary/[0.03] p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {dataMode === "cloud" ? <Cloud className="h-4 w-4 text-primary" /> : <CloudOff className="h-4 w-4" />}
                  <span>{dictionary.accountPageSyncSourceLabel}: {syncLabel}</span>
                </div>
                <div className="mt-4 space-y-3">
                  {dataRows.map((row) => (
                    <div key={row.label} className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className="font-serif text-base text-foreground">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-dashed border-primary/15 bg-background/70 p-4 text-sm leading-6 text-muted-foreground">
                {dictionary.accountPageHistoryLocalHint}
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/12 bg-card/95 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle>{dictionary.accountPageStatusTitle}</CardTitle>
              <CardDescription className="leading-6">{dictionary.accountPageStatusDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
              <div className="rounded-2xl border border-primary/10 bg-primary/[0.03] p-4">
                <p className="font-serif text-base text-foreground">
                  {apiConfigured ? dictionary.accountPageApiReady : dictionary.accountPageApiUnavailable}
                </p>
                <p className="mt-2">{dictionary.accountPageSyncStatusHint}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
