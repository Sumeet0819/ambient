import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { format, isToday, isYesterday } from 'date-fns';
import { RootState } from '../src/store';
import { formatCurrency } from '../src/lib/format';
import { useThemeColors, spacing, borderRadii } from '../src/constants/theme';

export default function TransactionsScreen() {
  const colors = useThemeColors();
  const styles = getStyles(colors);
  const router = useRouter();
  const { items: transactions, loading } = useSelector((state: RootState) => state.transactions);
  const profile = useSelector((state: RootState) => state.profile.data);
  const baseCurrency = profile?.base_currency || 'INR';

  // Sort by date descending
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={(colors.mode === 'light' ? colors.backgroundGradient : ['#161616', '#0A0A0A']) as unknown as readonly [string, string, ...string[]]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
            <ChevronLeft size={24} color={colors.mode === 'light' ? '#000000' : '#FFFFFF'} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>All Transactions</Text>
          <View style={styles.iconBtnPlaceholder} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {loading && transactions.length === 0 ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
          ) : sortedTransactions.length === 0 ? (
            <Text style={styles.emptyText}>No transactions found.</Text>
          ) : (
            <View style={styles.listCard}>
              {sortedTransactions.map((txn, index) => {
                const isExpense = txn.type === 'expense';
                const date = new Date(txn.transaction_date);
                const isValidDate = !isNaN(date.getTime());
                let dateLabel = '';
                if (isValidDate) {
                  dateLabel = format(date, 'd MMM yyyy, h:mm a');
                  if (isToday(date)) dateLabel = `Today, ${format(date, 'h:mm a')}`;
                  else if (isYesterday(date)) dateLabel = `Yesterday, ${format(date, 'h:mm a')}`;
                }
                const catColor = txn.categories?.color || (isExpense ? '#FFC1E3' : colors.primary);
                const catName = txn.categories?.name || 'Other';
                const label = txn.merchant?.trim() || catName;

                return (
                  <View key={txn.id}>
                    {index > 0 && <View style={styles.txnDivider} />}
                    <View style={styles.txnRow}>
                      <View style={[styles.txnDot, { backgroundColor: catColor }]} />
                      <View style={styles.txnDetails}>
                        <Text style={styles.txnLabel} numberOfLines={1}>
                          {label}
                        </Text>
                        <Text style={styles.txnSub}>{catName}</Text>
                      </View>
                      <View style={styles.txnRight}>
                        <Text
                          style={[
                            styles.txnAmount,
                            { color: isExpense ? (colors.mode === 'light' ? colors.text : '#FF6B6B') : colors.primary },
                          ]}
                        >
                          {isExpense ? '-' : '+'}
                          {formatCurrency(Math.abs(txn.amount), baseCurrency)}
                        </Text>
                        <Text style={styles.txnDate}>{dateLabel}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.mode === 'light' ? colors.background : '#0A0A0A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: borderRadii.sm,
    backgroundColor: colors.mode === 'light' ? colors.cardLight : 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.mode === 'light' ? colors.borderLight : 'rgba(255,255,255,0.1)',
  },
  iconBtnPlaceholder: {
    width: 44,
    height: 44,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.mode === 'light' ? colors.text : '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl + 40,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 15,
  },
  listCard: {
    backgroundColor: colors.mode === 'light' ? colors.cardDark : '#141414',
    borderRadius: borderRadii.xl,
    padding: spacing.lg,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.mode === 'light' ? colors.borderLight : 'rgba(255,255,255,0.05)',
  },
  txnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  txnDivider: {
    height: 1,
    backgroundColor: colors.mode === 'light' ? colors.borderLight : 'rgba(255,255,255,0.05)',
  },
  txnDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    flexShrink: 0,
  },
  txnDetails: {
    flex: 1,
    gap: 2,
  },
  txnLabel: {
    fontSize: 15,
    color: colors.mode === 'light' ? colors.text : '#FFFFFF',
    fontWeight: '500',
  },
  txnSub: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '400',
  },
  txnRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  txnAmount: {
    fontSize: 15,
    fontWeight: '600',
  },
  txnDate: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '400',
  },
});
