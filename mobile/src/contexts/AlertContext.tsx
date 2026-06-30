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
    return (
      <View style={styles.buttonContainer}>
        {buttons.map((btn, index) => {
          const isCancel = btn.style === 'cancel';
          const isDestructive = btn.style === 'destructive';
          
          let btnColor = colors.cardDark;
          let textColor = colors.primary;
          
          if (isCancel) {
            btnColor = 'transparent';
            textColor = colors.textMuted;
          } else if (isDestructive) {
            btnColor = 'rgba(255, 107, 107, 0.15)';
            textColor = colors.accentSecondary; // Red
          } else {
            btnColor = colors.accent;
            textColor = colors.secondary; // Black text on green
          }

          return (
            <TouchableOpacity
              key={index}
              style={[styles.button, { backgroundColor: btnColor }]}
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
                from={{ scale: 0.9, opacity: 0, translateY: 20 }}
                animate={{ scale: 1, opacity: 1, translateY: 0 }}
                exit={{ scale: 0.9, opacity: 0, translateY: 20 }}
                transition={{ type: 'timing', duration: 250 }}
                style={[styles.modalBox, { backgroundColor: colors.cardLight }]}
              >
                <Text style={[styles.title, { color: colors.primary }]}>{alertConfig.title}</Text>
                {alertConfig.message && (
                  <Text style={[styles.message, { color: colors.textMuted }]}>{alertConfig.message}</Text>
                )}
                {renderButtons()}
              </MotiView>
            </MotiView>
          </Modal>
        )}
      </AnimatePresence>
    </AlertContext.Provider>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalBox: {
    width: '100%',
    maxWidth: 340,
    borderRadius: borderRadii.lg,
    padding: spacing.xl,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  title: {
    ...typography.heading3,
    fontWeight: '700',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  message: {
    ...typography.bodyMedium,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  button: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadii.pill,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  buttonText: {
    ...typography.label,
    fontWeight: '700',
  },
});
