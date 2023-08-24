/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_BUILD_MODE: "online" | "offline";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
