import React, { useRef } from 'react';
import styled, { css, keyframes } from 'styled-components';
// @ts-ignore
import theme from '../styles/theme';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'text';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  disabled?: boolean;
  isLoading?: boolean;
  icon?: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
}

const rippleEffect = keyframes`
  0% {
    transform: scale(0);
    opacity: 1;
  }
  50% {
    transform: scale(10);
    opacity: 0.5;
  }
  100% {
    transform: scale(35);
    opacity: 0;
  }
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const buttonSizes = {
  small: css`
    font-size: ${theme.typography.sizes.xs};
    padding: ${theme.spacing.xs} ${theme.spacing.md};
  `,
  medium: css`
    font-size: ${theme.typography.sizes.sm};
    padding: ${theme.spacing.sm} ${theme.spacing.lg};
  `,
  large: css`
    font-size: ${theme.typography.sizes.md};
    padding: ${theme.spacing.md} ${theme.spacing.xl};
  `,
};

const buttonVariants = {
  primary: css`
    background-color: ${theme.colors.primary};
    color: white;
    
    &:hover:not(:disabled) {
      background-color: ${theme.colors.primary}e6;
      box-shadow: ${theme.shadows.md};
    }
    
    &:active:not(:disabled) {
      background-color: ${theme.colors.primary}cc;
    }
  `,
  secondary: css`
    background-color: transparent;
    color: ${theme.colors.text.primary};
    border: 1px solid ${theme.colors.text.secondary};
    
    &:hover:not(:disabled) {
      background-color: rgba(255, 255, 255, 0.1);
    }
    
    &:active:not(:disabled) {
      background-color: rgba(255, 255, 255, 0.2);
    }
  `,
  text: css`
    background-color: transparent;
    color: ${theme.colors.text.primary};
    padding: ${theme.spacing.xs};
    
    &:hover:not(:disabled) {
      background-color: rgba(255, 255, 255, 0.05);
    }
    
    &:active:not(:disabled) {
      background-color: rgba(255, 255, 255, 0.1);
    }
  `,
};

const StyledButton = styled.button<{
  variant: 'primary' | 'secondary' | 'text';
  size: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  hasIcon: boolean;
}>`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: ${theme.borderRadius.md};
  font-weight: ${theme.typography.fontWeights.medium};
  transition: all ${theme.transitions.fast};
  overflow: hidden;
  width: ${props => props.fullWidth ? '100%' : 'auto'};
  
  ${props => buttonSizes[props.size]};
  ${props => buttonVariants[props.variant]};
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .ripple {
    position: absolute;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.3);
    animation: ${rippleEffect} 0.8s linear;
    pointer-events: none;
  }
  
  ${props => props.hasIcon && `
    .icon {
      margin-right: ${props.children ? theme.spacing.sm : '0'};
    }
  `}
`;

const LoadingSpinner = styled.div`
  width: 18px;
  height: 18px;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
  margin-right: ${props => props.children ? theme.spacing.sm : '0'};
`;

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  disabled = false,
  isLoading = false,
  icon,
  type = 'button',
}) => {
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || isLoading) return;
    
    // Add ripple effect
    const button = buttonRef.current;
    if (button) {
      const rect = button.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      const ripple = document.createElement('span');
      ripple.classList.add('ripple');
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      
      button.appendChild(ripple);
      
      setTimeout(() => {
        ripple.remove();
      }, 800);
    }
    
    if (onClick) onClick();
  };

  return (
    <StyledButton
      ref={buttonRef}
      type={type}
      onClick={handleClick}
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      disabled={disabled || isLoading}
      hasIcon={!!icon || isLoading}
    >
      {isLoading ? (
        <LoadingSpinner />
      ) : icon ? (
        <span className="icon">{icon}</span>
      ) : null}
      {children}
    </StyledButton>
  );
};

export default Button; 