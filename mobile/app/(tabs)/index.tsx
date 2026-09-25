import { useEffect, useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Animated,
  Modal,
  RefreshControl,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'expo-router';
import { Menu, Search, Minus, Plus, Check, Camera, Utensils, Car, ShoppingBag, Film, FileText, Heart, MoreHorizontal, Zap, Home } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { format, isToday, isYesterday } from 'date-fns';
import { AppDispatch, RootState } from '../../src/store';
import { fetchTransactions, uploadReceiptOCR, createTransaction } from '../../src/store/transactions.slice';
import { fetchProfile } from '../../src/store/profile.slice';
import { useThemeColors, spacing, borderRadii, colors } from '../../src/constants/theme';
import { useOCR } from '../../src/hooks/useOCR';
import { formatCurrency } from '../../src/lib/format';
import { useAlert } from '../../src/contexts/AlertContext';

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
  const colors = useThemeColors();
  const styles = getStyles(colors);



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
  const { showAlert } = useAlert();
  const styles = getStyles(colors);

  const [ocrPreview, setOcrPreview] = useState<{ uri: string; text: string } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [transactionModalType, setTransactionModalType] = useState<'expense' | 'income' | null>(null);
  const [formAmount, setFormAmount] = useState('');
  const [formMerchant, setFormMerchant] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { items: transactions, loading } = useSelector(
    (state: RootState) => state.transactions
  );
  const profile = useSelector((state: RootState) => state.profile.data);
  const { handleOCR, ocrLoading } = useOCR((uri, text) => {
    setOcrPreview({ uri, text });
  });

  const handleAnalyzeAndAdd = async () => {
    if (!ocrPreview) return;
    setIsAnalyzing(true);
    try {
      await dispatch(uploadReceiptOCR({ extractedText: ocrPreview.text })).unwrap();
      setOcrPreview(null);
      dispatch(fetchTransactions({}));
      showAlert('Success', 'Transaction analyzed and added successfully.');
    } catch (error: any) {  
      console.error(error);
      showAlert('Error', error.message || 'Failed to add transaction.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddTransaction = async () => {
    if (!formAmount || !formMerchant) {
      showAlert('Error', 'Please fill in amount and merchant');
      return;
    }
    setIsSubmitting(true);
    try {
      await dispatch(createTransaction({
        type: transactionModalType!,
        amount: parseFloat(formAmount),
        currency: baseCurrency,
        merchant: formMerchant,
        notes: formNotes,
        payment_method: 'cash',
        transaction_date: new Date().toISOString()
      })).unwrap();
      
      showAlert('Success', `${transactionModalType === 'income' ? 'Income' : 'Expense'} added successfully.`);
      setTransactionModalType(null);
      setFormAmount('');
      setFormMerchant('');
      setFormNotes('');
      dispatch(fetchTransactions({}));
    } catch (error: any) {
      console.error(error);
      showAlert('Error', error.message || 'Failed to add transaction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchData = useCallback(() => {
    dispatch(fetchTransactions({}));
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
    const currency = profile?.base_currency || 'INR';
    for (const t of transactions) {
      if (t.type === 'income') income += t.amount;
      else expense += t.amount;
    }
    return { totalIncome: income, totalExpense: expense, baseCurrency: currency };
  }, [transactions, profile?.base_currency]);

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
      {/* Ambient gradient background */}
      <LinearGradient
        colors={colors.backgroundGradient as any}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        locations={[0, 0.25, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchData} tintColor="#FFFFFF" />
          }
        >
          {/* ── Header ── */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.iconBtn}>
              <Menu size={18} color="#FFFFFF" strokeWidth={1.8} />
            </TouchableOpacity>
            {profile ? (
              <TouchableOpacity onPress={() => router.push('/profile')}>
                <Image
                  source={{ uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'U')}&background=2C2C2E&color=fff&rounded=true&size=96` }}
                  style={styles.avatar}
                />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => router.push('/profile')}>
                <View style={[styles.avatar, { backgroundColor: colors.mode === 'light' ? colors.cardLight : '#2C2C2E' }]} />
              </TouchableOpacity>
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
          <View style={styles.balanceCard}>
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
          </View>

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
            <TouchableOpacity style={styles.actionCard} onPress={() => setTransactionModalType('expense')}>
              <View style={styles.actionIconRing}>
                <Minus size={14} color={colors.primary} strokeWidth={2} />
              </View>
              <Text style={styles.actionSub}>Add</Text>
              <Text style={styles.actionTitle}>Expense</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={() => setTransactionModalType('income')}>
              <View style={styles.actionIconRing}>
                <Plus size={14} color={colors.primary} strokeWidth={2} />
              </View>
              <Text style={styles.actionSub}>Add</Text>
              <Text style={[styles.actionTitle, { color: colors.primary }]}>Income</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={handleOCR}>
              <View style={styles.actionIconRing}>
                {ocrLoading ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Camera size={14} color={colors.primary} strokeWidth={2} />
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
                const catColor = txn.categories?.color || (isExpense ? '#FFC1E3' : colors.primary);
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
                            { color: isExpense ? (colors.mode === 'light' ? colors.text : '#FF6B6B') : colors.primary },
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

      {/* OCR Preview Modal */}
      <Modal
        visible={!!ocrPreview}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setOcrPreview(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Receipt Preview</Text>
              <TouchableOpacity onPress={() => setOcrPreview(null)}>
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            {ocrPreview?.uri && (
              <Image
                source={{ uri: ocrPreview.uri }}
                style={styles.previewImage}
                resizeMode="contain"
              />
            )}

            <ScrollView style={styles.previewTextContainer}>
              <Text style={styles.previewTextTitle}>Extracted Data:</Text>
              <Text style={styles.previewText}>{ocrPreview?.text}</Text>
            </ScrollView>

            <TouchableOpacity
              style={styles.analyzeBtn}
              onPress={handleAnalyzeAndAdd}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <ActivityIndicator color="#000" size="small" />
              ) : (
                <Text style={styles.analyzeBtnText}>Analyze & Add</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Manual Transaction Modal */}
      <Modal
        visible={!!transactionModalType}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setTransactionModalType(null)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { height: '60%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add {transactionModalType === 'income' ? 'Income' : 'Expense'}</Text>
              <TouchableOpacity onPress={() => setTransactionModalType(null)}>
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Amount</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="0.00"
                  placeholderTextColor="#6E6E73"
                  keyboardType="numeric"
                  value={formAmount}
                  onChangeText={setFormAmount}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Merchant / Title</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Starbucks"
                  placeholderTextColor="#6E6E73"
                  value={formMerchant}
                  onChangeText={setFormMerchant}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Notes (Optional)</Text>
                <TextInput
                  style={[styles.textInput, { height: 80, textAlignVertical: 'top' }]}
                  placeholder="Additional details..."
                  placeholderTextColor="#6E6E73"
                  multiline
                  value={formNotes}
                  onChangeText={setFormNotes}
                />
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.analyzeBtn}
              onPress={handleAddTransaction}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#000" size="small" />
              ) : (
                <Text style={styles.analyzeBtnText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.mode === 'light' ? colors.cardDark : '#1C1C1E',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl + 16,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.mode === 'light' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.mode === 'light' ? colors.cardDark : '#1C1C1E',
    borderTopLeftRadius: borderRadii.xl,
    borderTopRightRadius: borderRadii.xl,
    padding: spacing.lg,
    height: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.mode === 'light' ? colors.text : '#FFF',
  },
  modalCloseText: {
    fontSize: 16,
    color: colors.mode === 'light' ? colors.textMuted : '#8E8E93',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: borderRadii.md,
    backgroundColor: colors.mode === 'light' ? colors.surface : '#141414',
    marginBottom: spacing.lg,
  },
  previewTextContainer: {
    flex: 1,
    backgroundColor: colors.mode === 'light' ? colors.surface : '#141414',
    borderRadius: borderRadii.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  previewTextTitle: {
    fontSize: 14,
    color: colors.mode === 'light' ? colors.textMuted : '#8E8E93',
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  previewText: {
    fontSize: 13,
    color: colors.mode === 'light' ? colors.textMuted : '#D1D1D6',
    lineHeight: 20,
  },
  analyzeBtn: {
    backgroundColor: colors.mode === 'light' ? colors.text : '#FFFFFF',
    paddingVertical: 16,
    borderRadius: borderRadii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyzeBtnText: {
    color: colors.mode === 'light' ? colors.textInverse : '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Form Inputs
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: 14,
    color: colors.mode === 'light' ? colors.textMuted : '#8E8E93',
    marginBottom: spacing.sm,
    fontWeight: '500',
  },
  textInput: {
    backgroundColor: colors.mode === 'light' ? colors.surface : '#141414',
    borderRadius: borderRadii.md,
    color: colors.mode === 'light' ? colors.text : '#FFFFFF',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.mode === 'light' ? colors.border : 'rgba(255,255,255,0.05)',
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
    backgroundColor: colors.mode === 'light' ? colors.overlay : 'rgba(44,44,46,0.85)',
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
    color: colors.mode === 'light' ? colors.iconMuted : 'rgba(255,255,255,0.55)',
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
    color: colors.mode === 'light' ? colors.text : '#FFFFFF',
    letterSpacing: -0.8,
    flex: 1,
    marginRight: spacing.sm,
  },

  // Balance Card
  balanceCard: {
    backgroundColor: colors.mode === 'light' ? '#FFFFFF' : '#1C1C1E',
    borderRadius: borderRadii.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    // Soft shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: colors.mode === 'light' ? 0.05 : 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  balanceLabel: {
    fontSize: 13,
    color: colors.mode === 'light' ? colors.textMuted : '#8E8E93',
    fontWeight: '500',
    marginBottom: 28,
  },
  balanceAmount: {
    fontSize: 34,
    color: colors.mode === 'light' ? colors.text : '#FFFFFF',
    fontWeight: '600',
    textAlign: 'right',
    letterSpacing: -1,
  },

  // Summary Card
  summaryCard: {
    backgroundColor: colors.mode === 'light' ? colors.surface : '#141414',
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
    color: colors.mode === 'light' ? colors.textMuted : '#8E8E93',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    color: colors.mode === 'light' ? colors.text : '#FFFFFF',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.mode === 'light' ? colors.borderLight : 'rgba(255,255,255,0.06)',
  },

  // Action Buttons
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: spacing.lg,
  },
  actionCard: {
    flex: 1,
    backgroundColor: colors.mode === 'light' ? colors.surface : '#141414',
    borderRadius: borderRadii.lg,
    padding: spacing.md,
    minHeight: 108,
  },
  actionIconRing: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: colors.mode === 'light' ? colors.borderLight : 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionSub: {
    fontSize: 10,
    color: colors.mode === 'light' ? colors.textMuted : '#6E6E73',
    fontWeight: '500',
    marginTop: 'auto',
    paddingTop: spacing.md,
  },
  actionTitle: {
    fontSize: 13,
    color: colors.mode === 'light' ? colors.text : '#FFFFFF',
    fontWeight: '600',
    marginTop: 3,
  },

  // Recent Transactions
  recentCard: {
    backgroundColor: colors.mode === 'light' ? colors.surface : '#141414',
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
    color: colors.mode === 'light' ? colors.text : '#FFFFFF',
    fontWeight: '600',
  },
  recentSeeAll: {
    fontSize: 12,
    color: colors.mode === 'light' ? colors.textMuted : '#8E8E93',
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
    backgroundColor: colors.mode === 'light' ? colors.border : 'rgba(255,255,255,0.05)',
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
    color: colors.mode === 'light' ? colors.text : '#FFFFFF',
    fontWeight: '500',
  },
  txnSub: {
    fontSize: 11,
    color: colors.mode === 'light' ? colors.textMuted : '#6E6E73',
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
    color: colors.mode === 'light' ? colors.textMuted : '#6E6E73',
    fontWeight: '400',
  },

  // Chart
  chartCard: {
    backgroundColor: colors.mode === 'light' ? colors.surface : '#141414',
    borderRadius: borderRadii.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  chartTitle: {
    fontSize: 15,
    color: colors.mode === 'light' ? colors.text : '#FFFFFF',
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
    color: colors.mode === 'light' ? colors.textMuted : '#8E8E93',
    marginBottom: 6,
    fontWeight: '500',
  },
  barTrack: {
    width: 42,
    height: 96,
    backgroundColor: colors.mode === 'light' ? colors.cardDark : '#1C1C1E',
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
    color: colors.mode === 'light' ? colors.textMuted : '#CCCCCC',
    fontWeight: '500',
    flex: 1,
  },
  emptyChart: {
    fontSize: 13,
    color: colors.mode === 'light' ? colors.textMuted : '#6E6E73',
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
    backgroundColor: colors.mode === 'light' ? colors.surface : '#141414',
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
    color: colors.mode === 'light' ? colors.textMuted : '#8E8E93',
    fontWeight: '500',
    marginBottom: 2,
  },
  otherCatAmount: {
    fontSize: 13,
    color: colors.mode === 'light' ? colors.text : '#FFFFFF',
    fontWeight: '600',
  },
});
