import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Input({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
  error,
  icon,
  hint,
  ...props
}) {
  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label}
          {error && <Text style={styles.errorText}> - {error}</Text>}
        </Text>
      )}
      <View style={styles.inputContainer}>
        {icon && (
          <View style={styles.iconContainer}>
            <Ionicons name={icon} size={20} color="#6B7280" />
          </View>
        )}
        <TextInput
          style={[
            styles.input,
            icon && styles.inputWithIcon,
            error && styles.inputError,
            multiline && styles.inputMultiline,
          ]}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          textAlignVertical={multiline ? 'top' : 'center'}
          placeholderTextColor="#9CA3AF"
          {...props}
        />
      </View>
      {hint && !error && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  errorText: {
    color: '#EF4444',
    fontWeight: '400',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    position: 'absolute',
    left: 14,
    zIndex: 1,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#111827',
    flex: 1,
  },
  inputWithIcon: {
    paddingLeft: 44,
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  inputMultiline: {
    minHeight: 100,
    paddingTop: 14,
  },
  hint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
    fontStyle: 'italic',
  },
});

