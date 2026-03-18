import { useI18n } from "@/contexts/I18nContext";
import { StatusPanel } from "@/components/ui/status-panel";

export function RouteFallback() {
  const { dictionary } = useI18n();
  return <StatusPanel variant="loading" message={dictionary.routeLoading} />;
}
