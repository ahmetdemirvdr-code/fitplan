# Strive Mobile (Expo / Android)

PWA’yı native kabukta açan Android uygulaması (`WebView` + pedometer).

## Hızlı release APK (önerilen)

`android/` klasörü kalıcı. **`--clean` kullanma** (cache’i yakar).

```bash
cd apps/mobile
npx expo prebuild --platform android
cd android
# Windows (Android Studio JBR):
# $env:JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"
.\gradlew.bat assembleRelease -PreactNativeArchitectures=arm64-v8a
```

APK: `android/app/build/outputs/apk/release/app-release.apk`

### Alternatif: EAS local (Expo hesabı gerekir)

```bash
cd apps/mobile
npx eas-cli@latest build --local --platform android --profile preview
```

## Geliştirme

```bash
npm start
# veya
npm run android
```

API: `EXPO_PUBLIC_API_URL` (varsayılan prod: `https://strivefit.duckdns.org`)
