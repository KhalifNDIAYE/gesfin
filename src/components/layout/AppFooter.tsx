export function AppFooter() {
  return (
    <footer className="py-4 px-6 text-center text-xs text-muted-foreground border-t border-border bg-background">
      © {new Date().getFullYear()}{" "}
      <a
        href="https://www.svi.sn"
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-foreground transition-colors"
      >
        Sen Vision IT
      </a>
      . Tous droits réservés.
    </footer>
  );
}
