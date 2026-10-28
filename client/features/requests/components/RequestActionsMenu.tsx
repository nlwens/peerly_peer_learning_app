import { useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, StyleSheet as RNStyleSheet } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { COLORS } from '@/constants/theme';

export type RequestAction = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

type Props = {
  actions: RequestAction[];
};

const MENU_WIDTH = 160;

export default function RequestActionsMenu({ actions }: Props) {
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const iconRef = useRef<View | null>(null);

  if (!actions.length) return null;

  const toggleMenu = () => {
    if (open) {
      setOpen(false);
      return;
    }

    // Measure icon position on screen so we can anchor the menu
    iconRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ x, y, width, height });
      setOpen(true);
    });
  };

  const handlePressAction = (action: RequestAction) => {
    if (action.disabled) return;
    setOpen(false);
    action.onPress();
  };

  return (
    <View style={styles.container}>
      <Pressable
        ref={iconRef}
        hitSlop={10}
        onPress={toggleMenu}
        style={styles.iconButton}
        accessibilityRole="button"
        accessibilityLabel="View more actions"
      >
        <Feather name="more-vertical" size={18} color={COLORS.textPrimary} />
      </Pressable>

      {open && anchor && (
        <Modal visible transparent onRequestClose={() => setOpen(false)}>
          <View style={styles.modalRoot}>
            {/* Backdrop to close when tapping outside */}
            <Pressable
              style={RNStyleSheet.absoluteFill}
              onPress={() => setOpen(false)}
              accessibilityRole="button"
              accessibilityLabel="Close menu"
            />

            <View
              style={[
                styles.menu,
                {
                  position: 'absolute',
                  top: anchor.y + anchor.height + 4,
                  left: Math.max(8, anchor.x + anchor.width - MENU_WIDTH),
                  width: MENU_WIDTH,
                },
              ]}
            >
              {actions.map((action, index) => (
                <Pressable
                  key={action.label}
                  disabled={action.disabled}
                  onPress={() => handlePressAction(action)}
                  style={[
                    styles.menuItem,
                    action.disabled && styles.menuItemDisabled,
                    index === actions.length - 1 && styles.menuItemLast,
                  ]}
                  accessibilityRole="menuitem"
                  accessibilityLabel={action.label}
                  accessibilityState={{ disabled: action.disabled }}
                >
                  <Text style={[styles.menuItemText, action.disabled && styles.menuItemTextDisabled]}>
                    {action.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginLeft: 4,
  },
  iconButton: {
    padding: 4,
  },
  modalRoot: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  menu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 4,
    minWidth: MENU_WIDTH,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  menuItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
  },
  menuItemDisabled: {
    backgroundColor: '#F3F3F3',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemText: {
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  menuItemTextDisabled: {
    color: COLORS.textMuted,
  },
});
