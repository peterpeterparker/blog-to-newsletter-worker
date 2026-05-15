import type { Factory } from "../common/types.ts";

interface Callback {
  handle(params: { url: URL; request: Request }): Promise<Response>;
}

export function CallbackProvider(_constructor: Factory<Callback>) {}
