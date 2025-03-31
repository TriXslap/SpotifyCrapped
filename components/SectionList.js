import React from 'react';
import { View, SectionList as RNSectionList, StyleSheet, TouchableOpacity, Text as RNText } from 'react-native';
import IconSet from './IconSet';

/**
 * Simplified SectionList component
 * Displays data in categorized sections with headers
 */
const SectionList = ({
  sections,
  renderItem,
  keyExtractor,
  stickySectionHeadersEnabled = true,
  showSectionHeaderRight = false,
  onSectionHeaderRightPress,
  headerRightIcon = "chevron-forward",
  ListEmptyComponent,
  ListHeaderComponent,
  ListFooterComponent,
  sectionHeaderStyle,
  contentContainerStyle,
}) => {
  
  // Render section header with optional right action
  const renderSectionHeader = ({ section }) => (
    <View style={[styles.sectionHeader, sectionHeaderStyle]}>
      <View style={styles.sectionHeaderContent}>
        <RNText style={styles.sectionTitle}>
          {section.title}
        </RNText>
        
        {section.subtitle && (
          <RNText style={styles.sectionSubtitle}>
            {section.subtitle}
          </RNText>
        )}
      </View>
      
      {showSectionHeaderRight && (
        <TouchableOpacity
          style={styles.sectionHeaderRight}
          onPress={() => onSectionHeaderRightPress && onSectionHeaderRightPress(section)}
        >
          <RNText style={styles.sectionHeaderRightText}>
            {section.actionText || "See All"}
          </RNText>
          <IconSet 
            name={headerRightIcon} 
            size={16} 
            color="#1DB954"
          />
        </TouchableOpacity>
      )}
    </View>
  );
  
  return (
    <RNSectionList
      sections={sections}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
      stickySectionHeadersEnabled={stickySectionHeadersEnabled}
      ListEmptyComponent={ListEmptyComponent || (
        <View style={styles.emptyContainer}>
          <RNText style={styles.emptyText}>
            No items to display
          </RNText>
        </View>
      )}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
    />
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#121212',
  },
  sectionHeaderContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  sectionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionHeaderRightText: {
    fontSize: 14,
    color: '#1DB954',
    marginRight: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  }
});

export default SectionList; 