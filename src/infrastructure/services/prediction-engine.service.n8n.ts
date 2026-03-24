// E:\AI Projects\commodity-clean-structure\src\infrastructure\services\prediction-engine.service.n8n.ts
import "server-only";

import type {
  IPredictionEngineService,
  PredictionExecuteInput,
  PredictionExecuteOutput,
} from "@/src/application/services/prediction-engine.service.interface";
import type { IN8nService } from "@/src/application/services/n8n.service.interface";
import { mapN8nPayloadToPredictionBundle } from "@/src/interface-adapters/mappers/prediction/n8n-prediction.mapper";



export class N8nPredictionEngineService implements IPredictionEngineService {
  constructor(private readonly n8n: IN8nService) {}

async execute(input: PredictionExecuteInput): Promise<PredictionExecuteOutput> {
    const raw = await this.n8n.call<PredictionExecuteInput, unknown>("predict", input, {
      timeoutMs: 240_000,
      idempotencyKey: `predict:${input.uid}:${input.commodity}:${input.futureDate}:${(input.basisKeys ?? []).join(",")}:${(input.basisLabels ?? []).join(",")}`,
    });

    return { bundle: mapN8nPayloadToPredictionBundle(raw) };
  }
}
