import { getNodeByPath } from "@/contexts/api.ts";

export const isExistDepByPath = (root: any, paths: string[]): boolean => {
  let curRoot = root;
  if (!root || root.name !== "dep-spy") {
    console.log("isExistDepByPath", root);
  }
  const push = [curRoot.name];
  for (const path of paths.slice(1)) {
    if (!curRoot.dependencies[path]) {
      console.error(
        `预计：${paths.join(">")},实际：${push.join(">")},最后节点：`,
        curRoot,
      );
      return false;
    }
    curRoot = curRoot.dependencies[path];
    if (curRoot && curRoot.name) push.push(curRoot.name);
  }
  return true;
};


export const isRightGetNodeByPath = async  (name: string, paths: string[], data: any): boolean => {
  console.log(data, name);
}