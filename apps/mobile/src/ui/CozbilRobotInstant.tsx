import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '@/src/theme';

type Props = {
  size?: number;
  testID?: string;
  style?: StyleProp<ViewStyle>;
  /** bright = white plate / navy head for loading contrast */
  tone?: 'onNavy' | 'bright';
};

/**
 * Instant brand mark for loading screens — pure Views, no Image/Metro asset
 * fetch. Circular plate so it clips cleanly inside analyzing rings (no square bleed).
 */
export function CozbilRobotInstant({
  size = 88,
  testID = 'cozbil-robot',
  style,
  tone = 'onNavy',
}: Props) {
  const headW = size * 0.5;
  const headH = size * 0.4;
  const eyeW = size * 0.075;
  const eyeH = size * 0.15;
  const ear = size * 0.085;
  const antenna = size * 0.13;
  const tip = size * 0.075;
  const bright = tone === 'bright';
  const plateBg = bright ? colors.white : colors.navy;
  const body = bright ? colors.navy : colors.white;
  const eye = colors.orange;

  return (
    <View
      testID={testID}
      accessibilityLabel="ÇözBil"
      accessibilityRole="image"
      style={[
        styles.plate,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: plateBg,
        },
        style,
      ]}>
      <View style={[styles.antenna, { height: antenna, marginBottom: size * 0.02 }]}>
        <View style={[styles.antennaStem, { height: antenna * 0.7, backgroundColor: body }]} />
        <View
          style={[
            styles.antennaTip,
            {
              width: tip,
              height: tip,
              borderRadius: tip / 2,
              top: 0,
              backgroundColor: eye,
            },
          ]}
        />
      </View>
      <View style={styles.headRow}>
        <View
          style={[
            styles.ear,
            {
              width: ear,
              height: ear * 1.1,
              borderRadius: ear / 2,
              backgroundColor: body,
            },
          ]}
        />
        <View
          style={[
            styles.head,
            {
              width: headW,
              height: headH,
              borderRadius: headW * 0.28,
              backgroundColor: body,
            },
          ]}>
          <View style={styles.eyes}>
            <View
              style={[
                styles.eye,
                {
                  width: eyeW,
                  height: eyeH,
                  borderRadius: eyeW / 2,
                  backgroundColor: eye,
                },
              ]}
            />
            <View
              style={[
                styles.eye,
                {
                  width: eyeW,
                  height: eyeH,
                  borderRadius: eyeW / 2,
                  backgroundColor: eye,
                },
              ]}
            />
          </View>
        </View>
        <View
          style={[
            styles.ear,
            {
              width: ear,
              height: ear * 1.1,
              borderRadius: ear / 2,
              backgroundColor: body,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  plate: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  antenna: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  antennaStem: {
    width: 2,
  },
  antennaTip: {
    position: 'absolute',
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ear: {},
  head: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  eyes: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  eye: {},
});
