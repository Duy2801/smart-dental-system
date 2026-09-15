import type { ComponentPropsWithRef } from "react";
type ButtonProps = ComponentPropsWithRef<"button"> & {
  variant?: "primary" | "outline" | "ghost";
};
export function Button({
  className = "",
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  const variants = {
    primary: "bg-[var(--chat-brand,#0863c5)] text-white hover:brightness-95",
    outline:
      "border border-[var(--chat-border,#d9e4ef)] bg-white text-[var(--chat-brand,#0863c5)] hover:bg-[var(--chat-muted,#f4f8fc)]",
    ghost: "text-inherit hover:bg-white/15",
  };
  return (
    <button
      type={type}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--chat-brand,#0863c5)] disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
