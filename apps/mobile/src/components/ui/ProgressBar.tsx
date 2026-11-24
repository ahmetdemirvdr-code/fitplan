import { StyleSheet, View } from "react-native";
import { colors } from "@/lib/constants";

export function ProgressBar({
  percent,
  color = colors.primary,
}: {
  percent: number;
  color?: string;
}) {
  const width = Math.max(0, Math.min(100, percent));
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${width}%`, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.background,
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: 999 },
});
