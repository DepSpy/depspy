import { getModuleInfo } from "@dep-spy/utils";

export const enum TASK_TYPE {
  MODULE_INFO = "module_info",
  MESSAGE = "message",
}

// 处理函数参数必须为配置对象
export const EventBus = {
  [TASK_TYPE.MODULE_INFO]: async (options: {
    info: string;
    baseDir: string;
  }) => {
    return await getModuleInfo(options);
  },

  //测试示例
  [TASK_TYPE.MESSAGE]: async (options: { name: number }) => {
    console.log(options.name);
  },
};
