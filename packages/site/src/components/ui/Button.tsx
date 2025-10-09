import styled from 'styled-components';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  fullWidth?: boolean;
}

export const Button = styled.button<ButtonProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  transition: all 0.2s;
  cursor: pointer;
  border: 1px solid transparent;
  font-family: inherit;

  /* Size variants */
  ${({ size = 'md' }) => {
    switch (size) {
      case 'sm':
        return `
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
        `;
      case 'lg':
        return `
          padding: 1rem 1.5rem;
          font-size: 1.125rem;
        `;
      default:
        return `
          padding: 0.75rem 1.25rem;
          font-size: 1rem;
        `;
    }
  }}

  /* Color variants */
  ${({ variant = 'primary', theme }) => {
    switch (variant) {
      case 'secondary':
        return `
          background: ${theme.colors.background?.alternative};
          color: ${theme.colors.text?.default};
          border-color: ${theme.colors.border?.default};
          &:hover:not(:disabled) {
            background: ${theme.colors.background?.hover};
          }
        `;
      case 'outline':
        return `
          background: transparent;
          color: ${theme.colors.primary?.default};
          border-color: ${theme.colors.primary?.default};
          &:hover:not(:disabled) {
            background: ${theme.colors.primary?.muted};
          }
        `;
      default:
        return `
          background: ${theme.colors.primary?.default};
          color: white;
          &:hover:not(:disabled) {
            background: ${theme.colors.primary?.alternative};
          }
        `;
    }
  }}

  ${({ fullWidth }) => fullWidth && 'width: 100%;'}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary?.default};
    outline-offset: 2px;
  }
`;

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  fullWidth?: boolean;
}

export const Button = styled.button<ButtonProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  transition: all 0.2s;
  cursor: pointer;
  border: 1px solid transparent;
  font-family: inherit;

  /* Size variants */
  ${({ size = 'md' }) => {
    switch (size) {
      case 'sm':
        return `
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
        `;
      case 'lg':
        return `
          padding: 1rem 1.5rem;
          font-size: 1.125rem;
        `;
      default:
        return `
          padding: 0.75rem 1.25rem;
          font-size: 1rem;
        `;
    }
  }}

  /* Color variants */
  ${({ variant = 'primary', theme }) => {
    switch (variant) {
      case 'secondary':
        return `
          background: ${theme.colors.background?.alternative};
          color: ${theme.colors.text?.default};
          border-color: ${theme.colors.border?.default};
          &:hover:not(:disabled) {
            background: ${theme.colors.background?.hover};
          }
        `;
      case 'outline':
        return `
          background: transparent;
          color: ${theme.colors.primary?.default};
          border-color: ${theme.colors.primary?.default};
          &:hover:not(:disabled) {
            background: ${theme.colors.primary?.muted};
          }
        `;
      default:
        return `
          background: ${theme.colors.primary?.default};
          color: white;
          &:hover:not(:disabled) {
            background: ${theme.colors.primary?.alternative};
          }
        `;
    }
  }}

  ${({ fullWidth }) => fullWidth && 'width: 100%;'}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary?.default};
    outline-offset: 2px;
  }
`;
