import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { format, isToday, isYesterday } from 'date-fns';
import { ChevronLeft, Grid, MoreHorizontal, ArrowUpRight, ArrowDownRight, Search } from 'lucide-react-native';
import { api } from '../../src/lib/api';
import { fetchTransactions } from '../../src/store/transactions.slice';
import { AppDispatch, RootState } from '../../src/store';
import { colors, typography, borderRadii, spacing } from '../../src/constants/theme';
import { IconButton } from '../../src/components/ui/IconButton';
import { ProgressBar } from '../../src/components/ui/ProgressBar';
import { formatCurrency, getCurrencySymbol } from '../../src/lib/format';
import { MotiView } from 'moti';
import { Easing } from 'react-native-reanimated';

export default function TransactionsScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { items: transactions, loading } = useSelector((state: RootState) => state.transactions);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [summary, setSummary] = useState<any>(null);

  const fetchData = useCallback(async () => {
    dispatch(fetchTransactions({}));
    try {
      const [catRes, sumRes] = await Promise.all([
        api.get('/categories'),
        api.get(`/analytics/monthly?month=${format(new Date(), 'yyyy-MM')}`)
      ]);
      setCategories(catRes.data.data);
      setSummary(sumRes.data.data);
    } catch (e) {
      console.log('Failed to fetch auxiliary data', e);
    }
  }, [dispatch]);



  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Use the currency from the first transaction, default to INR
  const baseCurrency = transactions.length > 0 ? (transactions[0].currency || 'INR') : 'INR';
  const currencySymbol = getCurrencySymbol(baseCurrency);

  const limit = summary?.monthlyLimit || 50000;
  const spent = summary?.totalExpense || 0;
  const progress = Math.min(spent / limit, 1);
  const percentage = Math.round(progress * 100) || 0;

  const filteredTransactions = selectedCategory
    ? transactions.filter(t => t.category_id === selectedCategory)
    : transactions;

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
      <MotiView 
        from={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'timing', duration: 400, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }}
        style={styles.txnRow}
      >
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
      </MotiView>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Green Section */}
      <MotiView 
        from={{ translateY: -100, opacity: 0 }}
        animate={{ translateY: 0, opacity: 1 }}
        transition={{ type: 'timing', duration: 500, easing: Easing.out(Easing.ease) }}
        style={styles.topSection}
      >
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
      </MotiView>

      {/* Bottom Black Section */}
      <MotiView 
        from={{ opacity: 0, translateY: 50 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 500, delay: 150, easing: Easing.out(Easing.ease) }}
        style={styles.bottomSection}
      >
        <View style={styles.historyHeader}>
           <Text style={styles.historyTitle}>Expenses History</Text>
           <TouchableOpacity><MoreHorizontal size={24} color={colors.textMuted} /></TouchableOpacity>
        </View>

        {/* Filter Pills */}
        <View style={styles.filterPillsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillsScroll}>
            <TouchableOpacity
              style={[styles.filterPill, !selectedCategory && styles.filterPillActive]}
              onPress={() => setSelectedCategory(null)}
            >
              <Text style={[styles.filterPillText, !selectedCategory && styles.filterPillTextActive]}>All</Text>
            </TouchableOpacity>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.filterPill, selectedCategory === cat.id && styles.filterPillActive]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Text style={[styles.filterPillText, selectedCategory === cat.id && styles.filterPillTextActive]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        <FlatList
          data={filteredTransactions}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshing={loading}
          onRefresh={fetchData}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={{color: colors.textMuted, textAlign: 'center', marginTop: 20}}>No transactions found</Text>}
        />

      </MotiView>
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
  filterPillsContainer: { marginBottom: spacing.md },
  filterPillsScroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, gap: spacing.sm },
  filterPill: { 
    paddingHorizontal: spacing.lg, 
    paddingVertical: spacing.sm, 
    borderRadius: borderRadii.pill, 
    backgroundColor: 'transparent', 
    borderWidth: 1.5, 
    borderColor: colors.cardDark,
  },
  filterPillActive: { 
    backgroundColor: colors.accent, 
    borderColor: colors.accent,
  },
  filterPillText: { 
    color: colors.primary, 
    fontSize: 15, 
    fontWeight: '600' 
  },
  filterPillTextActive: { 
    color: colors.textLight 
  }
});
