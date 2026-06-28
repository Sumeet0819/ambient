import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { useSelector } from 'react-redux';
import { api } from '../../src/lib/api';
import { RootState } from '../../src/store';
import { supabase } from '../../src/lib/supabase';

export default function DashboardScreen() {
  const [summary, setSummary] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const userId = useSelector((state: RootState) => state.auth.userId);

  const fetchSummary = useCallback(async () => {
    try {
      const month = format(new Date(), 'yyyy-MM');
      const res = await api.get(`/analytics/monthly?month=${month}`);
      setSummary(res.data.data);
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Realtime updates
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('public:transactions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Realtime update received:', payload);
          fetchSummary(); // Refresh on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchSummary]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSummary();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Dashboard</Text>
          <Text style={styles.month}>{format(new Date(), 'MMMM yyyy')}</Text>
        </View>

        {summary && (
          <>
            <View style={styles.cardsRow}>
              <View style={[styles.card, { backgroundColor: '#FEE2E2' }]}>
                <Text style={styles.cardTitle}>Spent</Text>
                <Text style={[styles.cardValue, { color: '#DC2626' }]}>
                  ₹{summary.totalExpense.toLocaleString()}
                </Text>
              </View>
              <View style={[styles.card, { backgroundColor: '#DCFCE7' }]}>
                <Text style={styles.cardTitle}>Income</Text>
                <Text style={[styles.cardValue, { color: '#16A34A' }]}>
                  ₹{summary.totalIncome.toLocaleString()}
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Category Breakdown</Text>
              {summary.categoryBreakdown.map((cat: any) => (
                <View key={cat.category} style={styles.catRow}>
                  <Text style={styles.catName}>{cat.icon} {cat.category}</Text>
                  <Text style={styles.catValue}>₹{cat.total.toLocaleString()}</Text>
                </View>
              ))}
              {summary.categoryBreakdown.length === 0 && (
                <Text style={styles.emptyText}>No expenses yet.</Text>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
              {summary.recentTransactions.map((t: any) => (
                <View key={t.id} style={styles.txnRow}>
                  <View>
                    <Text style={styles.txnCat}>{t.categories?.name || 'Other'}</Text>
                    <Text style={styles.txnDate}>{format(new Date(t.transaction_date), 'dd MMM')}</Text>
                  </View>
                  <Text style={[styles.txnAmount, t.type === 'expense' ? styles.expense : styles.income]}>
                    {t.type === 'expense' ? '-' : '+'}₹{t.amount.toLocaleString()}
                  </Text>
                </View>
              ))}
              {summary.recentTransactions.length === 0 && (
                <Text style={styles.emptyText}>No recent transactions.</Text>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { padding: 20 },
  greeting: { fontSize: 28, fontWeight: 'bold', color: '#111827' },
  month: { fontSize: 16, color: '#6B7280', marginTop: 4 },
  cardsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12 },
  card: { flex: 1, padding: 16, borderRadius: 12 },
  cardTitle: { fontSize: 14, color: '#4B5563', marginBottom: 8 },
  cardValue: { fontSize: 24, fontWeight: 'bold' },
  section: { backgroundColor: '#fff', margin: 20, padding: 20, borderRadius: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#111827' },
  catRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  catName: { fontSize: 16, color: '#374151' },
  catValue: { fontSize: 16, fontWeight: '500', color: '#111827' },
  txnRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  txnCat: { fontSize: 16, color: '#374151', fontWeight: '500' },
  txnDate: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  txnAmount: { fontSize: 16, fontWeight: 'bold' },
  expense: { color: '#DC2626' },
  income: { color: '#16A34A' },
  emptyText: { color: '#9CA3AF', fontStyle: 'italic', textAlign: 'center', padding: 10 },
});
