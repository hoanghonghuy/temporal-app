import { MoonStar, Sunrise } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/components/theme-provider";
import { useI18n } from "@/contexts/I18nContext";

export function ThemeToggle() {
  const { setTheme } = useTheme();
  const { dictionary } = useI18n();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="border-primary/20 hover:bg-primary/10 hover:text-primary">
          <Sunrise className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 text-primary transition-all dark:-rotate-90 dark:scale-0" />
          <MoonStar className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 text-primary transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">{dictionary.themeToggleAria}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>{dictionary.themeLight}</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>{dictionary.themeDark}</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>{dictionary.themeSystem}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
