import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Alert, Switch, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { api } from '../../src/lib/api';
import { clearAuthAsync } from '../../src/store/auth.slice';
import { fetchProfile, updateProfile, linkWhatsApp, clearProfile, generateLinkCode } from '../../src/store/profile.slice';
import { resetTransactions } from '../../src/store/transactions.slice';
import { setThemeMode } from '../../src/store/settings.slice';
import { AppDispatch, RootState } from '../../src/store';
import { typography, borderRadii, spacing, useThemeColors } from '../../src/constants/theme';
import { MotiView, MotiText } from 'moti';
import { Easing } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Smartphone, Fingerprint, Coins, Ghost, Database, LogOut, Sun, Moon, ChevronRight, ChevronLeft, Check, Key, Type, Mic, Info } from 'lucide-react-native';
import { useColorScheme } from 'react-native';
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
  const themeMode = useSelector((state: RootState) => state.settings.themeMode);
  const systemScheme = useColorScheme();
  const isLightMode = themeMode === 'system' ? systemScheme === 'light' : themeMode === 'light';
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
        <ActivityIndicator size="large" color={colors.chartGreen} />
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
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

            {/* Top Section */}
            <MotiView
              from={{ translateY: -20, opacity: 0 }}
              animate={{ translateY: 0, opacity: 1 }}
              transition={{ type: 'timing', duration: 400, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }}
              style={styles.topSection}
            >
              <Text style={styles.headerTitle}>Settings</Text>
            </MotiView>

            {/* Bottom Section */}
            <MotiView
              from={{ opacity: 0, translateY: 30 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 400, delay: 100, easing: Easing.out(Easing.ease) }}
              style={styles.bottomSection}
            >
              {/* Appearance Section */}
              <Text style={styles.sectionTitle}>APPEARANCE</Text>

              <View style={styles.appearanceGrid}>
                <TouchableOpacity
                  style={[styles.appearanceCard, themeMode === 'light' && styles.appearanceCardActive]}
                  onPress={() => dispatch(setThemeMode('light'))}
                  activeOpacity={0.8}
                >
                  <Sun size={28} color="#FFFFFF" />
                  <Text style={styles.appearanceText}>Light</Text>
                  {themeMode === 'light' && <View style={styles.appearanceActiveDot} />}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.appearanceCard, themeMode === 'dark' && styles.appearanceCardActive]}
                  onPress={() => dispatch(setThemeMode('dark'))}
                  activeOpacity={0.8}
                >
                  <Moon size={28} color="#FFFFFF" />
                  <Text style={styles.appearanceText}>Dark</Text>
                  {themeMode === 'dark' && <View style={styles.appearanceActiveDot} />}
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.appearanceCard, themeMode === 'system' && styles.appearanceCardActive]}
                  onPress={() => dispatch(setThemeMode('system'))}
                  activeOpacity={0.8}
                >
                  <Smartphone size={28} color="#FFFFFF" />
                  <Text style={styles.appearanceText}>System</Text>
                  {themeMode === 'system' && <View style={styles.appearanceActiveDot} />}
                </TouchableOpacity>
              </View>

              <View style={styles.infoCard}>
                <Smartphone size={16} color="rgba(255,255,255,0.55)" style={{ marginRight: 8 }} />
                <Text style={styles.infoText}>System mode follows your device's current appearance setting.</Text>
              </View>

              {/* Account Info Section */}
              <Text style={[styles.sectionTitle, { marginTop: spacing.xxl }]}>ACCOUNT</Text>

              <View style={styles.settingsGroup}>
                {/* Name Row */}
                <View style={styles.settingRow}>
                  <User size={20} color="#8E8E93" style={{ marginRight: 12 }} />
                  <View style={styles.rowTextCol}>
                    <Text style={styles.rowTextValue}>Your name</Text>
                  </View>
                  <TextInput
                    style={styles.rowInput}
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter your name"
                    placeholderTextColor={colors.textMuted}
                    onBlur={handleSaveName}
                    textAlign="right"
                  />
                  {saving && <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 8 }} />}
                </View>

                <View style={styles.divider} />

                {/* Phone Row */}
                <TouchableOpacity style={styles.settingRow} onPress={handleGenerateLinkCode} activeOpacity={0.7}>
                  <Smartphone size={20} color="#8E8E93" style={{ marginRight: 12 }} />
                  <View style={styles.rowTextCol}>
                    <Text style={styles.rowTextValue}>WhatsApp</Text>
                  </View>
                  <Text style={profile?.phone_number ? styles.rowBadgeText : [styles.rowBadgeText, { color: colors.textMuted }]}>
                    {profile?.phone_number ? profile.phone_number : 'Not linked'}
                  </Text>
                  {phoneSaving ? <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 8 }} /> : <ChevronRight size={20} color={'rgba(255,255,255,0.3)'} style={{ marginLeft: 8 }} />}
                </TouchableOpacity>
              </View>

              {/* Settings Section */}
              <Text style={[styles.sectionTitle, { marginTop: spacing.xxl }]}>PREFERENCES</Text>

              <View style={styles.settingsGroup}>
                <View style={styles.settingRow}>
                  <Fingerprint size={20} color="#8E8E93" style={{ marginRight: 12 }} />
                  <View style={styles.rowTextCol}>
                    <Text style={styles.rowTextValue}>Allow Face ID</Text>
                  </View>
                  <CustomSwitch value={faceId} onValueChange={setFaceId} activeColor="#FFFFFF" inactiveColor="#333333" />
                </View>

                <View style={styles.divider} />

                <View style={styles.settingRow}>
                  <Coins size={20} color="#8E8E93" style={{ marginRight: 12 }} />
                  <View style={styles.rowTextCol}>
                    <Text style={styles.rowTextValue}>Show Decimals</Text>
                  </View>
                  <CustomSwitch value={showCoins} onValueChange={setShowCoins} activeColor="#FFFFFF" inactiveColor="#333333" />
                </View>

                <View style={styles.divider} />

                <View style={styles.settingRow}>
                  <Ghost size={20} color="#8E8E93" style={{ marginRight: 12 }} />
                  <View style={styles.rowTextCol}>
                    <Text style={styles.rowTextValue}>Incognito Mode</Text>
                  </View>
                  <CustomSwitch value={incognito} onValueChange={setIncognito} activeColor="#FFFFFF" inactiveColor="#333333" />
                </View>

                <View style={styles.divider} />

                <TouchableOpacity style={styles.settingRow} onPress={handleResetTransactions} activeOpacity={0.7}>
                  <Database size={20} color={colors.accentSecondary} style={{ marginRight: 12 }} />
                  <View style={styles.rowTextCol}>
                    <Text style={[styles.rowTextValue, { color: colors.accentSecondary }]}>Reset Data</Text>
                  </View>
                  {resetting && <ActivityIndicator size="small" color={colors.accentSecondary} />}
                </TouchableOpacity>
              </View>

              {/* Logout */}
              <MotiView
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ type: 'timing', delay: 300, duration: 400, easing: Easing.inOut(Easing.ease) }}
              >
                <TouchableOpacity style={styles.minimalLogoutBtn} onPress={handleLogout} activeOpacity={0.7}>
                  <LogOut size={20} color="#FF6B6B" style={{ marginRight: 8 }} />
                  <Text style={styles.minimalLogoutText}>Log Out</Text>
                </TouchableOpacity>
              </MotiView>

            </MotiView>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  center: { justifyContent: 'center', alignItems: 'center' },

  topSection: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    backgroundColor: 'transparent',
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  bottomSection: { flex: 1, marginTop: spacing.md },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: 100 },

  errorText: { color: colors.accentSecondary, ...typography.bodyLarge, marginBottom: spacing.xl, textAlign: 'center' },

  sectionTitle: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: spacing.md,
    marginLeft: spacing.sm,
  },

  appearanceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  appearanceCard: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    padding: spacing.lg,
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
    aspectRatio: 1,
  },
  appearanceCardActive: {
    borderColor: '#FFFFFF',
  },
  appearanceText: {
    ...typography.label,
    color: '#FFFFFF',
    marginTop: spacing.sm,
    fontWeight: '500',
  },
  appearanceActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    bottom: 12,
  },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    padding: spacing.lg,
  },
  infoText: {
    ...typography.bodySmall,
    color: 'rgba(255,255,255,0.55)',
    flex: 1,
    lineHeight: 20,
  },

  settingsGroup: {
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  rowTextCol: {
    flex: 1,
    justifyContent: 'center',
  },
  rowTextValue: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  rowInput: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '500',
    padding: 0,
    margin: 0,
    minWidth: 100,
  },
  rowBadgeText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: spacing.lg,
  },

  minimalLogoutBtn: {
    flexDirection: 'row',
    marginTop: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
  },
  minimalLogoutText: {
    color: '#FF6B6B',
    fontSize: 15,
    fontWeight: '600'
  },

  btnRetry: {
    backgroundColor: '#C1FFD7',
    padding: spacing.md,
    borderRadius: borderRadii.pill,
    paddingHorizontal: spacing.xl,
  },
  btnRetryText: { color: '#000000', ...typography.bodyMedium, fontWeight: '600' },
});
