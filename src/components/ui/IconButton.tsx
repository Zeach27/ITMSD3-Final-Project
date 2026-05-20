import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

interface IconButtonProps {
  icon: string;
  label?: string;
  active?: boolean;
  onPress: () => void;
  disabled?: boolean;
}

export function IconButton({ icon, label, active = false, onPress, disabled }: IconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        active && styles.active,
        pressed && !disabled ? styles.pressed : undefined,
        disabled && styles.disabled,
      ]}>
      <Text style={[styles.icon, active && styles.iconActive]}>{icon}</Text>
      {label ? <Text style={[styles.label, active && styles.labelActive]}>{label}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
    marginVertical: 4,
  },
  active: {
    backgroundColor: '#3A3A3C',
  },
  pressed: {
    backgroundColor: '#2A2A2E',
  },
  disabled: {
    opacity: 0.3,
  },
  icon: {
    color: '#FFFFFF',
    fontSize: 20,
  },
  iconActive: {
    color: '#FFFFFF',
  },
  label: {
    color: '#8E8E93',
    fontSize: 10,
    marginTop: 2,
  },
  labelActive: {
    color: '#5856D6',
  },
});
