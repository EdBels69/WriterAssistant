import React from 'react';
import { designTokens, token } from './design-tokens';

const Input = React.forwardRef(({
  label,
  error,
  helperText,
  disabled = false,
  required = false,
  size = 'medium',
  fullWidth = false,
  className = '',
  startIcon,
  endIcon,
  ...props
}, ref) => {
  const baseStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: token.spacing(1),
    width: fullWidth ? '100%' : 'auto',
  };

  const labelStyles = {
    fontSize: token.fontSize('sm'),
    fontWeight: designTokens.typography.fontWeight.medium,
    color: token.color('text.primary'),
    lineHeight: designTokens.typography.lineHeight.tight,
  };

  const inputContainerStyles = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  };

  const inputBaseStyles = {
    fontFamily: designTokens.typography.fontFamily.body,
    lineHeight: designTokens.typography.lineHeight.normal,
    border: `1px solid ${error ? token.color('error.300') : token.color('neutral.300')}`,
    borderRadius: token.borderRadius('base'),
    backgroundColor: disabled ? token.color('neutral.100') : token.color('background.primary'),
    color: token.color('text.primary'),
    transition: 'all 0.2s ease-in-out',
    '&:focus': {
      outline: 'none',
      borderColor: error ? token.color('error.500') : token.color('primary.500'),
      boxShadow: `0 0 0 3px ${error ? token.color('error.100') : token.color('primary.100')}`,
    },
    '&:disabled': {
      cursor: 'not-allowed',
      opacity: designTokens.opacity[50],
    },
    '&::placeholder': {
      color: token.color('text.tertiary'),
    },
  };

  const sizeStyles = {
    small: {
      padding: `${token.spacing(1.5)} ${token.spacing(2.5)}`,
      fontSize: token.fontSize('sm'),
      paddingLeft: startIcon ? token.spacing(8) : token.spacing(2.5),
      paddingRight: endIcon ? token.spacing(8) : token.spacing(2.5),
    },
    medium: {
      padding: `${token.spacing(2)} ${token.spacing(3)}`,
      fontSize: token.fontSize('base'),
      paddingLeft: startIcon ? token.spacing(10) : token.spacing(3),
      paddingRight: endIcon ? token.spacing(10) : token.spacing(3),
    },
    large: {
      padding: `${token.spacing(2.5)} ${token.spacing(4)}`,
      fontSize: token.fontSize('lg'),
      paddingLeft: startIcon ? token.spacing(12) : token.spacing(4),
      paddingRight: endIcon ? token.spacing(12) : token.spacing(4),
    },
  };

  const iconStyles = {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    color: token.color('text.secondary'),
    pointerEvents: 'none',
  };

  const startIconStyles = {
    ...iconStyles,
    left: token.spacing(2.5),
  };

  const endIconStyles = {
    ...iconStyles,
    right: token.spacing(2.5),
  };

  const helperTextStyles = {
    fontSize: token.fontSize('xs'),
    color: error ? token.color('error.600') : token.color('text.secondary'),
    lineHeight: designTokens.typography.lineHeight.tight,
  };

  return (
    <div style={baseStyles} className={className}>
      {label && (
        <label style={labelStyles}>
          {label}
          {required && (
            <span style={{ color: token.color('error.500'), marginLeft: token.spacing(0.5) }}>
              *
            </span>
          )}
        </label>
      )}
      
      <div style={inputContainerStyles}>
        {startIcon && (
          <div style={startIconStyles}>
            {startIcon}
          </div>
        )}
        
        <input
          ref={ref}
          disabled={disabled}
          required={required}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={helperText ? `${props.id}-helper` : undefined}
          style={{
            ...inputBaseStyles,
            ...sizeStyles[size],
            width: '100%',
          }}
          {...props}
        />
        
        {endIcon && (
          <div style={endIconStyles}>
            {endIcon}
          </div>
        )}
      </div>
      
      {(error || helperText) && (
        <div 
          id={helperText ? `${props.id}-helper` : undefined}
          style={helperTextStyles}
        >
          {error || helperText}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;