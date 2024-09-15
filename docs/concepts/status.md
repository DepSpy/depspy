# view 层的全局状态管理

## 为什么需要全局状态管理？

`view` 层包含树状图、抽屉列表图、`size` 块状图等，需要将其选中的节点状态保存在全局，以便在 `view` 层的各个组件中共享<strong>同步</strong>。

同时还包括总依赖树、相同依赖、循环依赖等信息，各个搜索模块也需要共享。

## 全局状态管理的实现

使用 `zustand` 轻量级的状态管理库，其 `api` 与 `react hooks` 相一致。

```ts
export interface Store {
  root: Node; // 总依赖树
  depth: number; // 总依赖树深度
  rootLoading: boolean; // 总依赖树加载状态
  collapse: boolean; // 总依赖树是否折叠

  sizeTree: boolean; // 是否显示体积树

  selectedNode: Node; // 选中的节点
  selectedCodependency: Node[] | []; // 选中的相同依赖
  selectedCircularDependency: Node | null; // 选中的循环依赖
  selectedNodeHistory: Node[]; // 选中节点的历史记录

  codependency: Record<string, Node[]>; // 相同依赖
  circularDependency: Node[]; // 循环依赖

  theme: string; // 主题
  language: string; // 语言
  // ...及其设置它们的相关方法
}
```
