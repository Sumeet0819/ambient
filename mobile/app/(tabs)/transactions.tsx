import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';
import { format, isToday, isYesterday, isSameMonth, isSameYear } from 'date-fns';
import { Utensils, Car, ShoppingBag, Film, FileText, Heart, Zap, Home, MoreHorizontal, Filter } from 'lucide-react-native';
import { RootState } from '../../src/store';
import { formatCurrency } from '../../src/lib/format';
import { useThemeColors, spacing, borderRadii } from '../../src/constants/theme';

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

type TimeFilter = 'Day' | 'Month' | 'Year';

export default function TransactionsScreen() {
  const { items: transactions, loading } = useSelector((state: RootState) => state.transactions);
  const profile = useSelector((state: RootState) => state.profile.data);
  const baseCurrency = profile?.base_currency || 'USD';

  const [timeFilter, setTimeFilter] = useState<TimeFilter>('Month');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [isTimeMenuOpen, setIsTimeMenuOpen] = useState(false);

  // Derive unique categories from transactions
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    transactions.forEach(t => {
      const catName = t.categories?.name || 'Other';
      cats.add(catName);
    });
    return ['All', ...Array.from(cats)].sort();
  }, [transactions]);

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    const now = new Date();

    return [...transactions].filter(txn => {
      const txnDate = new Date(txn.transaction_date);
      if (isNaN(txnDate.getTime())) return false;

      // 1. Time Filter
      if (timeFilter === 'Day' && !isToday(txnDate)) return false;
      if (timeFilter === 'Month' && !isSameMonth(txnDate, now)) return false;
      if (timeFilter === 'Year' && !isSameYear(txnDate, now)) return false;

      // 2. Category Filter
      const catName = txn.categories?.name || 'Other';
      if (categoryFilter !== 'All' && catName !== categoryFilter) return false;

      return true;
    }).sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());
  }, [transactions, timeFilter, categoryFilter]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#161616', '#0A0A0A']}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>All Transactions</Text>
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          {/* Category Filter Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryFilterScroll}
          >
            {availableCategories.map(cat => {
              const isActive = categoryFilter === cat;
              const iconColor = isActive ? '#FFFFFF' : '#8E8E93';
              return (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryPill,
                    isActive && styles.categoryPillActive
                  ]}
                  onPress={() => setCategoryFilter(cat)}
                >
                  {cat !== 'All' && getCategoryIcon(cat, iconColor, 14)}
                  <Text style={[
                    styles.categoryPillText,
                    isActive && styles.categoryPillTextActive
                  ]}>{cat}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {loading && transactions.length === 0 ? (
            <ActivityIndicator size="large" color="#C1FFD7" style={{ marginTop: 40 }} />
          ) : filteredTransactions.length === 0 ? (
            <Text style={styles.emptyText}>No transactions found for these filters.</Text>
          ) : (
            <View style={{ marginTop: spacing.sm }}>
              {filteredTransactions.map((txn, index) => {
                const isExpense = txn.type === 'expense';
                const date = new Date(txn.transaction_date);

                let dateLabel = format(date, 'd MMM yyyy, h:mm a');
                if (isToday(date)) dateLabel = `Today, ${format(date, 'h:mm a')}`;
                else if (isYesterday(date)) dateLabel = `Yesterday, ${format(date, 'h:mm a')}`;

                const catColor = txn.categories?.color || (isExpense ? '#FFC1E3' : '#C1FFD7');
                const catName = txn.categories?.name || 'Other';
                const label = txn.merchant?.trim() || catName;

                return (
                  <View key={txn.id} style={styles.txnCard}>
                    <View style={styles.txnRow}>
                      <View style={[styles.txnIconBg, { backgroundColor: `${catColor}25` }]}>
                        {getCategoryIcon(catName, catColor, 18)}
                      </View>
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
                            { color: isExpense ? '#FFFFFF' : '#C1FFD7' },
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

        {/* Floating Time Filter FAB (Drop Menu) */}
        <View style={styles.fabContainer}>
          {isTimeMenuOpen && (
            <View style={styles.fabMenu}>
              {(['Day', 'Month', 'Year'] as TimeFilter[]).map(tf => (
                <TouchableOpacity
                  key={tf}
                  style={[
                    styles.fabMenuItem,
                    timeFilter === tf && styles.fabMenuItemActive
                  ]}
                  onPress={() => {
                    setTimeFilter(tf);
                    setIsTimeMenuOpen(false);
                  }}
                >
                  <Text style={[
                    styles.fabMenuText,
                    timeFilter === tf && styles.fabMenuTextActive
                  ]}>{tf}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={styles.fabButton}
            onPress={() => setIsTimeMenuOpen(!isTimeMenuOpen)}
          >
            <Filter size={24} color="#000000" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  filtersContainer: {
    paddingBottom: spacing.sm,
  },
  categoryFilterScroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.xs,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadii.xl,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  categoryPillActive: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderColor: '#FFFFFF',
  },
  categoryPillText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl + 80,
  },
  emptyText: {
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 15,
  },
  listCard: {
    // legacy, unused
  },
  txnCard: {
    backgroundColor: '#141414',
    borderRadius: borderRadii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  txnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fabContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 140 : 120, // Move more up
    right: spacing.lg, // Move right
    alignItems: 'flex-end',
    zIndex: 100,
  },
  fabMenu: {
    backgroundColor: '#1C1C1E',
    borderRadius: borderRadii.lg,
    padding: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  fabMenuItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadii.sm,
  },
  fabMenuItemActive: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  fabMenuText: {
    fontSize: 15,
    color: '#8E8E93',
    fontWeight: '600',
  },
  fabMenuTextActive: {
    color: '#FFFFFF',
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF', // White instead of neon
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  txnIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txnDetails: {
    flex: 1,
    gap: 4,
  },
  txnLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  txnSub: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '400',
  },
  txnRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  txnAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  txnDate: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '400',
  },
});
