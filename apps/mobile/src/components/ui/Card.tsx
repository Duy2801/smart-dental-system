import React from 'react';
import { Card as PaperCard, TouchableRipple } from 'react-native-paper';

type CardProps = {
  children: React.ReactNode;
  className?: string;
  onPress?: () => void;
};

export function Card({ children, className = '', onPress }: CardProps) {
  const body = (
    <PaperCard mode="outlined" className={`rounded-2xl border-border bg-surface ${className}`}>
      {children}
    </PaperCard>
  );

  if (!onPress) return body;

  return (
    <TouchableRipple borderless onPress={onPress} className="rounded-2xl">
      {body}
    </TouchableRipple>
  );
}

Card.Content = PaperCard.Content;
Card.Title = PaperCard.Title;
Card.Actions = PaperCard.Actions;
