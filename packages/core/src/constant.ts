export const defaultConfig = {
  depth: 3,
  entry: null,
  output: {
    graph: "ds.graph.json",
    staticGraph: "ds.static.json",
    circularDependency: "ds.circular.json",
    codependency: "ds.co.json",
  },
};
export const NPM_DOMAINS = [
  "https://registry.npmjs.org", // 官方
  "https://registry.npmmirror.com", // 淘宝
  "https://registry.yarnpkg.com", // yarn
  "http://mirrors.cloud.tencent.com/npm", // 腾讯
  "https://mirrors.huaweicloud.com/repository/npm", // 华为
];
export const HOST_MAX_FETCH_NUMBER = 6;
