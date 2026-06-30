import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { format, isToday, isYesterday } from 'date-fns';
import { ChevronLeft, Grid, MoreHorizontal, ArrowUpRight, ArrowDownRight, Search, Layout, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../../src/lib/api';
import { fetchTransactions, uploadReceiptOCR } from '../../src/store/transactions.slice';
import { AppDispatch, RootState } from '../../src/store';
import { typography, borderRadii, spacing, useThemeColors } from '../../src/constants/theme';
import { IconButton } from '../../src/components/ui/IconButton';
import { ProgressBar } from '../../src/components/ui/ProgressBar';
import { formatCurrency, getCurrencySymbol } from '../../src/lib/format';
import { MotiView } from 'moti';
import { Easing } from 'react-native-reanimated';
import { useAlert } from '../../src/contexts/AlertContext';

export default function TransactionsScreen() {
  const colors = useThemeColors();
  const styles = getStyles(colors);
  const dispatch = useDispatch<AppDispatch>();
  const { items: transactions, loading } = useSelector((state: RootState) => state.transactions);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const { showAlert } = useAlert();

  const handleOCR = async () => {
    showAlert(
      "Scan Receipt",
      "Choose an option",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Camera",
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              showAlert('Permissions Required', 'Camera permissions are required');
              return;
            }
            let result = await ImagePicker.launchCameraAsync({
              base64: true,
              quality: 0.5,
            });
            if (!result.canceled && result.assets && result.assets[0].base64) {
              processOCR(result.assets[0].base64, result.assets[0].mimeType || 'image/jpeg');
            }
          }
        },
        {
          text: "Gallery",
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              showAlert('Permissions Required', 'Gallery permissions are required');
              return;
            }
            let result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              base64: true,
              quality: 0.5,
            });
            if (!result.canceled && result.assets && result.assets[0].base64) {
              processOCR(result.assets[0].base64, result.assets[0].mimeType || 'image/jpeg');
            }
          }
        }
      ]
    );
  };

  const processOCR = async (base64: string, mimeType: string) => {
    setOcrLoading(true);
    try {
      await dispatch(uploadReceiptOCR({ imageBase64: base64, mimeType })).unwrap();
      showAlert('Success', 'Transactions extracted successfully!');
      fetchData(); // Refresh summary and transactions
    } catch (e: any) {
      showAlert('Error', e.message || 'Failed to process receipt');
    } finally {
      setOcrLoading(false);
    }
  };

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

  const limit = summary?.monthlyLimit || 50000; // Temporary default to show UI progress
  const spent = summary?.totalExpense || 0;
  const progress = limit > 0 ? Math.min(spent / limit, 1) : 0;
  const percentage = Math.round(progress * 100) || 0;
  
  const availableAmount = Math.max(limit - spent, 0);
  const formattedAvailable = formatCurrency(availableAmount, baseCurrency);
  const availSplitIndex = formattedAvailable.lastIndexOf('.');
  const availMain = availSplitIndex !== -1 ? formattedAvailable.substring(0, availSplitIndex) : formattedAvailable;
  const availDecimal = availSplitIndex !== -1 ? formattedAvailable.substring(availSplitIndex) : '.00';

  const filteredTransactions = selectedCategory
    ? transactions.filter(t => t.categories?.name === selectedCategory)
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
             <View style={{flexDirection: 'row', gap: 12}}>
               {ocrLoading ? (
                 <View style={{width: 44, height: 44, justifyContent: 'center', alignItems: 'center'}}>
                   <ActivityIndicator size="small" color={colors.secondary} />
                 </View>
               ) : (
                 <IconButton icon={Camera} variant="black" size={44} onPress={handleOCR} />
               )}
             </View>
          </View>
          
          <View style={styles.planSection}>
            <View style={{ marginBottom: spacing.md }}>
               <Text style={[typography.displayDigital, { color: colors.secondary, letterSpacing: -1, lineHeight: 60 }]} numberOfLines={1} adjustsFontSizeToFit>
                 {availMain}<Text style={{ opacity: 0.5 }}>{availDecimal}</Text>
               </Text>
               <Text style={{ fontFamily: 'Quantico_700Bold', color: colors.secondary, fontSize: 12, marginTop: 2, letterSpacing: 1 }}>
                 AVAILABLE
               </Text>
            </View>
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
                style={[styles.filterPill, selectedCategory === cat.name && styles.filterPillActive]}
                onPress={() => setSelectedCategory(cat.name)}
              >
                <Text style={[styles.filterPillText, selectedCategory === cat.name && styles.filterPillTextActive]}>
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

const getStyles = (colors: any) => StyleSheet.create({
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
  planSection: { marginTop: spacing.xl},
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
