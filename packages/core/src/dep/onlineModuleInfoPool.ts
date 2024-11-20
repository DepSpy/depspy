import { HOST_MAX_FETCH_NUMBER, NPM_DOMAINS } from "../constant";
import { FunctionPool, getModuleInfo, FunctionWorker } from "@dep-spy/utils";

export const onlineModuleInfoPool = new FunctionPool(
  NPM_DOMAINS.length * HOST_MAX_FETCH_NUMBER,
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

    return new FunctionWorker(getModuleInfoByDomains);
  },
);
