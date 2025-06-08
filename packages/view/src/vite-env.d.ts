/// <reference types="vite/client" />
import { INJECT_MODE,OFFLINE_MODE,ONLINE_MODE } from "../constant";
interface ImportMetaEnv {

  readonly VITE_BUILD_MODE: typeof INJECT_MODE | typeof OFFLINE_MODE | typeof ONLINE_MODE;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
