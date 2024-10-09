import { path } from "d3";
import { Node } from "~/types";

const baseUrl = "http://localhost:2023";


async function getNodeDfs(root: Node, curDepth: number, depth: number) {
    
    // 过滤没有子节点的节点
  const existDeps = root && root.dependencies? Object.values(root.dependencies).filter((dep) => Object.values((dep as any).dependenciesList).length): [];
  const depsData = (await Promise.all(existDeps.map(async (dep) => {
    const query = {
        id: dep.name + dep.declarationVersion,
        depth: 2,
        path: dep.path? dep.path: ""
    }
    const res = await getNode(query);
    dep.dependencies = res.data.dependencies;
    return dep
  }))).filter(dep => dep && dep.dependencies && Object.values(dep.dependencies).length); // 过滤没有子节点的节点
  if(depsData.length && curDepth < depth) {
    for(const dep of depsData) {
      await getNodeDfs(dep, curDepth + 1, depth);
    }
  }
}

export const getNode = async (query: {
  id?: string;
  depth?: number;
  path?: string[] | string;
}) => {
    let result = {};
    
  const res = await fetch(
    `${baseUrl}/getNode?${stringifyObjToParams({ ...query, depth: 2 })}`,
  );
  const data = await res.json();
  let root: Node;
  if(query.id) {
    root = data.data
  } else {
    root = data.data.root
  }

  if (query.depth > 2) {
    await getNodeDfs(root, 2, query.depth);
  }
  return data;
};

export const searchNode = async (query: { key?: string }) => {
  const res = await fetch(
    `${baseUrl}/searchNode?${stringifyObjToParams(query)}`,
  );
  return res.json();
};

export const updateDepth = async (query: { depth: number }) => {
  const res = await fetch(
    `${baseUrl}/updateDepth?${stringifyObjToParams(query)}`,
  );
  return res;
};

function stringifyObjToParams(obj: any) {
  return Object.entries(obj)
    .map(([key, value]) => {
      if (typeof value === "object") return `${key}=${JSON.stringify(value)}`;
      return `${key}=${value}`;
    })
    .join("&");
}
