import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { EXAM_LABEL } from '@/src/features/exam/examLabels';
import type { ExamType } from '@/src/lib/api/types';
import { TR_EYEBROW } from '@/src/lib/trCase';
import { colors, radii, shadows, space, typography } from '@/src/theme';
import { Eyebrow } from '@/src/ui/Eyebrow';

export type ProfilePanelProps = {
  examType: ExamType | null;
  quotaLabel: string;
  consentLabel: string;
  catalogCount: number;
  deleteRequested: boolean;
  isPremium: boolean;
  planLabel: string;
  onSignOut: () => void;
  onRequestDelete: () => void;
  onOpenPremium: () => void;
  onOpenSettings: () => void;
};

export function ProfilePanel({
  examType,
  quotaLabel,
  consentLabel,
  catalogCount,
  deleteRequested,
  isPremium,
  planLabel,
  onSignOut,
  onRequestDelete,
  onOpenPremium,
  onOpenSettings,
}: ProfilePanelProps) {
  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.container}
      testID="profile-screen"
      showsVerticalScrollIndicator={false}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Eyebrow>{TR_EYEBROW.profile}</Eyebrow>
          <Text style={styles.title}>Profil</Text>
        </View>
        <Pressable
          testID="profile-settings-btn"
          accessibilityRole="button"
          accessibilityLabel="Ayarlar"
          style={styles.settingsBtn}
          onPress={onOpenSettings}>
          <Text style={styles.settingsLabel}>Ayarlar</Text>
        </Pressable>
      </View>

      <Pressable
        testID="profile-premium-card"
        style={[styles.premiumCard, isPremium && styles.premiumCardOn]}
        onPress={onOpenPremium}>
        <Text style={styles.premiumKicker}>
          {isPremium ? 'PREMİUM AKTİF' : 'ÇÖZBİL PREMİUM'}
        </Text>
        <Text style={styles.premiumTitle}>
          {isPremium ? planLabel : 'Sınırsız çözüm · reklamsız odak'}
        </Text>
        <Text style={styles.premiumBody}>
          {isPremium
            ? 'Planını yönet veya yıllık indirimi incele.'
            : 'Yıllıkta %40 indirim · ayda ≈23 TL. Hak bitmesin.'}
        </Text>
        <Text style={styles.premiumCta}>
          {isPremium ? 'Planı gör →' : 'Premium’a geç →'}
        </Text>
      </Pressable>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Aktif sınav</Text>
        <Text style={styles.meta} testID="profile-exam">
          {examType ? EXAM_LABEL[examType] : 'Henüz seçilmedi'}
        </Text>
        <Text style={styles.note}>
          Paket değiştirmek için Ayarlar’a git. Ücretsiz planda her geçişte bir
          reklam izlenir.
        </Text>
        <Pressable
          testID="profile-change-exam"
          style={styles.linkRow}
          onPress={onOpenSettings}>
          <Text style={styles.linkLabel}>Sınav paketini değiştir</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Hesap özeti</Text>
        <Text style={styles.meta} testID="profile-quota">
          Bugünkü kalan hak: {quotaLabel}
        </Text>
        <Text style={styles.meta} testID="profile-consent">
          KVKK / onay: {consentLabel}
        </Text>
        <Text style={styles.meta} testID="topic-catalog-count">
          Konu kataloğu: {catalogCount} başlık
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Hızlı bağlantılar</Text>
        <Pressable
          style={styles.linkRow}
          onPress={onOpenSettings}
          testID="profile-open-settings">
          <Text style={styles.linkLabel}>Ayarlar · bildirimler · hukuki</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
        <Pressable
          style={styles.linkRow}
          onPress={onOpenPremium}
          testID="profile-open-premium">
          <Text style={styles.linkLabel}>Premium planlar</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      </View>

      <Pressable
        testID="profile-sign-out"
        accessibilityRole="button"
        style={styles.secondaryBtn}
        onPress={onSignOut}>
        <Text style={styles.secondaryLabel}>Çıkış yap</Text>
      </Pressable>

      {deleteRequested ? (
        <Text style={styles.deleteFlag} testID="profile-delete-pending">
          Veri silme talebin alındı. İşlem tamamlanınca hesabın kapatılacak.
        </Text>
      ) : (
        <Pressable
          testID="profile-delete-request"
          accessibilityRole="button"
          style={styles.dangerBtn}
          onPress={onRequestDelete}>
          <Text style={styles.dangerLabel}>Veri silme talebi</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  container: {
    padding: space.lg,
    paddingBottom: space.xl * 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: space.md,
  },
  title: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 28,
    fontWeight: '700',
    color: colors.navy,
  },
  settingsBtn: {
    backgroundColor: colors.navy,
    borderRadius: radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 4,
  },
  settingsLabel: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },
  premiumCard: {
    backgroundColor: colors.navy,
    borderRadius: radii.xl,
    padding: space.lg,
    marginBottom: space.md,
    ...shadows.soft,
  },
  premiumCardOn: {
    borderWidth: 2,
    borderColor: colors.orange,
  },
  premiumKicker: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: colors.orange,
    marginBottom: 6,
  },
  premiumTitle: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 6,
  },
  premiumBody: {
    fontFamily: typography.fontFamily,
    fontSize: 14,
    lineHeight: 20,
    color: '#CBD5E1',
    marginBottom: space.sm,
  },
  premiumCta: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 14,
    fontWeight: '700',
    color: colors.orange,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: space.md,
    marginBottom: space.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 16,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: space.sm,
  },
  meta: {
    fontFamily: typography.fontFamily,
    color: colors.textSecondary,
    marginBottom: space.sm,
    fontSize: 14,
  },
  note: {
    marginTop: space.sm,
    marginBottom: space.sm,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: typography.fontFamily,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  linkLabel: {
    fontFamily: typography.fontFamilyMedium,
    fontSize: 15,
    color: colors.navy,
  },
  chevron: { fontSize: 22, color: colors.navy },
  secondaryBtn: {
    borderWidth: 1.5,
    borderColor: colors.navy,
    borderRadius: radii.lg,
    paddingVertical: space.md,
    alignItems: 'center',
    marginBottom: space.md,
    backgroundColor: colors.white,
  },
  secondaryLabel: {
    color: colors.navy,
    fontWeight: '700',
    fontFamily: typography.fontFamilySemiBold,
  },
  dangerBtn: {
    borderWidth: 1.5,
    borderColor: colors.danger,
    borderRadius: radii.lg,
    paddingVertical: space.md,
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  dangerLabel: {
    color: colors.danger,
    fontWeight: '700',
    fontFamily: typography.fontFamilySemiBold,
  },
  deleteFlag: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: typography.fontFamily,
  },
});
