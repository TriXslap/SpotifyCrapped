import React from 'react';
import styled, { keyframes } from 'styled-components';
// @ts-ignore
import theme from '../styles/theme';

interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: keyof typeof theme.borderRadius;
  margin?: string;
}

const shimmer = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`;

const SkeletonBase = styled.div<SkeletonProps>`
  width: ${props => props.width || '100%'};
  height: ${props => props.height || '16px'};
  border-radius: ${props => theme.borderRadius[props.borderRadius || 'md']};
  margin: ${props => props.margin || '0'};
  background: linear-gradient(
    90deg,
    ${theme.colors.background.card} 25%,
    #3a3a3a 50%,
    ${theme.colors.background.card} 75%
  );
  background-size: 200% 100%;
  animation: ${shimmer} 1.5s infinite;
`;

export const TextSkeleton = styled(SkeletonBase)`
  height: ${props => props.height || '16px'};
  margin-bottom: ${theme.spacing.sm};
`;

export const CircleSkeleton = styled(SkeletonBase)`
  width: ${props => props.width || '48px'};
  height: ${props => props.height || '48px'};
  border-radius: ${theme.borderRadius.round};
`;

export const CardSkeleton = styled(SkeletonBase)`
  height: ${props => props.height || '120px'};
  border-radius: ${theme.borderRadius.md};
`;

// Artist/Track skeleton display
export const ArtistSkeleton = () => (
  <div style={{ display: 'flex', alignItems: 'center', margin: theme.spacing.md }}>
    <CircleSkeleton width="64px" height="64px" />
    <div style={{ marginLeft: theme.spacing.md, width: '100%' }}>
      <TextSkeleton width="70%" height="20px" />
      <TextSkeleton width="40%" height="16px" />
    </div>
  </div>
);

export const TrackSkeleton = () => (
  <div style={{ display: 'flex', alignItems: 'center', margin: theme.spacing.md }}>
    <CardSkeleton width="64px" height="64px" borderRadius="sm" />
    <div style={{ marginLeft: theme.spacing.md, width: '100%' }}>
      <TextSkeleton width="60%" height="18px" />
      <TextSkeleton width="40%" height="14px" />
    </div>
  </div>
); 