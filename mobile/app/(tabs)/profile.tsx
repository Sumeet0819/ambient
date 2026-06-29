import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import { api } from '../../src/lib/api';
import { clearAuthAsync } from '../../src/store/auth.slice';
import { AppDispatch } from '../../src/store';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [phoneSaving, setPhoneSaving] = useState(false);
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

  const handleLogout = async () => {
    await dispatch(clearAuthAsync());
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={{ marginTop: 16, color: '#6B7280' }}>Loading Profile...</Text>
      </SafeAreaView>
    );
  }

  if (fetchError) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <Text style={{ color: '#EF4444', fontSize: 18, marginBottom: 24, textAlign: 'center' }}>
          {fetchError}
        </Text>
        <TouchableOpacity style={styles.button} onPress={fetchProfile}>
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.logoutButton, { width: '100%' }]} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Info</Text>
          <Text style={styles.label}>Email Address</Text>
          <Text style={styles.value}>{profile?.email || 'Not provided'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Info</Text>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter your full name"
          />
          <TouchableOpacity style={styles.button} onPress={handleSaveName} disabled={saving}>
            <Text style={styles.buttonText}>{saving ? 'Saving...' : 'Update Name'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>WhatsApp Integration</Text>
          <Text style={styles.description}>Link your WhatsApp Phone Number (e.g., +91...) or WhatsApp Device ID (LID) to sync messages with AI Finance.</Text>
          <Text style={styles.label}>WhatsApp Number or Device ID</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="+91... or 11766..."
            keyboardType="default"
          />
          <TouchableOpacity style={[styles.button, { backgroundColor: '#10B981' }]} onPress={handleLinkPhone} disabled={phoneSaving}>
            <Text style={styles.buttonText}>{phoneSaving ? 'Linking...' : 'Link WhatsApp Account'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  content: { padding: 16 },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#374151', marginBottom: 16 },
  description: { fontSize: 14, color: '#6B7280', marginBottom: 16, lineHeight: 20 },
  label: { fontSize: 14, color: '#6B7280', marginBottom: 8, fontWeight: '500' },
  value: { fontSize: 16, color: '#111827', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#F9FAFB',
  },
  button: {
    backgroundColor: '#3B82F6',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  logoutButton: {
    marginTop: 8,
    marginBottom: 32,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
  },
  logoutText: { color: '#DC2626', fontSize: 16, fontWeight: '600' },
});
