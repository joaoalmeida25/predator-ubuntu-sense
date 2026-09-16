export type NeuralCoreOperationalMetricValue = string | number | boolean;

export type NeuralCoreOperationalMetricStatus =
  | "neutral"
  | "success"
  | "warning"
  | "error";

export type NeuralCoreOperationalMetricTrend = "up" | "down" | "stable";

export interface NeuralCoreOperationalMetric {
  id: string;
  name: string;
  value: NeuralCoreOperationalMetricValue;
  unit?: string;
  status?: NeuralCoreOperationalMetricStatus;
  trend?: NeuralCoreOperationalMetricTrend;
}
