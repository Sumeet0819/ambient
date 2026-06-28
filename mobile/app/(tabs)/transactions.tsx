import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { api } from '../../src/lib/api';

export default function TransactionsScreen() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    try {
      const res = await api.get('/transactions');
      setTransactions(res.data.data);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleDelete = (id: string) => {
    Alert.alert('Delete', 'Are you sure you want to delete this transaction?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/transactions/${id}`);
            fetchTransactions();
          } catch (e) {
            console.error(e);
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.txnRow} onLongPress={() => handleDelete(item.id)}>
      <View>
        <Text style={styles.txnCat}>{item.categories?.name || 'Other'}</Text>
        <Text style={styles.txnDate}>{format(new Date(item.transaction_date), 'dd MMM yyyy, HH:mm')}</Text>
        {item.merchant && <Text style={styles.merchant}>{item.merchant}</Text>}
      </View>
      <Text style={[styles.txnAmount, item.type === 'expense' ? styles.expense : styles.income]}>
        {item.type === 'expense' ? '-' : '+'}₹{item.amount.toLocaleString()}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>All Transactions</Text>
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={fetchTransactions}
        ListEmptyComponent={<Text style={styles.emptyText}>No transactions yet.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  list: { padding: 20 },
  txnRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderRadius: 12, marginBottom: 12 },
  txnCat: { fontSize: 16, color: '#111827', fontWeight: '600' },
  txnDate: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  merchant: { fontSize: 14, color: '#4B5563', marginTop: 4 },
  txnAmount: { fontSize: 18, fontWeight: 'bold' },
  expense: { color: '#DC2626' },
  income: { color: '#16A34A' },
  emptyText: { textAlign: 'center', color: '#6B7280', marginTop: 40 },
});
