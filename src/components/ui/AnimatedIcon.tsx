import React from 'react';
import { cn } from '../../utils/cn';

interface AnimatedIconProps {
  icon: string | React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'pulse' | 'bounce' | 'spin' | 'float';
  color?: 'primary' | 'secondary' | 'accent' | 'white' | 'gray';
  onClick?: () => void;
}

const AnimatedIcon: React.FC<AnimatedIconProps> = ({
  icon,
  className,
  size = 'md',
  variant = 'default',
  color = 'primary',
  onClick,
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
  };

  const colorClasses = {
    primary: 'text-blue-400',
    secondary: 'text-purple-400',
    accent: 'text-cyan-400',
    white: 'text-white',
    gray: 'text-gray-400',
  };

  const variantClasses = {
    default: '',
    pulse: 'animate-pulse',
    bounce: 'animate-bounce',
    spin: 'animate-spin',
    float: 'animate-float',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center transition-all duration-300',
        sizeClasses[size],
        colorClasses[color],
        variantClasses[variant],
        onClick && 'cursor-pointer hover:scale-110 active:scale-95',
        className
      )}
      onClick={onClick}
    >
      {typeof icon === 'string' ? (
        <span className="text-lg leading-none">{icon}</span>
      ) : (
        icon
      )}
    </span>
  );
};

export default AnimatedIcon;