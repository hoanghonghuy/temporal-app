import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/contexts/I18nContext";

export function LanguageToggle() {
  const { locale, setLocale, dictionary } = useI18n();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="border-primary/20 hover:bg-primary/10 hover:text-primary">
          <Languages className="h-5 w-5 text-primary" />
          <span className="sr-only">{dictionary.languageName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => setLocale("vi")}
          className={locale === "vi" ? "font-semibold text-primary" : undefined}
        >
          {dictionary.languageOptionVi}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLocale("en")}
          className={locale === "en" ? "font-semibold text-primary" : undefined}
        >
          {dictionary.languageOptionEn}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
