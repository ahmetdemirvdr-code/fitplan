import { StyleSheet, Text, View } from "react-native";
import { getAvatarById } from "@/lib/avatars";

export function UserAvatar({
  avatarId,
  size = 48,
}: {
  avatarId?: string | null;
  size?: number;
}) {
  const avatar = getAvatarById(avatarId);
  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: avatar.color,
        },
      ]}
    >
      <Text style={[styles.letter, { fontSize: size * 0.38 }]}>
        {avatar.label.slice(0, 1)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: "center", justifyContent: "center" },
  letter: { color: "#fff", fontWeight: "800" },
});
