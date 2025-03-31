import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
// @ts-ignore
import theme from '../styles/theme';

interface TutorialStep {
  target: string; // CSS selector
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface TutorialProps {
  steps: TutorialStep[];
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: ${theme.zIndices?.modal || 300};
  animation: ${fadeIn} 0.3s ease;
`;

const TooltipContainer = styled(motion.div)`
  position: absolute;
  background-color: ${theme.colors.background.secondary};
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing.md};
  box-shadow: ${theme.shadows.lg};
  width: 300px;
  z-index: ${theme.zIndices?.tooltip || 400};
`;

const TooltipArrow = styled.div<{ position: 'top' | 'bottom' | 'left' | 'right' }>`
  position: absolute;
  width: 12px;
  height: 12px;
  background-color: ${theme.colors.background.secondary};
  transform: rotate(45deg);
  
  ${({ position }) => {
    switch (position) {
      case 'top':
        return `
          bottom: -6px;
          left: 50%;
          margin-left: -6px;
        `;
      case 'bottom':
        return `
          top: -6px;
          left: 50%;
          margin-left: -6px;
        `;
      case 'left':
        return `
          right: -6px;
          top: 50%;
          margin-top: -6px;
        `;
      case 'right':
        return `
          left: -6px;
          top: 50%;
          margin-top: -6px;
        `;
      default:
        return '';
    }
  }}
`;

const HighlightElement = styled(motion.div)`
  position: absolute;
  z-index: ${theme.zIndices?.elevated || 1};
  box-shadow: 0 0 0 4px ${theme.colors.primary};
  border-radius: ${theme.borderRadius.sm};
  pointer-events: none;
`;

const TooltipTitle = styled.h4`
  font-size: ${theme.typography.sizes.md};
  font-weight: ${theme.typography.fontWeights.bold};
  margin-bottom: ${theme.spacing.sm};
  color: ${theme.colors.text.primary};
`;

const TooltipDescription = styled.p`
  font-size: ${theme.typography.sizes.sm};
  color: ${theme.colors.text.secondary};
  margin-bottom: ${theme.spacing.md};
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
`;

const TooltipButton = styled.button<{ primary?: boolean }>`
  background-color: ${props => props.primary ? theme.colors.primary : 'transparent'};
  color: ${props => props.primary ? 'white' : theme.colors.text.secondary};
  border: ${props => props.primary ? 'none' : `1px solid ${theme.colors.text.secondary}`};
  border-radius: ${theme.borderRadius.sm};
  padding: ${theme.spacing.xs} ${theme.spacing.md};
  font-size: ${theme.typography.sizes.sm};
  cursor: pointer;
  transition: all ${theme.transitions.fast};
  
  &:hover {
    background-color: ${props => props.primary ? 
      `${theme.colors.primary}e6` : 
      'rgba(255, 255, 255, 0.1)'
    };
  }
`;

const StepIndicator = styled.div`
  display: flex;
  justify-content: center;
  margin-top: ${theme.spacing.md};
`;

const Dot = styled.div<{ active: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props => props.active ? theme.colors.primary : 'rgba(255, 255, 255, 0.3)'};
  margin: 0 4px;
  transition: background-color 0.3s ease;
`;

const getPositioning = (
  targetElement: Element,
  position: 'top' | 'bottom' | 'left' | 'right'
): { top: number; left: number } => {
  const rect = targetElement.getBoundingClientRect();
  
  switch (position) {
    case 'top':
      return {
        top: rect.top - 16 - 300, // height of tooltip
        left: rect.left + rect.width / 2 - 150, // half width of tooltip
      };
    case 'bottom':
      return {
        top: rect.bottom + 16,
        left: rect.left + rect.width / 2 - 150,
      };
    case 'left':
      return {
        top: rect.top + rect.height / 2 - 75, // half height of tooltip
        left: rect.left - 16 - 300,
      };
    case 'right':
      return {
        top: rect.top + rect.height / 2 - 75,
        left: rect.right + 16,
      };
    default:
      return { top: 0, left: 0 };
  }
};

const Tutorial: React.FC<TutorialProps> = ({ 
  steps, 
  isActive, 
  onComplete, 
  onSkip 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [highlightRect, setHighlightRect] = useState({ top: 0, left: 0, width: 0, height: 0 });
  
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };
  
  useEffect(() => {
    if (isActive && steps.length > 0) {
      const targetSelector = steps[currentStep].target;
      const targetElement = document.querySelector(targetSelector);
      
      if (targetElement) {
        const stepPosition = steps[currentStep].position || 'bottom';
        const newPosition = getPositioning(targetElement, stepPosition);
        setPosition(newPosition);
        
        const rect = targetElement.getBoundingClientRect();
        setHighlightRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });
      }
    }
  }, [currentStep, isActive, steps]);
  
  if (!isActive) return null;
  
  const currentTutorialStep = steps[currentStep];
  
  return (
    <AnimatePresence>
      <Overlay>
        <HighlightElement
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            top: highlightRect.top,
            left: highlightRect.left,
            width: highlightRect.width,
            height: highlightRect.height,
          }}
        />
        
        <TooltipContainer
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ top: position.top, left: position.left }}
        >
          <TooltipArrow position={currentTutorialStep.position || 'bottom'} />
          <TooltipTitle>{currentTutorialStep.title}</TooltipTitle>
          <TooltipDescription>{currentTutorialStep.description}</TooltipDescription>
          
          <ButtonGroup>
            <TooltipButton onClick={onSkip}>
              {currentStep === 0 ? 'Skip Tour' : 'Skip'}
            </TooltipButton>
            <TooltipButton 
              primary 
              onClick={handleNext}
            >
              {currentStep < steps.length - 1 ? 'Next' : 'Finish'}
            </TooltipButton>
          </ButtonGroup>
          
          <StepIndicator>
            {steps.map((_, index) => (
              <Dot key={index} active={index === currentStep} />
            ))}
          </StepIndicator>
        </TooltipContainer>
      </Overlay>
    </AnimatePresence>
  );
};

export default Tutorial; 