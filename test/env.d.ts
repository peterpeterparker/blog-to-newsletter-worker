/// <reference types="@cloudflare/vitest-pool-workers" />

import type { Env } from "../src/common/types";

declare module "cloudflare:test" {
  interface ProvidedEnv extends Env {}
}
