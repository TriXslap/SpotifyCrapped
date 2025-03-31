import React from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Text as RNText, Platform, Share, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import IconSet from './IconSet';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

/**
 * Modern Track Card Component
 * Displays track information with a sleek, contemporary design
 */
const TrackCard = ({
  name,
  artist,
  albumName,
  imageUrl,
  duration,
  popularity = 0,
  preview_url,
  onPress,
  spotifyUrl
}) => {
  // Format duration is kept for potential future use but we won't display it
  const formatDuration = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleShare = async () => {
    try {
      // Add haptic feedback
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      
      const message = `🎵 Check out my favorite track this month: "${name}" by ${artist}!\nAlbum: ${albumName}\n\n${spotifyUrl || ''}`;
      
      await Share.share({
        message,
        url: spotifyUrl
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <TouchableOpacity 
      style={styles.cardContainer}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.card}>
        <View style={styles.contentContainer}>
          {/* Album Cover with Gradient */}
          <View style={styles.imageWrapper}>
            <Image 
              source={{ uri: imageUrl }} 
              style={styles.albumArt} 
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.3)']}
              style={styles.imageGradient}
            />
          </View>
          
          {/* Track Info */}
          <View style={styles.trackInfo}>
            <View style={styles.nameContainer}>
              <RNText style={styles.trackName} numberOfLines={2}>
                {name}
              </RNText>
              <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
                <Ionicons name="share-outline" size={24} color="#1DB954" />
              </TouchableOpacity>
            </View>
            
            <RNText style={styles.artistName} numberOfLines={1}>
              {artist}
            </RNText>
            
            <RNText style={styles.albumName} numberOfLines={1}>
              {albumName}
            </RNText>
            
            {/* Duration display removed as requested */}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(18, 18, 18, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  card: {
    width: '100%',
    padding: 16,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageWrapper: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    width: 150,
    height: 150,
  },
  albumArt: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  imageGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
  },
  trackInfo: {
    flex: 1,
    marginLeft: 16,
  },
  nameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  trackName: {
    flex: 1,
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginRight: 12,
  },
  artistName: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  albumName: {
    fontSize: 16,
    color: '#1DB954',
    marginBottom: 4,
  },
  // Keeping styles but not using them
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginLeft: 4,
  },
  shareButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(29, 185, 84, 0.1)',
  },
});

export default TrackCard; 