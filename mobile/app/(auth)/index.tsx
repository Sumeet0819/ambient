import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import { api } from '../../src/lib/api';
import { setAuthAsync } from '../../src/store/auth.slice';
import { AppDispatch } from '../../src/store';
import { colors, typography, borderRadii, spacing } from '../../src/constants/theme';
import { ChevronRight } from 'lucide-react-native';
import { MotiView } from 'moti';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, userId } = response.data;
      
      // Save auth state, the RootLayout will automatically redirect to (tabs)
      await dispatch(setAuthAsync({ token, userId }));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 500 }}
        style={styles.content}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>
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

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={colors.secondary} />
            ) : (
              <>
                <Text style={styles.buttonText}>Login</Text>
                <ChevronRight color={colors.secondary} size={20} style={{ marginLeft: 8 }} />
              </>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => router.push('/(auth)/register')} style={styles.linkButton}>
          <Text style={styles.linkText}>Don't have an account? <Text style={{ color: colors.accent, fontWeight: 'bold' }}>Register</Text></Text>
        </TouchableOpacity>

      </MotiView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.secondary },
  content: { flex: 1, padding: spacing.xl, justifyContent: 'center' },
  
  header: { marginBottom: spacing.xxl },
  title: { ...typography.heading1, color: colors.primary, marginBottom: spacing.sm, fontWeight: '700', letterSpacing: -1 },
  subtitle: { ...typography.bodyLarge, color: colors.textMuted },
  
  form: { marginBottom: spacing.xl },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: borderRadii.md,
    padding: spacing.lg,
    ...typography.bodyLarge,
    color: colors.primary,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  
  error: { color: colors.accentSecondary, marginBottom: spacing.md, textAlign: 'center', ...typography.bodyMedium },
  
  button: {
    backgroundColor: colors.accent,
    padding: spacing.lg,
    borderRadius: borderRadii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  buttonText: { color: colors.secondary, ...typography.bodyLarge, fontWeight: '700' },
  
  linkButton: { marginTop: spacing.xl, alignItems: 'center' },
  linkText: { color: colors.textMuted, ...typography.bodyMedium },
});
