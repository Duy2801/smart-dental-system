type PageShellProps = {
  title: string;
  description?: string;
  children?: React.ReactNode;
};

export function PageShell({ title, description, children }: PageShellProps) {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-brand-dark">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children ?? (
        <div className="rounded-xl border border-dashed border-border bg-white px-6 py-12 text-center text-sm text-muted-foreground">
          Nội dung đang được phát triển.
        </div>
      )}
    </div>
  );
}
