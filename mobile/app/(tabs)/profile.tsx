import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import { api } from '../../src/lib/api';
import { clearAuthAsync } from '../../src/store/auth.slice';
import { AppDispatch } from '../../src/store';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    api.get('/users/me').then((res) => {
      setProfile(res.data.data);
      if (res.data.data.name) setName(res.data.data.name);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch('/users/me', { name });
      alert('Profile updated');
    } catch (e) {
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await dispatch(clearAuthAsync());
  };

  if (!profile) return <SafeAreaView style={styles.container}><Text>Loading...</Text></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>Phone Number</Text>
        <Text style={styles.value}>{profile.phone_number}</Text>

        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter your name"
        />

        <TouchableOpacity style={styles.button} onPress={handleSave} disabled={saving}>
          <Text style={styles.buttonText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  content: { padding: 20 },
  label: { fontSize: 14, color: '#6B7280', marginBottom: 8 },
  value: { fontSize: 18, color: '#111827', marginBottom: 24 },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#111827',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  logoutButton: {
    margin: 20,
    marginTop: 'auto',
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
  },
  logoutText: { color: '#DC2626', fontSize: 16, fontWeight: '600' },
});
