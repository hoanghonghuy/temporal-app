import { Link, isRouteErrorResponse, useRouteError } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { StatusPanel } from "@/components/ui/status-panel";
import { useI18n } from "@/contexts/I18nContext";

export function RouteErrorBoundary() {
  const error = useRouteError();
  const { dictionary } = useI18n();

  let message = dictionary.routeErrorBody;
  if (isRouteErrorResponse(error)) {
    message = `${error.status} ${error.statusText}`;
  } else if (error instanceof Error && error.message) {
    message = error.message;
  }

  return (
    <div className="space-y-4">
      <StatusPanel variant="error" message={`${dictionary.routeErrorTitle}. ${message}`} />
      <div className="flex justify-center">
        <Button asChild variant="outline" className="border-primary/20 hover:bg-primary/10 hover:text-primary">
          <Link to="/">{dictionary.routeErrorAction}</Link>
        </Button>
      </div>
    </div>
  );
}
