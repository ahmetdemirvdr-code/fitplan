const { withGradleProperties } = require("expo/config-plugins");

/**
 * Speeds up local/EAS Android builds via Gradle daemon, parallelism, and build cache.
 * Skips configuration-cache / configureondemand — those often break Expo/RN AGP builds.
 */
module.exports = function withGradlePerformance(config) {
  return withGradleProperties(config, (config) => {
    const props = config.modResults;

    const setProperty = (key, value) => {
      const existing = props.findIndex(
        (p) => p.type === "property" && p.key === key
      );
      if (existing >= 0) {
        props[existing].value = value;
      } else {
        props.push({ type: "property", key, value });
      }
    };

    setProperty(
      "org.gradle.jvmargs",
      "-Xmx4g -XX:MaxMetaspaceSize=512m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8"
    );
    setProperty("org.gradle.parallel", "true");
    setProperty("org.gradle.caching", "true");
    setProperty("org.gradle.daemon", "true");
    // Faster incremental rebuilds when android/ is kept between builds
    setProperty("android.enableBuildCache", "true");

    return config;
  });
};
