import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
// @ts-ignore
import theme from '../styles/theme';
import Card from './Card';

interface TrackProps {
  id: string;
  name: string;
  artist: string;
  albumName: string;
  imageUrl: string;
  duration: number; // in milliseconds
  popularity?: number;
  preview_url?: string;
  onClick?: () => void;
}

const TrackContainer = styled(Card)`
  display: flex;
  align-items: center;
  padding: ${theme.spacing.sm};
  margin-bottom: ${theme.spacing.md};
`;

const AlbumArt = styled.div`
  width: 60px;
  height: 60px;
  border-radius: ${theme.borderRadius.sm};
  overflow: hidden;
  position: relative;
  flex-shrink: 0;
`;

const PlayButton = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  
  svg {
    width: 24px;
    height: 24px;
    fill: white;
  }
  
  ${TrackContainer}:hover & {
    opacity: 1;
  }
`;

const AlbumImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const TrackInfo = styled.div`
  margin-left: ${theme.spacing.md};
  overflow: hidden;
  flex-grow: 1;
`;

const TrackName = styled.h4`
  font-size: ${theme.typography.sizes.md};
  font-weight: ${theme.typography.fontWeights.bold};
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const TrackArtist = styled.p`
  font-size: ${theme.typography.sizes.sm};
  color: ${theme.colors.text.secondary};
  margin: ${theme.spacing.xs} 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const TrackAlbum = styled.p`
  font-size: ${theme.typography.sizes.xs};
  color: ${theme.colors.text.secondary};
  opacity: 0.8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const TrackMeta = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  margin-left: ${theme.spacing.md};
  flex-shrink: 0;
`;

const TrackDuration = styled.span`
  font-size: ${theme.typography.sizes.sm};
  color: ${theme.colors.text.secondary};
`;

const PopularityBar = styled.div<{ popularity: number }>`
  width: 50px;
  height: 3px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: ${theme.borderRadius.sm};
  margin-top: ${theme.spacing.sm};
  overflow: hidden;
  
  &::after {
    content: '';
    display: block;
    height: 100%;
    width: ${props => props.popularity}%;
    background-color: ${theme.colors.primary};
    border-radius: ${theme.borderRadius.sm};
  }
`;

const formatDuration = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

const TrackCard: React.FC<TrackProps> = ({
  name,
  artist,
  albumName,
  imageUrl,
  duration,
  popularity = 0,
  preview_url,
  onClick,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const handlePlayPreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!preview_url) return;
    
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      const audio = new Audio(preview_url);
      audio.addEventListener('ended', () => setIsPlaying(false));
      audio.play();
      
      setIsPlaying(true);
      audioRef.current = audio;
    }
  };

  return (
    <TrackContainer hoverable onClick={onClick}>
      <AlbumArt>
        <AlbumImage src={imageUrl} alt={albumName} />
        {preview_url && (
          <PlayButton 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePlayPreview}
          >
            <svg viewBox="0 0 24 24">
              <path d={isPlaying ? "M6 19h4V5H6v14zm8-14v14h4V5h-4z" : "M8 5v14l11-7z"} />
            </svg>
          </PlayButton>
        )}
      </AlbumArt>
      
      <TrackInfo>
        <TrackName>{name}</TrackName>
        <TrackArtist>{artist}</TrackArtist>
        <TrackAlbum>{albumName}</TrackAlbum>
      </TrackInfo>
      
      <TrackMeta>
        <TrackDuration>{formatDuration(duration)}</TrackDuration>
        <PopularityBar popularity={popularity} />
      </TrackMeta>
    </TrackContainer>
  );
};

export default TrackCard; 