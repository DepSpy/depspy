import { Node } from "~/types.ts";

function getParentKey(key: string) {
  return key.split("!").slice(0, -1).join("!");
}

export const generateTree = (treeMap: Map<string, Node>) => {
  const roots = [];

  for (const [key, node] of treeMap) {
    if (treeMap.has(getParentKey(key))) {
      const parent = treeMap.get(getParentKey(key));
      const name = node.path[node.path.length - 1];
      parent.dependencies[name] = node;
      node.parent = parent;
    } else {
      roots.push(node);
    }
  }
  return roots;
};
