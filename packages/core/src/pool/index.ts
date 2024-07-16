import Pool, { OffLineWorker, OnlineWorker } from "./pool";
import { getModuleInfo } from "@dep-spy/utils";
import os from "os";
import { HOST_MAX_FETCH_NUMBER, NPM_DOMAINS } from "../constant";
import path from "path";
const inBrowser = typeof window !== "undefined";

export default new Pool(
  os.cpus ? os.cpus().length : NPM_DOMAINS.length * HOST_MAX_FETCH_NUMBER,
  (index: number) => {
    const url = NPM_DOMAINS[Math.floor(index % NPM_DOMAINS.length)];
    function getModuleInfoByDomains(info: string, baseDir: string) {
      return getModuleInfo(info, baseDir, url);
    }
    if (inBrowser) {
      return new OnlineWorker(getModuleInfoByDomains);
    }
    return new OffLineWorker(path.join(__dirname, "./pool/worker.js"));
  },
);
