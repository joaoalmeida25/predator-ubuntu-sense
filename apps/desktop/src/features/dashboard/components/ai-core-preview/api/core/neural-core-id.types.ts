declare const neuralCoreIdBrand: unique symbol;

export type NeuralCoreId<TKind extends string> = string & {
  readonly [neuralCoreIdBrand]: TKind;
};

export type NeuralCoreModelId = NeuralCoreId<"model">;
export type NeuralCoreEntityId = NeuralCoreId<"entity">;
export type NeuralCoreClusterId = NeuralCoreId<"cluster">;
export type NeuralCoreRouteId = NeuralCoreId<"route">;
export type NeuralCorePathwayId = NeuralCoreId<"pathway">;
export type NeuralCoreExecutionId = NeuralCoreId<"execution">;
export type NeuralCoreRuntimeEventId = NeuralCoreId<"runtime-event">;
export type NeuralCoreMetricId = NeuralCoreId<"metric">;
