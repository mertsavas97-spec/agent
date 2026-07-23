import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, space, typography } from '@/src/theme';
import { hapticSelection } from '@/src/ui/haptics';

export type SegmentedTabCaptionTone = 'ready' | 'empty' | 'default';

export type SegmentedTabItem<T extends string> = {
  id: T;
  label: string;
  caption?: string;
  /** Caption color: ready=green, empty=muted gray */
  captionTone?: SegmentedTabCaptionTone;
  /** Closed / gray visual for tabs without data (still tappable) */
  muted?: boolean;
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
  /** Larger labels for home exam picker */
  prominence?: 'default' | 'strong';
};

function captionColor(
  tone: SegmentedTabCaptionTone | undefined,
  selected: boolean,
): string | undefined {
  if (tone === 'ready') {
    return selected ? colors.orangeSoft : colors.success;
  }
  if (tone === 'empty') {
    return selected ? colors.textOnDarkMuted : colors.textMuted;
  }
  return undefined;
}

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
  prominence = 'default',
}: SegmentedTabsProps<T>) {
  const strong = prominence === 'strong';
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
              onPress={() => {
                void hapticSelection();
                onChange(item.id);
              }}>
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
        const muted = Boolean(item.muted) && !selected;
        const toneColor = captionColor(item.captionTone, selected);
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
              strong && styles.segmentStrong,
              selected ? styles.segmentOn : styles.segmentOff,
              muted && styles.segmentMuted,
              selected && {
                backgroundColor: activeColor,
                borderColor: activeColor,
              },
            ]}
            onPress={() => {
              void hapticSelection();
              onChange(item.id);
            }}>
            <Text
              style={[
                styles.segmentLabel,
                compact && styles.segmentLabelCompact,
                strong && styles.segmentLabelStrong,
                compact && strong && styles.segmentLabelCompactStrong,
                selected && styles.segmentLabelOn,
                muted && styles.segmentLabelMuted,
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
                  selected && !toneColor ? styles.segmentCaptionOn : null,
                  muted && !toneColor ? styles.segmentCaptionMuted : null,
                  toneColor ? { color: toneColor, fontWeight: '700' } : null,
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
  segmentStrong: {
    minHeight: 60,
    paddingVertical: 10,
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
  segmentMuted: {
    backgroundColor: colors.track,
    borderColor: colors.borderStrong,
    opacity: 0.85,
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
  segmentLabelStrong: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 16,
    fontWeight: '800',
  },
  segmentLabelCompactStrong: {
    fontSize: 13,
  },
  segmentLabelOn: {
    color: colors.white,
  },
  segmentLabelMuted: {
    color: colors.textMuted,
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
  segmentCaptionMuted: {
    color: colors.textMuted,
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
