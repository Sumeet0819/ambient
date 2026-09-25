import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import { api } from '../../src/lib/api';
import { setAuthAsync } from '../../src/store/auth.slice';
import { AppDispatch } from '../../src/store';
import { typography, borderRadii, spacing, useThemeColors } from '../../src/constants/theme';
import { ChevronRight } from 'lucide-react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';

export default function RegisterScreen() {
  const colors = useThemeColors();
  const styles = getStyles(colors);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const handleRegister = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/register', { email, password });
      const { token, userId } = response.data;
      
      // Save auth state, the RootLayout will automatically redirect to (tabs)
      await dispatch(setAuthAsync({ token, userId }));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#161616', '#0A0A0A']}
        style={StyleSheet.absoluteFill}
      />
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 500 }}
        style={styles.content}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to start saving</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={(t) => { setEmail(t); setError(''); }}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            value={password}
            onChangeText={(t) => { setPassword(t); setError(''); }}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={colors.secondary} />
            ) : (
              <>
                <Text style={styles.buttonText}>Register</Text>
                <ChevronRight color={colors.secondary} size={20} style={{ marginLeft: 8 }} />
              </>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => router.back()} style={styles.linkButton}>
          <Text style={styles.linkText}>Already have an account? <Text style={{ color: colors.chartGreen, fontWeight: 'bold' }}>Login</Text></Text>
        </TouchableOpacity>

      </MotiView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.mode === 'light' ? colors.background : '#0A0A0A' },
  content: { flex: 1, padding: spacing.xl, justifyContent: 'center' },
  
  header: { marginBottom: spacing.xxl },
  title: { ...typography.heading1, color: colors.mode === 'light' ? colors.text : '#FFFFFF', marginBottom: spacing.sm, fontWeight: '700', letterSpacing: -1 },
  subtitle: { ...typography.bodyLarge, color: colors.mode === 'light' ? colors.textMuted : 'rgba(255,255,255,0.55)' },
  
  form: { 
    marginBottom: spacing.xl,
    backgroundColor: colors.mode === 'light' ? colors.cardDark : '#141414',
    padding: spacing.xl,
    borderRadius: borderRadii.xl,
    borderWidth: 1,
    borderColor: colors.mode === 'light' ? colors.borderLight : 'rgba(255,255,255,0.07)',
  },
  input: {
    backgroundColor: colors.mode === 'light' ? colors.surface : '#0A0A0A',
    borderRadius: borderRadii.md,
    padding: spacing.lg,
    ...typography.bodyLarge,
    color: colors.mode === 'light' ? colors.text : '#FFFFFF',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.mode === 'light' ? colors.border : 'rgba(255,255,255,0.1)',
  },
  
  error: { color: colors.accentSecondary, marginBottom: spacing.md, textAlign: 'center', ...typography.bodyMedium },
  
  button: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: borderRadii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  buttonText: { color: colors.mode === 'light' ? '#FFFFFF' : '#000000', ...typography.bodyLarge, fontWeight: '700' },
  
  linkButton: { marginTop: spacing.lg, alignItems: 'center' },
  linkText: { color: colors.mode === 'light' ? colors.textMuted : 'rgba(255,255,255,0.55)', ...typography.bodyMedium },
});
