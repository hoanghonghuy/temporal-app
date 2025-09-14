import { Github } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-muted/50 text-muted-foreground mt-12">
      <div className="container py-6 text-center text-sm">
        <p>
          Thiết kế bởi{" "}
          <a
            href="https://github.com/hoanghonghuy"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-foreground hover:underline inline-flex items-center gap-1"
          >
            <Github className="h-4 w-4" />
            hoanghonghuy
          </a>
        </p>
      </div>
    </footer>
  );
}