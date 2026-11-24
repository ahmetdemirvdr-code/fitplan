const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Prefer the mobile package's own node_modules; fall back to repo root if needed.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// Do NOT watch the whole monorepo (that would slow Metro). Only block Next.js web paths.
const escape = (p) => p.replace(/[/\\]/g, "[/\\\\]");
config.resolver.blockList = [
  new RegExp(`${escape(path.resolve(monorepoRoot, "src"))}[/\\\\].*`),
  new RegExp(`${escape(path.resolve(monorepoRoot, ".next"))}[/\\\\].*`),
  /node_modules[/\\].*[/\\]node_modules[/\\]react-native[/\\].*/,
];

module.exports = config;
