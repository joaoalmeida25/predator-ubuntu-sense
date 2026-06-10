import type { PerformanceProfileId } from "../../shared/types/performance-profile.type";

export type PerformanceProfileTone =
  | "eco"
  | "quiet"
  | "balanced"
  | "performanceTone"
  | "turbo";

export type PerformanceProfileIconId =
  | "leaf"
  | "waves"
  | "scale"
  | "gauge"
  | "swirl";

export interface PerformanceProfileVisual {
  id: PerformanceProfileId;
  title: string;
  description: string;
  iconId: PerformanceProfileIconId;
  tone: PerformanceProfileTone;
}

export interface PerformanceSupportMetric {
  label: string;
  value: string;
  detail: string;
  percent: number;
}

export const performanceProfileVisuals: Record<
  PerformanceProfileId,
  PerformanceProfileVisual
> = {
  "low-power": {
    id: "low-power",
    title: "Eco",
    description: "Maximize battery life and reduce noise.",
    iconId: "leaf",
    tone: "eco",
  },
  quiet: {
    id: "quiet",
    title: "Quiet",
    description: "Whisper-quiet operation for light tasks.",
    iconId: "waves",
    tone: "quiet",
  },
  balanced: {
    id: "balanced",
    title: "Balanced",
    description: "Optimal balance between performance and noise.",
    iconId: "scale",
    tone: "balanced",
  },
  "balanced-performance": {
    id: "balanced-performance",
    title: "Performance",
    description: "Boost performance for demanding applications.",
    iconId: "gauge",
    tone: "performanceTone",
  },
  performance: {
    id: "performance",
    title: "Turbo",
    description: "Maximum performance for extreme workloads.",
    iconId: "swirl",
    tone: "turbo",
  },
};

export const systemPerformanceMetrics: PerformanceSupportMetric[] = [
  { label: "CPU", value: "38%", detail: "3.12 GHz", percent: 38 },
  { label: "GPU", value: "62%", detail: "2100 MHz", percent: 62 },
];

export const thermalOverviewMetrics: PerformanceSupportMetric[] = [
  { label: "CPU", value: "78 °C", detail: "Placeholder sensor", percent: 78 },
  { label: "GPU", value: "72 °C", detail: "Placeholder sensor", percent: 72 },
  { label: "System", value: "45 °C", detail: "Placeholder sensor", percent: 45 },
];
