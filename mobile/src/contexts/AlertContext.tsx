import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { typography, borderRadii, spacing, useThemeColors } from '../constants/theme';

export interface AlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

interface AlertContextType {
  showAlert: (title: string, message?: string, buttons?: AlertButton[]) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) throw new Error('useAlert must be used within an AlertProvider');
  return context;
};

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const [visible, setVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{title: string, message?: string, buttons?: AlertButton[]}>({
    title: '',
  });
  const colors = useThemeColors();

  const showAlert = useCallback((title: string, message?: string, buttons?: AlertButton[]) => {
    setAlertConfig({ title, message, buttons: buttons || [{ text: 'OK' }] });
    setVisible(true);
  }, []);

  const hideAlert = useCallback(() => {
    setVisible(false);
  }, []);

  const renderButtons = () => {
    const buttons = alertConfig.buttons || [{ text: 'OK' }];
    const isRowLayout = buttons.length === 2;

    return (
      <View style={[styles.buttonContainer, isRowLayout ? { flexDirection: 'row' } : { flexDirection: 'column' }]}>
        {buttons.map((btn, index) => {
          const isCancel = btn.style === 'cancel';
          const isDestructive = btn.style === 'destructive';
          
          let btnColor = colors.cardLight; // slightly lighter/darker than cardDark
          let textColor = colors.primary;
          
          if (isCancel) {
            btnColor = 'transparent';
            textColor = colors.textMuted;
          } else if (isDestructive) {
            btnColor = 'rgba(255, 107, 107, 0.15)';
            textColor = colors.accentSecondary; // Red
          } else {
            btnColor = colors.primary;
            textColor = colors.textInverse;
          }

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.button,
                { backgroundColor: btnColor },
                isRowLayout && { flex: 1 }
              ]}
              onPress={() => {
                hideAlert();
                if (btn.onPress) {
                  setTimeout(btn.onPress, 150); // slight delay to allow animation out
                }
              }}
            >
              <Text style={[styles.buttonText, { color: textColor }]}>
                {btn.text}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const styles = getStyles(colors);

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      <AnimatePresence>
        {visible && (
          <Modal transparent visible={true} animationType="none" onRequestClose={hideAlert}>
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'timing', duration: 200 }}
              style={styles.overlay}
            >
              <MotiView
                from={{ scale: 0.95, opacity: 0, translateY: 10 }}
                animate={{ scale: 1, opacity: 1, translateY: 0 }}
                exit={{ scale: 0.95, opacity: 0, translateY: 10 }}
                transition={{ type: 'timing', duration: 250 }}
                style={styles.modalBox}
              >
                <View style={styles.textContainer}>
                  <Text style={styles.title}>{alertConfig.title}</Text>
                  {alertConfig.message && (
                    <Text style={styles.message}>{alertConfig.message}</Text>
                  )}
                </View>
                {renderButtons()}
              </MotiView>
            </MotiView>
          </Modal>
        )}
      </AnimatePresence>
    </AlertContext.Provider>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.mode === 'light' ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalBox: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.mode === 'light' ? colors.surface : colors.cardDark,
    borderRadius: borderRadii.xl,
    padding: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: colors.mode === 'light' ? 0.15 : 0.5,
    shadowRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.mode === 'light' ? colors.borderLight : 'rgba(255, 255, 255, 0.05)',
  },
  textContainer: {
    marginBottom: spacing.xxl,
    alignItems: 'center',
  },
  title: {
    ...typography.heading3,
    color: colors.mode === 'light' ? colors.text : colors.primary,
    fontWeight: '700',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  message: {
    ...typography.bodyMedium,
    color: colors.mode === 'light' ? colors.textMuted : 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadii.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
