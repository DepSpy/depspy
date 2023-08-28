
# Get Started

Single

```bash
$ pnpm add @dep-spy/cli -D
```

```json
"scripts": {
    "ds":"ds"//depspy
  },
```

```bash
$ pnpm run ds
```

Global

```bash
$ pnpm add @dep-spy/cli@1.4.2 -g
```

```bash
$ ds
```

## Configuring DepSpy

**configuration file**

When running `ds` from the command line, DepSpy will automatically try to resolve a config file named

`dep-spy.config.mjs` inside project root.

The most basic config file looks like this:

```javascript
import { defineConfig } from '@dep-spy/cli';

export default defineConfig({
    //config options
});

```

**Command Line Configuration**

Example:

```bash
ds --depth 3 --size --graph mygraph.json
```

**default configuration**

```javascript
{
  depth: 3,//最大嵌套深度
  size: false,//是否计算size
  output: {
    graph: "ds.graph.json",//依赖图输出路径
    circularDependency: "ds.circular.json",//循环依赖输出路径
    codependency: "ds.co.json",//相同依赖输出路径
  },
};
```

**prioritization**

Command Line Configuration **>**configuration file**>**default configuration
