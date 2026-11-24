import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type ViewStyle,
} from "react-native";
import { colors } from "@/lib/constants";

type Variant = "primary" | "outline" | "ghost" | "destructive";

export function Button({
  title,
  loading,
  variant = "primary",
  style,
  disabled,
  ...props
}: PressableProps & {
  title: string;
  loading?: boolean;
  variant?: Variant;
}) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      {...props}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style as ViewStyle,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "outline" || variant === "ghost" ? colors.primary : "#fff"} />
      ) : (
        <Text
          style={[
            styles.text,
            (variant === "outline" || variant === "ghost") && styles.textOutline,
            variant === "destructive" && styles.textDestructive,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  primary: { backgroundColor: colors.primary },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghost: { backgroundColor: "transparent" },
  destructive: { backgroundColor: "rgba(231,76,60,0.15)", borderWidth: 1, borderColor: "rgba(231,76,60,0.4)" },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.55 },
  text: { color: "#fff", fontWeight: "700", fontSize: 15 },
  textOutline: { color: colors.textPrimary },
  textDestructive: { color: colors.danger },
});
