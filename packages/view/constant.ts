export const  ONLINE_MODE = "online";
export const  OFFLINE_MODE = "offline";
export const  INJECT_MODE = "inject";
// 对应各个模式的输出目录
export const modeOutDirMap = {
    // 线上模式
    [ONLINE_MODE]: "dist/online",
    // 本地服务器模式
    [OFFLINE_MODE]: "dist/vite",
    // 注入模式，注入数据，无需本地服务器
    [INJECT_MODE]: "dist/inject",
};
// 对应各个模式的首页路由
export const modeIndexMap = {
    [ONLINE_MODE]: "/search",
    [OFFLINE_MODE]: "/analyze?depth=3",
    [INJECT_MODE]: "/static-analyze",
};