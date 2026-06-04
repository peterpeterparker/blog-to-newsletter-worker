import type { Factory } from "../common/types.ts";
import type { WorkerRequest, WorkerResponse } from "kyushu-types";

interface Callback {
  handle(params: { url: URL; request: WorkerRequest }): Promise<WorkerResponse>;
}

export function CallbackProvider(_constructor: Factory<Callback>) {}
