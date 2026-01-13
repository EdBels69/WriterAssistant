// Design System Index - Единая точка входа для всех компонентов

export { default as designTokens } from './design-tokens';
export { token } from './design-tokens';

export { default as Button } from './Button';
export { default as Input } from './Input';

export { default as Card } from './Card';
export { default as Modal } from './Modal';
export { default as Typography } from './Typography';
export { default as Navigation } from './Navigation';

// Utility functions
export const cn = (...classes) => classes.filter(Boolean).join(' ');

export const focusRing = {
  outline: 'none',
  boxShadow: `0 0 0 3px ${token.color('primary.100')}`,
  borderColor: token.color('primary.500'),
};

export const visuallyHidden = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

// Responsive utilities
export const breakpoints = designTokens.breakpoints;

export const mediaQuery = {
  sm: `@media (min-width: ${breakpoints.sm})`,
  md: `@media (min-width: ${breakpoints.md})`,
  lg: `@media (min-width: ${breakpoints.lg})`,
  xl: `@media (min-width: ${breakpoints.xl})`,
  '2xl': `@media (min-width: ${breakpoints['2xl']})`,
};

// Animation utilities
export const animations = {
  spin: `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `,
  fadeIn: `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `,
  slideIn: `
    @keyframes slideIn {
      from { transform: translateX(-100%); }
      to { transform: translateX(0); }
    }
  `,
};

// Export types for TypeScript (if needed)
export const componentProps = {
  button: ['variant', 'size', 'disabled', 'loading', 'fullWidth'],
  input: ['label', 'error', 'helperText', 'disabled', 'required', 'size', 'fullWidth', 'startIcon', 'endIcon'],
  card: ['variant', 'padding', 'elevation', 'border'],
};

// Theme provider utilities
export const ThemeProvider = ({ children }) => {
  React.useEffect(() => {
    // Inject global styles
    const style = document.createElement('style');
    style.textContent = `
      :root {
        --color-primary-50: ${token.color('primary.50')};
        --color-primary-500: ${token.color('primary.500')};
        --color-neutral-100: ${token.color('neutral.100')};
        --color-text-primary: ${token.color('text.primary')};
        /* Add all design tokens as CSS variables */
      }
      
      ${animations.spin}
      ${animations.fadeIn}
      ${animations.slideIn}
      
      * {
        box-sizing: border-box;
      }
      
      body {
        font-family: ${designTokens.typography.fontFamily.body};
        line-height: ${designTokens.typography.lineHeight.normal};
        color: ${token.color('text.primary')};
        background-color: ${token.color('background.primary')};
      }
      
      /* Focus styles for accessibility */
      button:focus-visible,
      input:focus-visible,
      select:focus-visible,
      textarea:focus-visible {
        ${Object.entries(focusRing).map(([key, value]) => `${key}: ${value};`).join('\n')}
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  return children;
};

// Default export for easy importing
export default {
  designTokens,
  token,
  Button,
  Input,
  Card,
  Modal,
  Typography,
  Navigation,
  cn,
  focusRing,
  visuallyHidden,
  breakpoints,
  mediaQuery,
  animations,
  componentProps,
  ThemeProvider,
};