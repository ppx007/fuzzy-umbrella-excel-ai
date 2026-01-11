import React from 'react';
import { cn } from '../../utils/cn';

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'strong' | 'light';
  hover?: boolean;
  onClick?: () => void;
}

const GlassPanel: React.FC<GlassPanelProps> = ({
  children,
  className,
  variant = 'default',
  hover = true,
  onClick,
}) => {
  const baseClasses = 'glass-panel backdrop-blur-xl border border-white/20 rounded-2xl transition-all duration-300';
  
  const variantClasses = {
    default: 'bg-white/10',
    strong: 'bg-white/15',
    light: 'bg-white/5',
  };

  const hoverClasses = hover ? 'hover:bg-white/20 hover:border-white/30 hover:shadow-2xl hover:-translate-y-0.5' : '';

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        hoverClasses,
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default GlassPanel;