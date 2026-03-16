import { Github, Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-primary/15 bg-card/50 text-muted-foreground mt-12">
      <div className="container py-6 text-center text-sm">
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <Sparkles className="h-3 w-3 text-primary/50" />
          <span className="text-xs tracking-widest uppercase text-muted-foreground/70">Thiên Đạo Vô Thường</span>
          <Sparkles className="h-3 w-3 text-primary/50" />
        </div>
        <p>
          Thiết kế bởi{" "}
          <a
            href="https://github.com/hoanghonghuy"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
          >
            <Github className="h-3.5 w-3.5" />
            hoanghonghuy
          </a>
        </p>
      </div>
    </footer>
  );
}