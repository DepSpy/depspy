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
  "https://registry.npmjs.org",
  "https://registry.npmmirror.com",
  " https://registry.yarnpkg.com",
];
export const HOST_MAX_FETCH_NUMBER = 6;
