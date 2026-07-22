import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '@/src/theme';

type Props = {
  size?: number;
  testID?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Instant brand mark for loading screens — pure Views, no Image/Metro asset
 * fetch. Remote Metro tunnels otherwise show a blank plate until PNG arrives.
 */
export function CozbilRobotInstant({ size = 88, testID = 'cozbil-robot', style }: Props) {
  const radius = Math.round(size * 0.22);
  const headW = size * 0.52;
  const headH = size * 0.42;
  const eyeW = size * 0.08;
  const eyeH = size * 0.16;
  const ear = size * 0.09;
  const antenna = size * 0.14;
  const tip = size * 0.08;

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
          borderRadius: radius,
        },
        style,
      ]}>
      <View style={[styles.antenna, { height: antenna, marginBottom: size * 0.02 }]}>
        <View style={[styles.antennaStem, { height: antenna * 0.7 }]} />
        <View
          style={[
            styles.antennaTip,
            { width: tip, height: tip, borderRadius: tip / 2, top: 0 },
          ]}
        />
      </View>
      <View style={styles.headRow}>
        <View
          style={[
            styles.ear,
            { width: ear, height: ear * 1.1, borderRadius: ear / 2 },
          ]}
        />
        <View
          style={[
            styles.head,
            {
              width: headW,
              height: headH,
              borderRadius: headW * 0.28,
            },
          ]}>
          <View style={styles.eyes}>
            <View
              style={[
                styles.eye,
                { width: eyeW, height: eyeH, borderRadius: eyeW / 2 },
              ]}
            />
            <View
              style={[
                styles.eye,
                { width: eyeW, height: eyeH, borderRadius: eyeW / 2 },
              ]}
            />
          </View>
        </View>
        <View
          style={[
            styles.ear,
            { width: ear, height: ear * 1.1, borderRadius: ear / 2 },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  plate: {
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  antenna: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  antennaStem: {
    width: 2,
    backgroundColor: colors.white,
  },
  antennaTip: {
    position: 'absolute',
    backgroundColor: colors.orange,
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ear: {
    backgroundColor: colors.white,
  },
  head: {
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  eyes: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  eye: {
    backgroundColor: colors.orange,
  },
});
