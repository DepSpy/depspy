import { HOST_MAX_FETCH_NUMBER, NPM_DOMAINS } from "../constant";
import { FunctionPool, getModuleInfo, FunctionWorker } from "@dep-spy/utils";
const inBrowser = typeof window !== "undefined";

export const onlineModuleInfoPool = new FunctionPool(
  inBrowser ? NPM_DOMAINS.length * HOST_MAX_FETCH_NUMBER : 0,
  (index: number) => {
    const url = NPM_DOMAINS[Math.floor(index % NPM_DOMAINS.length)];
    function getModuleInfoByDomains({
      info,
      baseDir,
    }: {
      info: string;
      baseDir: string;
    }) {
      return getModuleInfo({
        info,
        baseDir,
        npm_domain: url,
      });
    }

    return new FunctionWorker({ fn: getModuleInfoByDomains, key: url });
  },
);
