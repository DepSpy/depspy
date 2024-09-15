import { Plugin } from "vite";
//剔除node模块以免浏览器报错
export default function neutralization(external: string[]): Plugin {
  const externalSet = new Set(external);
  return {
    name: "neutralization",
    enforce: "pre",
    resolveId(id) {
      if (externalSet.has(id)) {
        return id;
      }
    },
    load(id) {
      if (externalSet.has(id)) {
        return `export default {}`;
      }
    },
  };
}
