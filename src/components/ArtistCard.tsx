import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
// @ts-ignore
import theme from '../styles/theme';
import Card from './Card';

interface ArtistProps {
  id: string;
  name: string;
  imageUrl: string;
  popularity?: number;
  genres?: string[];
  onClick?: () => void;
}

const ArtistWrapper = styled.div`
  position: relative;
`;

const ArtistContainer = styled(Card)`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  width: 100%;
  overflow: hidden;
`;

const ImageContainer = styled.div`
  position: relative;
  width: 150px;
  height: 150px;
  border-radius: ${theme.borderRadius.round};
  overflow: hidden;
  margin-bottom: ${theme.spacing.md};
`;

const ArtistImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform ${theme.transitions.default};

  ${ArtistContainer}:hover & {
    transform: scale(1.05);
  }
`;

const ArtistName = styled.h3`
  font-size: ${theme.typography.sizes.lg};
  font-weight: ${theme.typography.fontWeights.bold};
  margin-bottom: ${theme.spacing.xs};
  color: ${theme.colors.text.primary};
`;

const ArtistGenres = styled.p`
  font-size: ${theme.typography.sizes.sm};
  color: ${theme.colors.text.secondary};
  margin-bottom: ${theme.spacing.sm};
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const PopularityIndicator = styled.div<{ popularity: number }>`
  width: 80%;
  height: 4px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: ${theme.borderRadius.sm};
  margin-top: ${theme.spacing.sm};
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: ${props => props.popularity}%;
    background-color: ${theme.colors.primary};
    border-radius: ${theme.borderRadius.sm};
  }
`;

const GenreTag = styled(motion.span)`
  display: inline-block;
  background-color: rgba(255, 255, 255, 0.1);
  color: ${theme.colors.text.secondary};
  font-size: ${theme.typography.sizes.xs};
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.sm};
  margin-right: ${theme.spacing.xs};
  margin-bottom: ${theme.spacing.xs};
`;

const GenreContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  max-height: 0;
  overflow: hidden;
  transition: max-height ${theme.transitions.default};

  ${ArtistContainer}:hover & {
    max-height: 100px;
  }
`;

const ArtistCard: React.FC<ArtistProps> = ({
  name,
  imageUrl,
  popularity = 0,
  genres = [],
  onClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <ArtistWrapper
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <ArtistContainer
        hoverable
        onClick={onClick}
      >
        <ImageContainer>
          <ArtistImage src={imageUrl} alt={name} />
        </ImageContainer>
        <ArtistName>{name}</ArtistName>
        <ArtistGenres>
          {genres.slice(0, 2).join(', ')}
          {genres.length > 2 && '...'}
        </ArtistGenres>
        <PopularityIndicator popularity={popularity} />
        
        <AnimatePresence>
          {isHovered && (
            <GenreContainer>
              {genres.slice(0, 4).map((genre, index) => (
                <GenreTag
                  key={genre}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {genre}
                </GenreTag>
              ))}
            </GenreContainer>
          )}
        </AnimatePresence>
      </ArtistContainer>
    </ArtistWrapper>
  );
};

export default ArtistCard; 