import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/lib/constants";

export function Badge({
  label,
  color = colors.primary,
}: {
  label: string;
  color?: string;
}) {
  return (
    <View style={[styles.badge, { backgroundColor: `${color}22`, borderColor: `${color}55` }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  text: { fontSize: 11, fontWeight: "600" },
});
