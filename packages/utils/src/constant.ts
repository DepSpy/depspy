export const NPM_DOMAIN = "https://registry.npmmirror.com";
export const GITHUB_DOMAIN = "https://github.com";
export const BP_DOMAIN = "https://bundlephobia.com";
export const JSDELIVR_API = "https://cdn.jsdelivr.net/npm";
// npm包名正则
export const NPM_Name_Regex =
  // eslint-disable-next-line no-useless-escape
  /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/i;

export const MODULE_INFO = [
  "name",
  "version",
  "size",
  "resolvePath",
  "description",
  "dependencies",
  "peerDependencies",
];

export const suffixOrder = [
  ".js",
  ".mjs",
  ".ts",
  ".jsx",
  ".tsx",
  ".json",
  ".vue",
];
