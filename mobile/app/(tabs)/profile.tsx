import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Alert, Switch, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { api } from '../../src/lib/api';
import { clearAuthAsync } from '../../src/store/auth.slice';
import { fetchProfile, updateProfile, linkWhatsApp, clearProfile, generateLinkCode } from '../../src/store/profile.slice';
import { resetTransactions } from '../../src/store/transactions.slice';
import { setLightMode } from '../../src/store/settings.slice';
import { AppDispatch, RootState } from '../../src/store';
import { typography, borderRadii, spacing, useThemeColors } from '../../src/constants/theme';
import { MotiView, MotiText } from 'moti';
import { Easing } from 'react-native-reanimated';
import { User, Smartphone, Fingerprint, Coins, Ghost, Database, LogOut, Sun, Moon, ChevronRight } from 'lucide-react-native';
import { useAlert } from '../../src/contexts/AlertContext';

const CustomSwitch = ({ value, onValueChange, activeColor, inactiveColor }: any) => {
  return (
    <TouchableOpacity 
      activeOpacity={0.8} 
      onPress={() => onValueChange(!value)}
      style={{
        width: 52,
        height: 30,
        borderRadius: 15,
        backgroundColor: value ? activeColor : inactiveColor,
        justifyContent: 'center',
        paddingHorizontal: 3,
        borderWidth: 1,
        borderColor: value ? activeColor : 'rgba(150, 150, 150, 0.2)',
      }}
    >
      <MotiView
        animate={{
          translateX: value ? 22 : 0,
        }}
        transition={{
          type: 'timing',
          duration: 250,
          easing: Easing.out(Easing.ease)
        }}
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: '#FFFFFF',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 2,
          elevation: 2,
        }}
      />
    </TouchableOpacity>
  );
};

