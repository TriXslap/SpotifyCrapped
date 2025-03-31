import React from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Text as RNText, Platform, Share, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

/**
 * Modern Artist Card Component
 * Displays artist information with a sleek, modern design
 */
const ArtistCard = ({
  name,
  imageUrl,
  popularity = 0,
  genres = [],
  onPress,
  spotifyUrl
}) => {
  // Function to truncate genres for display
  const formatGenres = () => {
    if (genres.length === 0) return '';
    if (genres.length <= 2) return genres.join(', ');
    return `${genres.slice(0, 2).join(', ')}...`;
  };

  const handleShare = async () => {
    try {
      // Add haptic feedback
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      
      const message = `🎵 Check out my favorite artist this month: ${name}! ${genres.length > 0 ? `\nGenre: ${formatGenres()}` : ''}\n\n${spotifyUrl || ''}`;
      
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
        {/* Artist Image with Gradient Overlay */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: imageUrl }} 
            style={styles.artistImage} 
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.imageGradient}
          />
        </View>
        
        {/* Artist Info */}
        <View style={styles.infoContainer}>
          <View style={styles.nameContainer}>
            <RNText style={styles.artistName} numberOfLines={2}>
              {name}
            </RNText>
            <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
              <Ionicons name="share-outline" size={24} color="#1DB954" />
            </TouchableOpacity>
          </View>
          
          {genres.length > 0 && (
            <RNText style={styles.artistGenres} numberOfLines={1}>
              {formatGenres()}
            </RNText>
          )}
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
  },
  imageContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  artistImage: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
  },
  infoContainer: {
    padding: 16,
  },
  nameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  artistName: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginRight: 12,
  },
  artistGenres: {
    fontSize: 16,
    color: '#1DB954',
    marginBottom: 4,
  },
  shareButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(29, 185, 84, 0.1)',
  },
});

export default ArtistCard; 