/* eslint-disable @typescript-eslint/no-unused-vars */
import type { AttributifyAttributes } from "unocss/preset-attributify";

declare module "react" {
  interface HTMLAttributes<T> extends AttributifyAttributes {}
}
