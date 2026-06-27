export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-dark px-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#0097ff33,transparent_50%)]" />
      <div className="relative w-full max-w-md">{children}</div>
    </div>
  );
}
