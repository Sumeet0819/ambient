import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, isToday, isYesterday } from 'date-fns';
import { ChevronLeft, Grid, MoreHorizontal, ArrowUpRight, ArrowDownRight, Coffee, Wallet, Car, Plus } from 'lucide-react-native';
import { api } from '../../src/lib/api';
import { colors, typography, borderRadii, spacing } from '../../src/constants/theme';
import { IconButton } from '../../src/components/ui/IconButton';
import { ProgressBar } from '../../src/components/ui/ProgressBar';
import { formatCurrency, getCurrencySymbol } from '../../src/lib/format';

export default function TransactionsScreen() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);

  const fetchData = useCallback(async () => {
    try {
      const [txRes, sumRes] = await Promise.all([
        api.get('/transactions'),
        api.get(`/analytics/monthly?month=${format(new Date(), 'yyyy-MM')}`)
      ]);
      setTransactions(txRes.data.data);
      setSummary(sumRes.data.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Use the currency from the first transaction, default to INR
  const baseCurrency = transactions.length > 0 ? (transactions[0].currency || 'INR') : 'INR';
  const currencySymbol = getCurrencySymbol(baseCurrency);

  // Derive limit dynamically if possible. Assuming 50k as a default limit if none provided.
  const limit = summary?.monthlyLimit || 50000;
  const spent = summary?.totalExpense || 0;
  const progress = Math.min(spent / limit, 1);
  const percentage = Math.round(progress * 100) || 0;

  const renderItem = ({ item }: { item: any }) => {
    const isExpense = item.type === 'expense';
    let timeLabel = format(new Date(item.transaction_date), 'dd MMM');
    if (isToday(new Date(item.transaction_date))) timeLabel = 'Today';
    else if (isYesterday(new Date(item.transaction_date))) timeLabel = 'Yesterday';

    const formattedAmount = formatCurrency(item.amount, item.currency || baseCurrency);
    // Split formatted string into main and decimal parts for styling
    const splitIndex = formattedAmount.lastIndexOf('.');
    const mainAmount = splitIndex !== -1 ? formattedAmount.substring(0, splitIndex) : formattedAmount;
    const decimalAmount = splitIndex !== -1 ? formattedAmount.substring(splitIndex) : '.00';

    return (
      <View style={styles.txnRow}>
        <View style={styles.txnDot} />
        <View style={styles.txnContent}>
          <Text style={styles.txnAmount}>
            {mainAmount}
            <Text style={{fontSize: 16, fontWeight: '400'}}>{decimalAmount}</Text>
          </Text>
          <View style={styles.txnSubRow}>
            <View style={[styles.typeDot, { backgroundColor: isExpense ? '#007AFF' : colors.accentSecondary }]} />
            <Text style={styles.txnCat}>{item.categories?.name || 'Other'}</Text>
          </View>
        </View>
        <View style={styles.txnRight}>
          <Text style={styles.txnDate}>{timeLabel}</Text>
          <View style={styles.txnIconBtn}>
             {isExpense ? <ArrowUpRight size={16} color={colors.textDark} /> : <ArrowDownRight size={16} color={colors.textDark} />}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Green Section */}
      <View style={styles.topSection}>
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
             <View style={styles.headerLeft}>
               <Text style={styles.headerTitle}>Dashboard</Text>
             </View>
             <IconButton icon={Grid} variant="black" size={44} onPress={() => {}} />
          </View>
          
          <View style={styles.planSection}>
            <View style={styles.planTextRow}>
               <Text style={styles.planPercent}>{percentage}%</Text>
               <Text style={styles.planLabel}>Plan Expenses</Text>
            </View>
            <ProgressBar 
               progress={progress} 
               height={64} 
               fillColor={colors.secondary} 
               trackColor="rgba(255,255,255,0.4)" 
               usePatternTrack 
               style={{ marginTop: spacing.md }} 
            />
          </View>
        </SafeAreaView>
      </View>

      {/* Bottom Black Section */}
      <View style={styles.bottomSection}>
        <View style={styles.historyHeader}>
           <Text style={styles.historyTitle}>Expenses History</Text>
           <TouchableOpacity><MoreHorizontal size={24} color={colors.textMuted} /></TouchableOpacity>
        </View>
        
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshing={loading}
          onRefresh={fetchData}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={{color: colors.textMuted, textAlign: 'center', marginTop: 20}}>No transactions found</Text>}
        />


      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.secondary },
  topSection: { 
    backgroundColor: colors.accent, 
    borderBottomLeftRadius: borderRadii.xl,
    borderBottomRightRadius: borderRadii.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerTitle: { ...typography.bodyLarge, fontWeight: '500' },
  planSection: { marginTop: spacing.xxl },
  planTextRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  planPercent: { ...typography.heading1, letterSpacing: -1 },
  planLabel: { ...typography.bodyMedium, marginBottom: spacing.sm },
  
  bottomSection: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.xl },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  historyTitle: { ...typography.bodyLarge, color: colors.textDark },
  list: { paddingBottom: 150 },
  
  txnRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  txnDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'transparent' }, 
  txnContent: { flex: 1, marginLeft: 4 },
  txnAmount: { ...typography.heading3, color: colors.textDark, marginBottom: 4 },
  txnSubRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  typeDot: { width: 6, height: 6, borderRadius: 3 },
  txnCat: { ...typography.bodyMedium, color: colors.textMuted },
  txnRight: { alignItems: 'flex-end', justifyContent: 'space-between', height: 48 },
  txnDate: { ...typography.bodyMedium, color: colors.textMuted },
  txnIconBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: colors.cardDark, justifyContent: 'center', alignItems: 'center' },

});
