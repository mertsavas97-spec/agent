import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, space, typography } from '@/src/theme';

export type SegmentedTabItem<T extends string> = {
  id: T;
  label: string;
  caption?: string;
};

export type SegmentedTabsProps<T extends string> = {
  items: SegmentedTabItem<T>[];
  value: T | null;
  onChange: (id: T) => void;
  disabled?: boolean;
  testID?: string;
  itemTestIDPrefix?: string;
  variant?: 'track' | 'chips';
  /** Selected fill (track variant) */
  activeColor?: string;
  /** Selected underline / chip accent */
  accentColor?: string;
};

/**
 * Segmented control — selected: navy fill + white text + orange bar.
 * Unselected: white cell, navy text, visible border (reads as tappable tabs).
 */
export function SegmentedTabs<T extends string>({
  items,
  value,
  onChange,
  disabled,
  testID,
  itemTestIDPrefix = 'segment',
  variant = 'track',
  activeColor = colors.navy,
  accentColor = colors.orange,
}: SegmentedTabsProps<T>) {
  if (variant === 'chips') {
    return (
      <View style={styles.chipsRow} testID={testID} accessibilityRole="toolbar">
        {items.map((item) => {
          const selected = value === item.id;
          return (
            <Pressable
              key={item.id}
              testID={`${itemTestIDPrefix}-${item.id}`}
              accessibilityRole="button"
              accessibilityState={{ selected, disabled: Boolean(disabled) }}
              disabled={disabled}
              style={[
                styles.chip,
                selected && styles.chipOn,
                selected && {
                  borderColor: accentColor,
                  backgroundColor: `${accentColor}22`,
                },
              ]}
              onPress={() => onChange(item.id)}>
              <Text
                style={[
                  styles.chipLabel,
                  selected && styles.chipLabelOn,
                  selected && { color: activeColor },
                ]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  const compact = items.length >= 4;

  return (
    <View style={styles.track} testID={testID} accessibilityRole="toolbar">
      {items.map((item) => {
        const selected = value === item.id;
        return (
          <Pressable
            key={item.id}
            testID={`${itemTestIDPrefix}-${item.id}`}
            accessibilityRole="button"
            accessibilityState={{ selected, disabled: Boolean(disabled) }}
            disabled={disabled}
            style={[
              styles.segment,
              compact && styles.segmentCompact,
              selected ? styles.segmentOn : styles.segmentOff,
              selected && {
                backgroundColor: activeColor,
                borderColor: activeColor,
              },
            ]}
            onPress={() => onChange(item.id)}>
            <Text
              style={[
                styles.segmentLabel,
                compact && styles.segmentLabelCompact,
                selected && styles.segmentLabelOn,
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}>
              {item.label}
            </Text>
            {item.caption ? (
              <Text
                style={[
                  styles.segmentCaption,
                  compact && styles.segmentCaptionCompact,
                  selected && styles.segmentCaptionOn,
                ]}
                numberOfLines={1}>
                {item.caption}
              </Text>
            ) : null}
            {selected ? (
              <View style={[styles.accent, { backgroundColor: accentColor }]} />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: colors.navySoft,
    borderRadius: radii.lg,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: radii.md,
    minHeight: 58,
    position: 'relative',
    overflow: 'hidden',
  },
  segmentCompact: {
    paddingVertical: 8,
    paddingHorizontal: 2,
    minHeight: 54,
  },
  segmentOff: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segmentOn: {
    backgroundColor: colors.navy,
    borderWidth: 1,
    borderColor: colors.navy,
  },
  segmentLabel: {
    fontFamily: typography.fontFamily,
    fontWeight: '700',
    fontSize: 15,
    color: colors.navy,
  },
  segmentLabelCompact: {
    fontSize: 12,
  },
  segmentLabelOn: {
    color: colors.white,
  },
  segmentCaption: {
    fontFamily: typography.fontFamily,
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 2,
  },
  segmentCaptionCompact: {
    fontSize: 9,
  },
  segmentCaptionOn: {
    color: 'rgba(255,255,255,0.85)',
  },
  accent: {
    position: 'absolute',
    bottom: 0,
    left: '18%',
    right: '18%',
    height: 3,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    backgroundColor: colors.orange,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  chip: {
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space.md,
    paddingVertical: 8,
    backgroundColor: colors.white,
  },
  chipOn: {
    borderColor: colors.orange,
    backgroundColor: colors.orangeSoft,
  },
  chipLabel: {
    fontFamily: typography.fontFamily,
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  chipLabelOn: {
    color: colors.navy,
    fontWeight: '700',
  },
});