export default function ProfileScreen() {
  const colors = useThemeColors();
  const styles = getStyles(colors);
  const dispatch = useDispatch<AppDispatch>();
  const isLightMode = useSelector((state: RootState) => state.settings.isLightMode);
  const { data: profile, loading, error: fetchError } = useSelector((state: RootState) => state.profile);
  const { showAlert } = useAlert();
  
  const [name, setName] = useState(profile?.name || '');
  const [phone, setPhone] = useState(profile?.phone_number || '');
  const [saving, setSaving] = useState(false);
  const [phoneSaving, setPhoneSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Switches for the new UI
  const [faceId, setFaceId] = useState(true);
  const [showCoins, setShowCoins] = useState(false);
  const [incognito, setIncognito] = useState(false);

  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  // Sync local state when profile changes
  useEffect(() => {
    if (profile?.name) setName(profile.name);
    if (profile?.phone_number) setPhone(profile.phone_number);
  }, [profile]);

  const handleSaveName = async () => {
    setSaving(true);
    try {
      await dispatch(updateProfile({ name })).unwrap();
      showAlert('Success', 'Name updated successfully!');
    } catch (e: any) {
      showAlert('Error', e.message || 'Failed to update name');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateLinkCode = async () => {
    if (!profile?.id) return;
    setPhoneSaving(true);
    try {
      const code = await dispatch(generateLinkCode(profile.id)).unwrap();
      showAlert(
        "Link WhatsApp",
        `Send the following code to our WhatsApp bot:\n\n${code}\n\nYour account will be linked automatically.`
      );
    } catch (e: any) {
      showAlert('Error', e.message || 'Failed to generate link code');
    } finally {
      setPhoneSaving(false);
    }
  };


  const handleResetTransactions = () => {
    showAlert(
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
              await dispatch(resetTransactions()).unwrap();
              showAlert('Reset Complete', 'Transactions reset.');
            } catch (e: any) {
              showAlert('Error', e.message || 'Failed to reset.');
            } finally {
              setResetting(false);
            }
          }
        }
      ]
    );
  };

  const handleLogout = async () => {
    dispatch(clearProfile());
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
        <TouchableOpacity style={styles.btnRetry} onPress={() => dispatch(fetchProfile())}>
          <Text style={styles.btnRetryText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Top Section */}
          <MotiView 
            from={{ translateY: -50, opacity: 0 }}
            animate={{ translateY: 0, opacity: 1 }}
            transition={{ type: 'timing', duration: 400, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }}
            style={styles.topSection}
          >
            <Text style={styles.headerTitle}>My account</Text>
            
            <View style={styles.profileInfoContainer}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>
            </View>
          </MotiView>

          {/* Bottom Section */}
          <MotiView 
            from={{ opacity: 0, translateY: 50 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 100, easing: Easing.out(Easing.ease) }}
            style={styles.bottomSection}
          >
            {/* Personal Info Section */}
            <Text style={styles.sectionTitle}>Personal info</Text>
            
            <View style={styles.settingsGroup}>
              {/* Name Row */}
              <View style={styles.settingRow}>
                <User size={24} color={colors.primary} style={styles.rowIcon} />
                <View style={styles.rowTextCol}>
                  <Text style={styles.rowSubLabel}>Your name</Text>
                  <TextInput
                    style={styles.rowInput}
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter your name"
                    placeholderTextColor={colors.textMuted}
                    onBlur={handleSaveName}
                  />
                </View>
                {saving ? <ActivityIndicator size="small" color={colors.primary} /> : <ChevronRight size={20} color={colors.textMuted} />}
              </View>

              {/* Phone Row */}
              <TouchableOpacity style={styles.settingRow} onPress={handleGenerateLinkCode}>
                <Smartphone size={24} color={colors.primary} style={styles.rowIcon} />
                <View style={styles.rowTextCol}>
                  <Text style={styles.rowSubLabel}>WhatsApp Number</Text>
                  <Text style={profile?.phone_number ? styles.rowTextValue : [styles.rowTextValue, { color: colors.textMuted }]}>
                    {profile?.phone_number ? profile.phone_number : 'Not linked (Tap to link)'}
                  </Text>
                </View>
                {phoneSaving ? <ActivityIndicator size="small" color={colors.primary} /> : <View style={styles.actionBtn}><Text style={styles.actionBtnText}>Link</Text></View>}
              </TouchableOpacity>
            </View>

            {/* Settings Section */}
            <Text style={styles.sectionTitle}>Settings</Text>
            
            <View style={styles.settingsGroup}>
              <View style={styles.settingRow}>
                <Fingerprint size={24} color={colors.primary} style={styles.rowIcon} />
                <View style={styles.rowTextCol}>
                  <Text style={styles.rowTextValue}>Allow Face ID</Text>
                  <Text style={styles.rowSubLabel}>Biometric login</Text>
                </View>
                <CustomSwitch value={faceId} onValueChange={setFaceId} activeColor={colors.accent} inactiveColor={colors.cardLight} />
              </View>

              <View style={styles.settingRow}>
                <Coins size={24} color={colors.primary} style={styles.rowIcon} />
                <View style={styles.rowTextCol}>
                  <Text style={styles.rowTextValue}>Show Decimals</Text>
                  <Text style={styles.rowSubLabel}>Display cents</Text>
                </View>
                <CustomSwitch value={showCoins} onValueChange={setShowCoins} activeColor={colors.accent} inactiveColor={colors.cardLight} />
              </View>

              <View style={styles.settingRow}>
                <Ghost size={24} color={colors.primary} style={styles.rowIcon} />
                <View style={styles.rowTextCol}>
                  <Text style={styles.rowTextValue}>Incognito Mode</Text>
                  <Text style={styles.rowSubLabel}>Hide balances</Text>
                </View>
                <CustomSwitch value={incognito} onValueChange={setIncognito} activeColor={colors.accent} inactiveColor={colors.cardLight} />
              </View>

              <View style={styles.settingRow}>
                {isLightMode ? (
                  <Sun size={24} color={colors.primary} style={styles.rowIcon} />
                ) : (
                  <Moon size={24} color={colors.primary} style={styles.rowIcon} />
                )}
                <View style={styles.rowTextCol}>
                  <Text style={styles.rowTextValue}>Light Mode</Text>
                  <Text style={styles.rowSubLabel}>Toggle theme</Text>
                </View>
                <CustomSwitch value={isLightMode} onValueChange={(val: boolean) => dispatch(setLightMode(val))} activeColor={colors.accent} inactiveColor={colors.cardLight} />
              </View>
              
              <View style={styles.divider} />
              
              <TouchableOpacity style={styles.settingRow} onPress={handleResetTransactions}>
                <Database size={24} color={colors.accentSecondary} style={styles.rowIcon} />
                <View style={styles.rowTextCol}>
                  <Text style={[styles.rowTextValue, { color: colors.accentSecondary }]}>Reset Data</Text>
                  <Text style={styles.rowSubLabel}>Delete all transactions</Text>
                </View>
                {resetting ? <ActivityIndicator size="small" color={colors.accentSecondary} /> : <View style={[styles.actionBtn, {backgroundColor: 'rgba(255, 107, 107, 0.15)'}]}><Text style={[styles.actionBtnText, {color: colors.accentSecondary}]}>Reset</Text></View>}
              </TouchableOpacity>
            </View>

            {/* Logout */}
            <MotiView
               from={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ type: 'timing', delay: 300, duration: 400, easing: Easing.inOut(Easing.ease) }}
            >
              <TouchableOpacity style={styles.minimalLogoutBtn} onPress={handleLogout}>
                <LogOut size={20} color={colors.textMuted} style={{marginRight: 8}} />
                <Text style={styles.minimalLogoutText}>Log Out</Text>
              </TouchableOpacity>
            </MotiView>

          </MotiView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.secondary },
  center: { justifyContent: 'center', alignItems: 'center' },
  
  topSection: { 
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.secondary,
  },
  headerTitle: { ...typography.bodyLarge, color: colors.primary, fontWeight: '600', marginBottom: spacing.xl },
  
  profileInfoContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.accentSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarText: {
    ...typography.heading2,
    color: colors.primary,
  },
  editBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: colors.cardDark,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.secondary,
  },

  bottomSection: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  
  errorText: { color: colors.accentSecondary, ...typography.bodyLarge, marginBottom: spacing.xl, textAlign: 'center' },
  
  sectionTitle: {
    ...typography.label,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },

  settingsGroup: {
    backgroundColor: colors.secondary,
    borderRadius: borderRadii.lg,
    borderWidth: 1,
    borderColor: colors.cardDark,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  rowIcon: {
    marginRight: spacing.md,
  },
  rowTextCol: {
    flex: 1,
    justifyContent: 'center',
  },
  rowSubLabel: {
    ...typography.label,
    color: colors.textMuted,
    marginBottom: 4,
    fontWeight: '500',
  },
  rowTextValue: {
    ...typography.bodyMedium,
    color: colors.primary,
    fontWeight: '500',
  },
  rowInput: {
    ...typography.bodyMedium,
    color: colors.primary,
    fontWeight: '500',
    padding: 0,
    margin: 0,
  },
  divider: {
    height: 1,
    backgroundColor: colors.cardDark,
    marginLeft: 50,
  },
  
  minimalLogoutBtn: {
    marginTop: spacing.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
  },
  minimalLogoutText: { 
    color: colors.textMuted, 
    ...typography.bodyMedium, 
    fontWeight: '600'
  },

  actionBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: borderRadii.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    ...typography.label,
    color: colors.secondary,
    fontWeight: '700',
  },

  btnRetry: {
    backgroundColor: colors.accent,
    padding: spacing.md,
    borderRadius: borderRadii.pill,
    paddingHorizontal: spacing.xl,
  },
  btnRetryText: { color: colors.secondary, ...typography.bodyMedium, fontWeight: '600' },
});
