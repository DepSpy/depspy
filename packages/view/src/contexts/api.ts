import { path } from "d3";
import { Node } from "~/types";

const baseUrl = "http://localhost:2023";


async function getNodeDfs(root: Node, curDepth: number, depth: number) {

  // 过滤没有子节点的节点
  const existDeps = root && root.dependencies ? Object.values(root.dependencies).filter((dep) => Object.values((dep as any).dependenciesList).length) : [];
  const depsData = (await Promise.all(existDeps.map(async (dep) => {
    const query = {
      id: dep.name + dep.declarationVersion,
      depth: 2,
      path: dep.path ? dep.path : ""
    }
    const res = await getNode(query);
    dep.dependencies = res.data.dependencies;
    return dep
  }))).filter(dep => dep && dep.dependencies && Object.values(dep.dependencies).length); // 过滤没有子节点的节点
  if (depsData.length && curDepth < depth) {
    for (const dep of depsData) {
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
    `${baseUrl}/getNode?${stringifyObjToParams({ ...query, depth: 3 })}`,
  );
  // 读取readableStream
  const readableStream = res.body;
  const reader = readableStream.getReader();
  const decoder = new TextDecoder("utf-8");
  let done = false;
  const treeLeaves: Node[] = [];
  let buffer = ""
  let len = 0;
  let start = 0;

  while (!done) {
    const { done: doneValue, value } = await reader.read();

    done = doneValue;
    if(done) {
      break;
    }
    // 拼接缓存，暂不考虑跨双buffer的情况
    if(buffer) {
      buffer += decoder.decode(value.slice(start, len), { stream: true });
      start = len;
      console.log(buffer, len);
      
      treeLeaves.push(JSON.parse(buffer));
      buffer = "";
    }
    while (start < value.length) {

      len = parseInt(Array.from(value).slice(start, start + 4).reverse().map(i => {
        let num = i.toString(16);
        // 格式化
        if (num.length < 2) {
          num = '0' + num;
        }
        return num;
      }).join(''), 16);

      if (!done) {
        console.log(len, Array.from(value).slice(start, start + 4).reverse().map(i => i.toString(16)), Array.from(value).slice(start, start + 4).reverse().map(i => i.toString(16)).join(''));
        console.log(decoder.decode(value.slice(start + 4, start + 4 + len), { stream: true }),start + 4 + len,value.length, buffer);
        // 缓存
        if (start + 4 + len > value.length) {
          buffer += decoder.decode(value.slice(start + 4, value.length), { stream: true });
          // 获取新长度
          len =  start + 4 + len - value.length;
          // console.log(len, 'asfasfa');
          break;
        } else {
          // console.log('执行');
          
          treeLeaves.push(JSON.parse(decoder.decode(value.slice(start + 4, start + 4 + len), { stream: true })));
          // console.log('执行2');
          
        }
        // 更新起始点
        start = start + 4 + len;
      }
    }
    // 读取下一段的时候 reset
    start = 0;
    // 没有缓存直接清空长度
    if(!buffer) len = 0;

  }
  // console.log(treeLeaves);
  const treeMap = new Map()
  treeLeaves.forEach((node) => {
    treeMap.set(node.path.join('/'), node)
  })
  console.log(treeMap);
  
  const treeRoot = treeLeaves[0]
 genarateTree(treeRoot,treeMap)
 console.log(treeRoot);

  // const data = await res.json();
  // let root: Node;
  if (query.id) {
    // root = data.data
  } else {
    // root = data.data.root
  }

  // if (query.depth > 2) {
  //   await getNodeDfs(root, 2, query.depth);
  // }
  return treeRoot
  // return data;
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

function genarateTree(node: Node, treeMap: Map<string, Node>) {
  
  if(!node) return;
  const deplists = Object.keys(node.dependenciesList);
  deplists.forEach(key => {

    node.dependencies[key] = treeMap.get([...node.path, key].join('/'));
    
    genarateTree(node.dependencies[key], treeMap);
  })
}