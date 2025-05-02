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
// 是否由DepSpy启动，vite插件需要据此判断是否启动
export const DEP_SPY_START = "DEP_SPY_START";
// 是否由vite子插件运行时标记，避免主插件循环使用
export const DEP_SPY_SUB_START = "DEP_SPY_SUB_START";
// 是否由Vite进行构建
export const DEP_SPY_VITE_BUILD = "DEP_SPY_VITE_BUILD";
// 是否由Webpack进行构建
export const DEP_SPY_WEBPACK_BUILD = "DEP_SPY_WEBPACK_BUILD";
// 是否是inject模式
export const DEP_SPY_INJECT_MODE = "DEP_SPY_INJECT_MODE";
// 用户配置的对比的commithash
export const DEP_SPY_COMMIT_HASH = "DEP_SPY_COMMIT_HASH";
// 代码依赖树挂载在window上的变量名
export const DEP_SPY_WINDOW_VAR = "__DEP_SPY_STATIC_TREE__";
// 引入副作用的自定义变量名
export const SIDE_EFFECT_NAME = "";
// 全量引入的变量名
export const ALL_EXPORT_NAME = "*"