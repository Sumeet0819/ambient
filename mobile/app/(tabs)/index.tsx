import { useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'expo-router';
import { Menu, Search, Minus, Plus, Check, Camera, Utensils, Car, ShoppingBag, Film, FileText, Heart, MoreHorizontal, Zap, Home } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { format, isToday, isYesterday } from 'date-fns';
import { AppDispatch, RootState } from '../../src/store';
import { fetchTransactions } from '../../src/store/transactions.slice';
import { fetchProfile } from '../../src/store/profile.slice';
import { useThemeColors, spacing, borderRadii } from '../../src/constants/theme';
import { useOCR } from '../../src/hooks/useOCR';
import { formatCurrency } from '../../src/lib/format';

const getCategoryIcon = (categoryName: string, color: string, size: number = 18) => {
  switch (categoryName.toLowerCase()) {
    case 'food':
      return <Utensils size={size} color={color} />;
    case 'transport':
      return <Car size={size} color={color} />;
    case 'shopping':
      return <ShoppingBag size={size} color={color} />;
    case 'entertainment':
      return <Film size={size} color={color} />;
    case 'bills':
      return <FileText size={size} color={color} />;
    case 'health':
      return <Heart size={size} color={color} />;
    case 'utilities':
      return <Zap size={size} color={color} />;
    case 'rent':
      return <Home size={size} color={color} />;
    default:
      return <MoreHorizontal size={size} color={color} />;
  }
};

const DEFAULT_CATEGORIES = [
  { name: 'Food', color: '#FF6B6B' },
  { name: 'Transport', color: '#4ECDC4' },
  { name: 'Shopping', color: '#45B7D1' },
  { name: 'Entertainment', color: '#96CEB4' },
  { name: 'Health', color: '#FFEAA7' },
  { name: 'Utilities', color: '#DDA0DD' },
  { name: 'Rent', color: '#98D8C8' },
  { name: 'Other', color: '#B0B0B0' },
];

interface CategorySpend {
  name: string;
  total: number;
  percentage: number;
  color: string;
}

const CategoryCard = ({ cat, baseCurrency }: { cat: CategorySpend; baseCurrency: string }) => {
  const fillAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: cat.percentage,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [cat.percentage]);

  const widthInterpolation = fillAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.otherCatCard, { overflow: 'hidden' }]}>
      {/* Animated Fill Background */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: `${cat.color}25`, // Slightly tinted background fill
            width: widthInterpolation,
          },
        ]}
      />
      <View style={[styles.otherCatIconBg, { backgroundColor: `${cat.color}25` }]}>
        {getCategoryIcon(cat.name, cat.color, 14)}
      </View>
      <View style={styles.otherCatInfo}>
        <Text style={styles.otherCatName} numberOfLines={1}>
          {cat.name}
        </Text>
        <Text style={styles.otherCatAmount}>
          {formatCurrency(cat.total, baseCurrency)}
        </Text>
      </View>
    </View>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const dispatch = useDispatch<AppDispatch>();

  const { items: transactions, loading } = useSelector(
    (state: RootState) => state.transactions
  );
  const profile = useSelector((state: RootState) => state.profile.data);
  const { handleOCR, ocrLoading } = useOCR();

  const fetchData = useCallback(() => {
    dispatch(fetchTransactions());
    if (!profile) {
      dispatch(fetchProfile());
    }
  }, [dispatch, profile]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derived financials from redux state
  const { totalIncome, totalExpense, baseCurrency } = useMemo(() => {
    let income = 0;
    let expense = 0;
    const currency =
      transactions.length > 0 ? transactions[0].currency || 'INR' : 'INR';
    for (const t of transactions) {
      if (t.type === 'income') income += t.amount;
      else expense += t.amount;
    }
    return { totalIncome: income, totalExpense: expense, baseCurrency: currency };
  }, [transactions]);

  const availableBalance = totalIncome - totalExpense;

  // Top 5 most recent transactions
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
      .slice(0, 5);
  }, [transactions]);

  // Aggregate spending by category for the chart
  const categorySpends = useMemo<CategorySpend[]>(() => {
    const map: Record<string, { total: number, color: string }> = {};
    
    // Initialize with defaults
    DEFAULT_CATEGORIES.forEach(cat => {
      map[cat.name] = { total: 0, color: cat.color };
    });

    for (const t of transactions) {
      if (t.type !== 'expense') continue;
      const name = t.categories?.name || 'Other';
      const color = t.categories?.color || map['Other']?.color || '#B0B0B0';
      
      if (!map[name]) {
        map[name] = { total: 0, color };
      }
      map[name].total += t.amount;
    }
    const entries = Object.entries(map).sort((a, b) => b[1].total - a[1].total);
    const grandTotal = entries.reduce((s, [, v]) => s + v.total, 0);
    return entries.map(([name, data]) => ({
      name,
      total: data.total,
      percentage: grandTotal > 0 ? Math.round((data.total / grandTotal) * 100) : 0,
      color: data.color,
    }));
  }, [transactions]);

  // Greeting name
  const firstName = profile?.name?.split(' ')[0] || 'there';

  return (
    <View style={styles.container}>
      {/* Ambient gradient background: green-ish top fading to dark */}
      <LinearGradient
        colors={['#C8F0D8', '#C4E8C4', '#252527', '#1C1C1E']}
        locations={[0, 0.08, 0.34, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onScrollEndDrag={fetchData}
        >
          {/* ── Header ── */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.iconBtn}>
              <Menu size={18} color="#FFFFFF" strokeWidth={1.8} />
            </TouchableOpacity>
            {profile ? (
              <Image
                source={{ uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'U')}&background=2C2C2E&color=fff&rounded=true&size=96` }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, { backgroundColor: '#2C2C2E' }]} />
            )}
          </View>

          {/* ── Greeting ── */}
          <View style={styles.greetingBlock}>
            <Text style={styles.greetingLight}>Welcome</Text>
            <View style={styles.greetingRow}>
              <Text style={styles.greetingBold} numberOfLines={1}>
                {firstName}!
              </Text>
              <TouchableOpacity style={styles.iconBtn}>
                <Search size={18} color="#FFFFFF" strokeWidth={1.8} />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Balance Card ── */}
          <LinearGradient
            colors={['#1E3028', '#1A2820', '#161616']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceCard}
          >
            <Text style={styles.balanceLabel}>Available Balance</Text>
            {loading && transactions.length === 0 ? (
              <ActivityIndicator
                size="small"
                color="#8E8E93"
                style={{ alignSelf: 'flex-end', marginTop: 24 }}
              />
            ) : (
              <Text style={styles.balanceAmount} numberOfLines={1} adjustsFontSizeToFit>
                {formatCurrency(availableBalance, baseCurrency)}
              </Text>
            )}
          </LinearGradient>

          {/* ── Recents Summary ── */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Recent Income</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(totalIncome, baseCurrency)}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Recent Expenses</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(totalExpense, baseCurrency)}
              </Text>
            </View>
          </View>

          {/* ── Quick Actions ── */}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionCard}>
              <View style={styles.actionIconRing}>
                <Minus size={14} color="#FFFFFF" strokeWidth={2} />
              </View>
              <Text style={styles.actionSub}>Add</Text>
              <Text style={styles.actionTitle}>Expense</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <View style={styles.actionIconRing}>
                <Plus size={14} color="#C1FFD7" strokeWidth={2} />
              </View>
              <Text style={styles.actionSub}>Add</Text>
              <Text style={[styles.actionTitle, { color: '#C1FFD7' }]}>Income</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={handleOCR}>
              <View style={styles.actionIconRing}>
                {ocrLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Camera size={14} color="#FFFFFF" strokeWidth={2} />
                )}
              </View>
              <Text style={styles.actionSub}>Scan</Text>
              <Text style={styles.actionTitle}>Receipt</Text>
            </TouchableOpacity>
          </View>

          {/* ── Recent Transactions ── */}
          <View style={styles.recentCard}>
            <View style={styles.recentHeader}>
              <Text style={styles.recentTitle}>Recent Transactions</Text>
              <TouchableOpacity onPress={() => router.push('/transactions')}>
                <Text style={styles.recentSeeAll}>See all</Text>
              </TouchableOpacity>
            </View>

            {loading && transactions.length === 0 ? (
              <ActivityIndicator size="small" color="#8E8E93" style={{ marginVertical: 20 }} />
            ) : recentTransactions.length === 0 ? (
              <Text style={styles.emptyChart}>No transactions yet.</Text>
            ) : (
              recentTransactions.map((txn, index) => {
                const isExpense = txn.type === 'expense';
                const date = new Date(txn.transaction_date);
                const isValidDate = !isNaN(date.getTime());
                let dateLabel = '';
                if (isValidDate) {
                  dateLabel = format(date, 'd MMM');
                  if (isToday(date)) dateLabel = 'Today';
                  else if (isYesterday(date)) dateLabel = 'Yesterday';
                }
                const catColor = txn.categories?.color || (isExpense ? '#FFC1E3' : '#C1FFD7');
                const catName = txn.categories?.name || 'Other';
                const label = txn.merchant?.trim() || catName;

                return (
                  <View key={txn.id}>
                    {index > 0 && <View style={styles.txnDivider} />}
                    <View style={styles.txnRow}>
                      {/* Category icon */}
                      <View style={[styles.txnIconBg, { backgroundColor: `${catColor}25` }]}>
                        {getCategoryIcon(catName, catColor)}
                      </View>
                      {/* Details */}
                      <View style={styles.txnDetails}>
                        <Text style={styles.txnLabel} numberOfLines={1}>
                          {label}
                        </Text>
                        <Text style={styles.txnSub}>{catName}</Text>
                      </View>
                      {/* Right side */}
                      <View style={styles.txnRight}>
                        <Text
                          style={[
                            styles.txnAmount,
                            { color: isExpense ? '#FF6B6B' : '#C1FFD7' },
                          ]}
                        >
                          {isExpense ? '-' : '+'}{formatCurrency(txn.amount, txn.currency || baseCurrency)}
                        </Text>
                        <Text style={styles.txnDate}>{dateLabel}</Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>

          {/* ── Spending Categories ── */}
          <View style={[styles.recentHeader, { marginTop: spacing.md }]}>
            <Text style={styles.recentTitle}>Spending by Category</Text>
          </View>

          {loading && categorySpends.length === 0 ? (
            <ActivityIndicator
              size="small"
              color="#8E8E93"
              style={{ alignSelf: 'center', marginVertical: 40 }}
            />
          ) : categorySpends.length === 0 ? (
            <Text style={styles.emptyChart}>
              No expenses recorded this month.
            </Text>
          ) : (
            <View style={styles.otherCatsContainer}>
              {categorySpends.map((cat) => (
                <CategoryCard key={cat.name} cat={cat} baseCurrency={baseCurrency} />
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1E',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl + 16,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: borderRadii.sm,
    backgroundColor: 'rgba(44,44,46,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },

  // Greeting
  greetingBlock: {
    marginTop: 28,
    marginBottom: spacing.lg,
  },
  greetingLight: {
    fontSize: 26,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: -0.3,
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  greetingBold: {
    fontSize: 30,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.8,
    flex: 1,
    marginRight: spacing.sm,
  },

  // Balance Card
  balanceCard: {
    borderRadius: borderRadii.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    // Tinted inner border to simulate glass edge
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 14,
  },
  balanceLabel: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
    marginBottom: 28,
  },
  balanceAmount: {
    fontSize: 34,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'right',
    letterSpacing: -1,
  },

  // Summary Card
  summaryCard: {
    backgroundColor: '#141414',
    borderRadius: borderRadii.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },

  // Action Buttons
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: spacing.lg,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#141414',
    borderRadius: borderRadii.lg,
    padding: spacing.md,
    minHeight: 108,
  },
  actionIconRing: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionSub: {
    fontSize: 10,
    color: '#6E6E73',
    fontWeight: '500',
    marginTop: 'auto',
    paddingTop: spacing.md,
  },
  actionTitle: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
    marginTop: 3,
  },

  // Recent Transactions
  recentCard: {
    backgroundColor: '#141414',
    borderRadius: borderRadii.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  recentTitle: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  recentSeeAll: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  txnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  txnDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  txnIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  txnDetails: {
    flex: 1,
    gap: 2,
  },
  txnLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  txnSub: {
    fontSize: 11,
    color: '#6E6E73',
    fontWeight: '400',
  },
  txnRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  txnAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  txnDate: {
    fontSize: 11,
    color: '#6E6E73',
    fontWeight: '400',
  },

  // Chart
  chartCard: {
    backgroundColor: '#141414',
    borderRadius: borderRadii.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  chartTitle: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: spacing.lg,
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 130,
    marginBottom: spacing.xl,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
  },
  barPercent: {
    fontSize: 9,
    color: '#8E8E93',
    marginBottom: 6,
    fontWeight: '500',
  },
  barTrack: {
    width: 42,
    height: 96,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 12,
  },
  // Legend: 2-column wrap grid
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '45%',
  },
  legendIconBg: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  legendText: {
    fontSize: 11,
    color: '#CCCCCC',
    fontWeight: '500',
    flex: 1,
  },
  emptyChart: {
    fontSize: 13,
    color: '#6E6E73',
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  otherCatsContainer: {
    paddingBottom: spacing.xxl,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  otherCatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141414',
    borderRadius: borderRadii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    width: '48%',
  },
  otherCatIconBg: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  otherCatInfo: {
    justifyContent: 'center',
  },
  otherCatName: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
    marginBottom: 2,
  },
  otherCatAmount: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
