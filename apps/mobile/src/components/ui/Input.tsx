import { StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { colors } from "@/lib/constants";

export function Input({
  label,
  error,
  ...props
}: TextInputProps & { label?: string; error?: string }) {
  return (
    <View style={styles.wrap}>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        placeholderTextColor={colors.textMuted}
        {...props}
        style={[styles.input, props.style]}
      />
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { color: colors.textPrimary, fontSize: 13, fontWeight: "600" },
  input: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
    color: colors.textPrimary,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  error: { color: colors.danger, fontSize: 12 },
});
