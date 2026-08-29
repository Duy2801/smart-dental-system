type PageShellProps = {
  title: string;
  description?: string;
  children?: React.ReactNode;
};

export function PageShell({ title, description, children }: PageShellProps) {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-brand-dark">{title}</h2>
        {description ? (
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children ?? (
        <div className="rounded-xl border border-dashed border-border bg-white px-4 py-8 sm:px-6 sm:py-12 text-center text-sm text-muted-foreground">
          Nội dung đang được phát triển.
        </div>
      )}
    </div>
  );
}

