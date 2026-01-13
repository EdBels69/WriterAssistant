import React from 'react';
import { designTokens, token } from './design-tokens';

const Button = React.forwardRef(({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  onClick,
  type = 'button',
  className = '',
  ...props
}, ref) => {
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    borderRadius: token.borderRadius('lg'),
    fontWeight: designTokens.typography.fontWeight.medium,
    fontFamily: designTokens.typography.fontFamily.body,
    lineHeight: designTokens.typography.lineHeight.normal,
    transition: 'all 0.2s ease-in-out',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? designTokens.opacity[50] : designTokens.opacity[100],
    width: fullWidth ? '100%' : 'auto',
    position: 'relative',
    overflow: 'hidden',
  };

  const sizeStyles = {
    small: {
      padding: `${token.spacing(2)} ${token.spacing(3)}`,
      fontSize: token.fontSize('sm'),
    },
    medium: {
      padding: `${token.spacing(3)} ${token.spacing(4)}`,
      fontSize: token.fontSize('base'),
    },
    large: {
      padding: `${token.spacing(4)} ${token.spacing(6)}`,
      fontSize: token.fontSize('lg'),
    },
  };

  const variantStyles = {
    primary: {
      backgroundColor: token.color('primary.500'),
      color: token.color('text.inverse'),
      '&:hover:not(:disabled)': {
        backgroundColor: token.color('primary.600'),
        transform: 'translateY(-1px)',
        boxShadow: designTokens.shadow.md,
      },
      '&:active:not(:disabled)': {
        backgroundColor: token.color('primary.700'),
        transform: 'translateY(0)',
      },
    },
    secondary: {
      backgroundColor: token.color('neutral.100'),
      color: token.color('text.primary'),
      border: `1px solid ${token.color('neutral.300')}`,
      '&:hover:not(:disabled)': {
        backgroundColor: token.color('neutral.200'),
        transform: 'translateY(-1px)',
        boxShadow: designTokens.shadow.sm,
      },
      '&:active:not(:disabled)': {
        backgroundColor: token.color('neutral.300'),
        transform: 'translateY(0)',
      },
    },
    ghost: {
      backgroundColor: 'transparent',
      color: token.color('text.primary'),
      '&:hover:not(:disabled)': {
        backgroundColor: token.color('neutral.100'),
        transform: 'translateY(-1px)',
      },
      '&:active:not(:disabled)': {
        backgroundColor: token.color('neutral.200'),
        transform: 'translateY(0)',
      },
    },
    danger: {
      backgroundColor: token.color('error.500'),
      color: token.color('text.inverse'),
      '&:hover:not(:disabled)': {
        backgroundColor: token.color('error.600'),
        transform: 'translateY(-1px)',
        boxShadow: designTokens.shadow.md,
      },
      '&:active:not(:disabled)': {
        backgroundColor: token.color('error.700'),
        transform: 'translateY(0)',
      },
    },
  };

  const loadingStyles = {
    cursor: 'wait',
    '&::after': {
      content: '""',
      position: 'absolute',
      top: '50%',
      left: '50%',
      width: '16px',
      height: '16px',
      margin: '-8px 0 0 -8px',
      border: `2px solid ${token.color('neutral.300')}`,
      borderTop: `2px solid ${variant === 'primary' || variant === 'danger' ? token.color('text.inverse') : token.color('primary.500')}`,
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    },
  };

  const style = {
    ...baseStyles,
    ...sizeStyles[size],
    ...variantStyles[variant],
    ...(loading && loadingStyles),
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      style={style}
      className={className}
      aria-busy={loading}
      aria-disabled={disabled}
      {...props}
    >
      {loading ? <span style={{ opacity: 0 }}>{children}</span> : children}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;