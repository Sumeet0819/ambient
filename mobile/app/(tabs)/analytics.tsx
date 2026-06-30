import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, ChevronDown, MoreHorizontal, Calendar as CalendarIcon, Upload, ArrowUpRight } from 'lucide-react-native';
import { format, getDate, getDaysInMonth, startOfMonth, getDay } from 'date-fns';
import { api } from '../../src/lib/api';
import { typography, borderRadii, spacing, useThemeColors } from '../../src/constants/theme';
import { IconButton } from '../../src/components/ui/IconButton';
import { ProgressBar } from '../../src/components/ui/ProgressBar';
import { formatCurrency, getCurrencySymbol } from '../../src/lib/format';
import { MotiView } from 'moti';
import { Easing } from 'react-native-reanimated';

export default function AnalyticsScreen() {
  const colors = useThemeColors();
  const styles = getStyles(colors);
  const [selectedDate, setSelectedDate] = useState(getDate(new Date()));
  const [transactions, setTransactions] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditingLimit, setIsEditingLimit] = useState(false);
  const [limitInput, setLimitInput] = useState('');

  const currentMonth = new Date();
  
  const fetchData = useCallback(async () => {
    try {
      const monthStr = format(currentMonth, 'yyyy-MM');
      const [txRes, sumRes] = await Promise.all([
        api.get('/transactions'),
        api.get(`/analytics/monthly?month=${monthStr}`)
      ]);
      setTransactions(txRes.data.data);
      setSummary(sumRes.data.data);
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const daysInMonth = getDaysInMonth(currentMonth);
  const startDayOffset = (getDay(startOfMonth(currentMonth)) + 6) % 7; // Monday start
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const calendarGrid = Array(startDayOffset).fill(null).concat(days);

  // Derive dynamic calendar markers based on transactions
  const txDays = new Set(transactions.map(t => getDate(new Date(t.transaction_date))));

  const isGreen = (d: number) => txDays.has(d) && d !== selectedDate;
  const isBlack = (d: number) => d === selectedDate;
  const isPattern = (d: number) => !txDays.has(d) && d < getDate(new Date());

  // Aggregate selected date amounts
  const selectedTxns = transactions.filter(t => getDate(new Date(t.transaction_date)) === selectedDate);
  const dailySpent = selectedTxns.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0);
  
  const limit = summary?.monthlyLimit || 50000;
  const totalSpent = summary?.totalExpense || 0;
  const baseCurrency = transactions.length > 0 ? (transactions[0].currency || 'INR') : 'INR';
  
  const formatAmountSplit = (amount: number) => {
     const formatted = formatCurrency(amount, baseCurrency);
     const splitIndex = formatted.lastIndexOf('.');
     if (splitIndex === -1) return { main: formatted, dec: '.00' };
     return { main: formatted.substring(0, splitIndex), dec: formatted.substring(splitIndex) };
  };

  const dailyFormatted = formatAmountSplit(dailySpent);

  const handleSaveLimit = async () => {
    const val = parseFloat(limitInput);
    if (!isNaN(val) && val > 0) {
      try {
        await api.post('/analytics/monthly-limit', {
          month: format(currentMonth, 'yyyy-MM'),
          limit: val
        });
        setSummary((prev: any) => ({ ...prev, monthlyLimit: val }));
      } catch (error) {
        console.error('Failed to update limit:', error);
      }
    }
    setIsEditingLimit(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <MotiView 
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, easing: Easing.out(Easing.ease) }}
          style={styles.header}
        >
          <View style={styles.monthPill}>
            <Text style={styles.monthText}>{format(currentMonth, 'MMMM')}</Text>
            <ChevronDown size={16} color={colors.textLight} style={{marginLeft: 4}} />
          </View>
        </MotiView>

        {/* Calendar Grid */}
        <MotiView 
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 400, delay: 100, easing: Easing.out(Easing.ease) }}
          style={styles.calendarContainer}
        >
          <View style={styles.weekDaysRow}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
              <View key={i} style={styles.dayCellWrapper}>
                <Text style={styles.weekDayText}>{day}</Text>
              </View>
            ))}
          </View>
          
          <View style={styles.daysGrid}>
            {calendarGrid.map((day, i) => {
              if (!day) return <View key={`empty-${i}`} style={styles.dayCellWrapper} />;
              
              let bg = 'transparent';
              let color = colors.textLight;
              
              if (isBlack(day)) {
                 bg = colors.secondary;
                 color = colors.primary;
              } else if (isGreen(day)) {
                 bg = colors.accent;
              } else if (isPattern(day)) {
                 bg = colors.cardLight;
              }

              return (
                <View key={`day-wrap-${day}`} style={styles.dayCellWrapper}>
                  <TouchableOpacity 
                    key={`day-${day}`} 
                    style={[styles.dayCell, { backgroundColor: bg }]}
                    onPress={() => setSelectedDate(day)}
                  >
                    <Text style={[styles.dayText, { color }]}>{day}</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </MotiView>

        {/* Selected Date Details */}
        <MotiView 
          from={{ opacity: 0, translateY: 30 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 200, easing: Easing.out(Easing.ease) }}
          style={styles.dateDetailsRow}
        >
           <Text style={styles.dateLarge}>{selectedDate} {format(currentMonth, 'MMMM')}</Text>
           {dailySpent > 0 && (
              <View style={styles.percentBadge}><Text style={styles.percentBadgeText}>Active</Text></View>
           )}
           <View style={{flex: 1}} />
           <MoreHorizontal size={24} color={colors.textLight} />
        </MotiView>

        {/* Financial Progress Bars */}
        <MotiView 
          from={{ opacity: 0, translateY: 30 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 300, easing: Easing.out(Easing.ease) }}
          style={styles.progressSection}
        >
          <TouchableOpacity 
            style={styles.progressRowHeader}
            onPress={() => {
              setLimitInput(limit.toString());
              setIsEditingLimit(true);
            }}
          >
            <Text style={styles.progressTitle}>Financial</Text>
            <Text style={styles.progressSub}>of {formatCurrency(limit, baseCurrency)} spent <Text style={{textDecorationLine: 'underline'}}>Edit</Text></Text>
          </TouchableOpacity>
          <ProgressBar progress={totalSpent/limit || 0} height={16} fillColor={colors.secondary} trackColor={colors.cardLight} />
        </MotiView>

      </ScrollView>

      {/* Bottom Sheet Card */}
      <MotiView 
        from={{ opacity: 0, translateY: 100 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 500, delay: 400, easing: Easing.out(Easing.ease) }}
        style={styles.bottomCard}
      >
         <View style={styles.bottomCardHeader}>
            <View style={styles.bottomCardTitleRow}>
               <CalendarIcon size={20} color={colors.textDark} />
               <View style={{marginLeft: 12}}>
                  <Text style={styles.bottomCardDate}>{selectedDate} {format(currentMonth, 'MMMM')}</Text>
                  <Text style={styles.bottomCardSub}>Daily Spent</Text>
               </View>
            </View>
            <View style={styles.bottomCardActions}>
               <Upload size={20} color={colors.textDark} />
               <ArrowUpRight size={20} color={colors.textDark} style={{marginLeft: 16}} />
            </View>
         </View>
         
         {loading ? (
             <ActivityIndicator color={colors.accent} style={{marginTop: 20}}/>
         ) : (
            <View style={styles.amountsRow}>
                <View style={styles.amountItem}>
                  <Text style={styles.amountText}>{dailyFormatted.main}<Text style={styles.amountDecimal}>{dailyFormatted.dec}</Text></Text>
                  <View style={styles.amountActiveIndicator} />
                </View>
            </View>
         )}
      </MotiView>

      <Modal visible={isEditingLimit} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Monthly Limit</Text>
            <TextInput 
              style={styles.limitInput}
              value={limitInput}
              onChangeText={setLimitInput}
              keyboardType="numeric"
              placeholder="Enter amount"
              placeholderTextColor={colors.textMuted}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setIsEditingLimit(false)} style={styles.modalBtn}>
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveLimit} style={[styles.modalBtn, { backgroundColor: colors.accent }]}>
                <Text style={[styles.modalBtnText, { color: colors.primary }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: 220 }, // Space for bottom card
  
  header: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: spacing.md, marginBottom: spacing.xl },
  monthPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, backgroundColor: colors.cardLight, borderRadius: borderRadii.pill },
  monthText: { ...typography.bodyMedium, fontWeight: '500' },
  
  calendarContainer: { marginBottom: spacing.xl },
  weekDaysRow: { flexDirection: 'row', paddingHorizontal: spacing.sm, marginBottom: spacing.md },
  weekDayText: { textAlign: 'center', ...typography.bodyMedium, color: colors.textMuted },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.sm },
  dayCellWrapper: { width: '14.28%', alignItems: 'center', marginBottom: spacing.sm },
  dayCell: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  dayText: { ...typography.bodyMedium, fontWeight: '500' },
  
  dateDetailsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  dateLarge: { ...typography.heading2, letterSpacing: -1 },
  percentBadge: { backgroundColor: colors.secondary, borderRadius: borderRadii.pill, paddingHorizontal: 8, paddingVertical: 4, marginLeft: spacing.md },
  percentBadgeText: { color: colors.primary, ...typography.label },
  
  progressSection: { marginBottom: spacing.xl },
  progressRowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 },
  progressTitle: { ...typography.bodyLarge },
  progressSub: { ...typography.label, color: colors.textMuted, fontWeight: '400' },
  
  bottomCard: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.secondary, borderTopLeftRadius: borderRadii.xl, borderTopRightRadius: borderRadii.xl, padding: spacing.lg, paddingBottom: 120 },
  bottomCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
  bottomCardTitleRow: { flexDirection: 'row', alignItems: 'center' },
  bottomCardDate: { color: colors.textDark, ...typography.bodyMedium, fontWeight: '600' },
  bottomCardSub: { color: colors.textMuted, ...typography.bodySmall },
  bottomCardActions: { flexDirection: 'row', alignItems: 'center' },
  
  amountsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  amountItem: { alignItems: 'flex-start' },
  amountText: { color: colors.textDark, ...typography.heading3 },
  amountDecimal: { fontSize: 14, fontWeight: '400' },
  amountActiveIndicator: { width: 40, height: 4, backgroundColor: colors.accent, borderRadius: 2, marginTop: 8 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: colors.cardLight, padding: spacing.xl, borderRadius: borderRadii.lg, width: '80%' },
  modalTitle: { ...typography.heading3, marginBottom: spacing.md, color: colors.textLight },
  limitInput: { backgroundColor: colors.primary, color: colors.textLight, padding: spacing.md, borderRadius: borderRadii.md, ...typography.bodyLarge, marginBottom: spacing.lg },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.md },
  modalBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: borderRadii.md },
  modalBtnText: { ...typography.bodyMedium, color: colors.textLight, fontWeight: '600' }
});
