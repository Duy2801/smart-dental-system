import React from 'react';
import { Button as PaperButton, ButtonProps as PaperButtonProps } from 'react-native-paper';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';

type ButtonProps = Omit<PaperButtonProps, 'mode'> & {
  variant?: ButtonVariant;
  className?: string;
};

const variantClassName: Record<ButtonVariant, string> = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  outline: 'border border-primary bg-transparent',
  ghost: 'bg-transparent',
  destructive: 'bg-destructive',
};

export function Button({
  children,
  className = '',
  labelStyle,
  variant = 'primary',
  ...props
}: ButtonProps) {
  const mode = variant === 'outline' ? 'outlined' : variant === 'ghost' ? 'text' : 'contained';

  return (
    <PaperButton
      mode={mode}
      className={`h-12 justify-center rounded-xl ${variantClassName[variant]} ${className}`}
      labelStyle={[{ fontSize: 14, fontWeight: '800' }, labelStyle]}
      {...props}
    >
      {children}
    </PaperButton>
  );
}
