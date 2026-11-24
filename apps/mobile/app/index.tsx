import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  BackHandler,
  Platform,
  StyleSheet,
  View,
  type AppStateStatus,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pedometer } from "expo-sensors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { WebView } from "react-native-webview";
import type { WebViewNavigation } from "react-native-webview";
import { colors } from "@/lib/constants";

const PWA_URL = "https://strivefit.duckdns.org";
const STEPS_SYNC_KEY = "strive_device_steps_synced_today";

const INJECTED_BOOT = `
(function() {
  try {
    document.documentElement.classList.add('strive-android-app');
    document.body && document.body.classList.add('strive-android-app');
    var style = document.createElement('style');
    style.id = 'strive-android-safe-area';
    style.textContent = [
      'html.strive-android-app nav.fixed.bottom-0 {',
      '  padding-bottom: 0 !important;',
      '}',
      'html.strive-android-app main {',
      '  padding-bottom: 4rem !important;',
      '}',
    ].join('\\n');
    if (!document.getElementById('strive-android-safe-area')) {
      document.documentElement.appendChild(style);
    }
  } catch (e) {}
  true;
})();
`;

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export default function PwaShellScreen() {
  const webRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [booting, setBooting] = useState(true);
  const lastPostedRef = useRef(0);
  const pendingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const postDeviceSteps = useCallback((steps: number) => {
    const safe = Math.max(0, Math.floor(steps));
    if (safe < 1 || safe <= lastPostedRef.current) return;
    if (pendingRef.current) clearTimeout(pendingRef.current);
    pendingRef.current = setTimeout(() => {
      if (safe <= lastPostedRef.current) return;
      lastPostedRef.current = safe;
      const js = `
(async function() {
  try {
    await fetch('/api/steps/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ steps: ${safe}, source: 'DEVICE', replaceToday: true })
    });
  } catch (e) {}
  true;
})();
`;
      webRef.current?.injectJavaScript(js);
      void AsyncStorage.setItem(
        STEPS_SYNC_KEY,
        JSON.stringify({ day: todayKey(), steps: safe })
      );
    }, 2500);
  }, []);

  const startPedometer = useCallback(async () => {
    try {
      const available = await Pedometer.isAvailableAsync();
      if (!available) return () => {};

      const perm = await Pedometer.requestPermissionsAsync();
      if (!perm.granted) return () => {};

      let dayBase = 0;
      const stored = await AsyncStorage.getItem(STEPS_SYNC_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as { day?: string; steps?: number };
          if (parsed.day === todayKey() && typeof parsed.steps === "number") {
            dayBase = parsed.steps;
            lastPostedRef.current = parsed.steps;
          } else {
            lastPostedRef.current = 0;
          }
        } catch {
          lastPostedRef.current = 0;
        }
      }

      // watchStepCount: steps since this subscription started (Android)
      const sub = Pedometer.watchStepCount((result) => {
        const sinceStart = Math.max(0, result.steps || 0);
        const total = dayBase + sinceStart;
        if (total > lastPostedRef.current) {
          postDeviceSteps(total);
        }
      });

      // Best-effort Google Fit sync when app opens
      webRef.current?.injectJavaScript(`
(async function() {
  try {
    await fetch('/api/google-health/sync', { method: 'POST', credentials: 'include' });
  } catch (e) {}
  true;
})();
`);

      return () => sub.remove();
    } catch {
      return () => {};
    }
  }, [postDeviceSteps]);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let alive = true;
    void startPedometer().then((fn) => {
      if (!alive) fn();
      else cleanup = fn;
    });

    const onAppState = (state: AppStateStatus) => {
      if (state === "active") {
        void startPedometer().then((fn) => {
          cleanup?.();
          cleanup = fn;
        });
      }
    };
    const sub = AppState.addEventListener("change", onAppState);
    return () => {
      alive = false;
      cleanup?.();
      sub.remove();
    };
  }, [startPedometer]);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") return;
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        if (canGoBack) {
          webRef.current?.goBack();
          return true;
        }
        return false;
      });
      return () => sub.remove();
    }, [canGoBack])
  );

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <WebView
        ref={webRef}
        source={{ uri: PWA_URL }}
        style={styles.webview}
        onLoadEnd={() => setBooting(false)}
        onNavigationStateChange={(nav: WebViewNavigation) => {
          setCanGoBack(nav.canGoBack);
        }}
        injectedJavaScriptBeforeContentLoaded={INJECTED_BOOT}
        injectedJavaScript={INJECTED_BOOT}
        allowsBackForwardNavigationGestures
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        domStorageEnabled
        javaScriptEnabled
        setSupportMultipleWindows={false}
        overScrollMode="never"
        applicationNameForUserAgent="StriveAndroidApp"
        mediaPlaybackRequiresUserAction
      />
      {booting && (
        <View style={styles.loader} pointerEvents="none">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  webview: { flex: 1, backgroundColor: colors.background },
  loader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
});
