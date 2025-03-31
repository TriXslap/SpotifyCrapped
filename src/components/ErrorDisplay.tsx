import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
// @ts-ignore
import theme from '../styles/theme';
import Button from './Button';

const ErrorContainer = styled.div`
  background-color: ${theme.colors.background.card};
  border-radius: ${theme.borderRadius.lg};
  padding: ${theme.spacing.lg};
  margin: ${theme.spacing.lg} 0;
  box-shadow: ${theme.shadows.md};
  width: 100%;
`;

const Title = styled.h3`
  font-size: ${theme.typography.sizes.lg};
  margin-bottom: ${theme.spacing.sm};
  color: ${theme.colors.text.primary};
`;

const Description = styled.p`
  color: ${theme.colors.text.secondary};
  margin-bottom: ${theme.spacing.lg};
  font-size: ${theme.typography.sizes.sm};
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: ${theme.spacing.md};
`;

const DetailToggle = styled.button`
  background: none;
  border: none;
  color: ${theme.colors.text.secondary};
  cursor: pointer;
  font-size: ${theme.typography.sizes.sm};
  padding: 0;
`;

const ErrorDetails = styled(motion.div)`
  color: ${theme.colors.text.secondary};
  font-size: ${theme.typography.sizes.sm};
  margin-top: ${theme.spacing.md};
`;

const ErrorDisplay: React.FC<{ error: string; errorDetails?: string }> = ({ 
  error, 
  errorDetails 
}) => {
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  return (
    <ErrorContainer>
      <Title>Error</Title>
      <Description>{error}</Description>
      
      <ButtonContainer>
        <Button 
          onClick={() => window.location.href = '/'}
          variant="secondary"
        >
          Go Home
        </Button>
      </ButtonContainer>
      
      {errorDetails && (
        <>
          <DetailToggle onClick={() => setShowErrorDetails(!showErrorDetails)}>
            {showErrorDetails ? 'Hide' : 'Show'} technical details
          </DetailToggle>
          
          {showErrorDetails && (
            <ErrorDetails
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              {errorDetails}
            </ErrorDetails>
          )}
        </>
      )}
    </ErrorContainer>
  );
};

export default ErrorDisplay; 