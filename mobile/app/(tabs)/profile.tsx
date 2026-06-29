import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import { api } from '../../src/lib/api';
import { clearAuthAsync } from '../../src/store/auth.slice';
import { AppDispatch } from '../../src/store';
import { colors, typography, borderRadii, spacing } from '../../src/constants/theme';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [phoneSaving, setPhoneSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await api.get('/users/me');
      setProfile(res.data.data);
      if (res.data.data?.name) setName(res.data.data.name);
      if (res.data.data?.phone_number) setPhone(res.data.data.phone_number);
    } catch (e: any) {
      console.log('Failed to fetch profile', e);
      setFetchError(e.response?.data?.error || e.message || 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveName = async () => {
    setSaving(true);
    try {
      await api.patch('/users/me', { name });
      alert('Name updated successfully!');
      fetchProfile();
    } catch (e) {
      alert('Failed to update name');
    } finally {
      setSaving(false);
    }
  };

  const handleLinkPhone = async () => {
    if (!phone) {
      alert('Please enter a valid phone number');
      return;
    }
    setPhoneSaving(true);
    try {
      await api.post('/auth/link-phone', { userId: profile?.id, phoneNumber: phone });
      alert('WhatsApp Number linked successfully!');
      fetchProfile();
    } catch (e: any) {
      alert(e.response?.data?.error || 'Failed to link phone number');
    } finally {
      setPhoneSaving(false);
    }
  };

  const handleResetTransactions = () => {
    Alert.alert(
      "Reset Transactions",
      "Delete ALL your transactions? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Reset", 
          style: "destructive",
          onPress: async () => {
            setResetting(true);
            try {
              await api.delete('/transactions/reset');
              alert('Transactions reset.');
            } catch (e) {
              alert('Failed to reset.');
            } finally {
              setResetting(false);
            }
          }
        }
      ]
    );
  };

  const handleLogout = async () => {
    await dispatch(clearAuthAsync());
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </SafeAreaView>
    );
  }

  if (fetchError) {
    return (
      <SafeAreaView style={[styles.container, styles.center, { padding: spacing.xl }]}>
        <Text style={styles.errorText}>{fetchError}</Text>
        <TouchableOpacity style={styles.btnRetry} onPress={fetchProfile}>
          <Text style={styles.btnRetryText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      
      {/* Top Green Section */}
      <View style={styles.topSection}>
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Profile</Text>
          </View>
          
          <View style={styles.profileInfoContainer}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
            <Text style={styles.profileName}>{profile?.name || 'User'}</Text>
            <Text style={styles.profilePhone}>{profile?.phone_number || profile?.email || 'No contact info'}</Text>
          </View>
        </SafeAreaView>
      </View>

      {/* Bottom Black Section */}
      <View style={styles.bottomSection}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Combined Settings Group */}
          <View style={styles.settingsGroup}>
            
            {/* Name Row */}
            <View style={styles.settingRow}>
              <Text style={styles.rowLabel}>Name</Text>
              <View style={styles.rowInputArea}>
                <TextInput
                  style={styles.inlineInput}
                  value={name}
                  onChangeText={setName}
                  placeholder="Your name"
                  placeholderTextColor={colors.textMuted}
                />
                <TouchableOpacity onPress={handleSaveName} disabled={saving} style={styles.inlineActionBtn}>
                  <Text style={styles.inlineActionText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.divider} />

            {/* WhatsApp Row */}
            <View style={styles.settingRow}>
              <Text style={styles.rowLabel}>WhatsApp</Text>
              <View style={styles.rowInputArea}>
                <TextInput
                  style={styles.inlineInput}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Enter ID"
                  placeholderTextColor={colors.textMuted}
                />
                <TouchableOpacity onPress={handleLinkPhone} disabled={phoneSaving} style={styles.inlineActionBtn}>
                  <Text style={styles.inlineActionText}>Link</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Reset Row */}
            <View style={styles.settingRow}>
              <Text style={styles.rowLabel}>Data</Text>
              <View style={[styles.rowInputArea, { justifyContent: 'flex-end' }]}>
                <TouchableOpacity onPress={handleResetTransactions} disabled={resetting}>
                  <Text style={styles.dangerActionText}>Reset Transactions</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Minimal Logout */}
          <TouchableOpacity style={styles.minimalLogoutBtn} onPress={handleLogout}>
            <Text style={styles.minimalLogoutText}>Log Out</Text>
          </TouchableOpacity>

        </ScrollView>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.secondary },
  center: { justifyContent: 'center', alignItems: 'center' },
  
  topSection: { 
    backgroundColor: colors.accent, 
    borderBottomLeftRadius: borderRadii.xl,
    borderBottomRightRadius: borderRadii.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  header: { marginTop: spacing.md, marginBottom: spacing.md },
  headerTitle: { ...typography.bodyLarge, color: colors.secondary, fontWeight: 'bold' },
  
  profileInfoContainer: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: {
    ...typography.heading2,
    color: colors.primary,
  },
  profileName: {
    ...typography.heading3,
    color: colors.secondary,
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  profilePhone: {
    ...typography.bodyMedium,
    color: 'rgba(0,0,0,0.6)',
  },

  bottomSection: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingTop: spacing.xl, paddingBottom: 160 },
  
  errorText: { color: colors.accentSecondary, ...typography.bodyLarge, marginBottom: spacing.xl, textAlign: 'center' },
  
  // Combined Settings Group
  settingsGroup: {
    backgroundColor: colors.cardDark,
    borderRadius: borderRadii.lg,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 56,
  },
  rowLabel: {
    ...typography.bodyMedium,
    color: colors.primary,
    fontWeight: '500',
    width: 80,
  },
  rowInputArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  inlineInput: {
    flex: 1,
    ...typography.bodyMedium,
    color: colors.textMuted,
    textAlign: 'right',
    padding: 0,
    marginRight: spacing.md,
  },
  inlineActionBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadii.sm,
  },
  inlineActionText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
  },
  dangerActionText: {
    ...typography.bodyMedium,
    color: colors.accentSecondary,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginLeft: spacing.lg,
  },
  
  // Minimal Logout
  minimalLogoutBtn: {
    marginTop: spacing.xl,
    alignItems: 'center',
    padding: spacing.sm,
  },
  minimalLogoutText: { 
    color: colors.textMuted, 
    ...typography.bodyMedium, 
  },

  btnRetry: {
    backgroundColor: colors.accent,
    padding: spacing.md,
    borderRadius: borderRadii.pill,
    paddingHorizontal: spacing.xl,
  },
  btnRetryText: { color: colors.secondary, ...typography.bodyMedium, fontWeight: '600' },
});
