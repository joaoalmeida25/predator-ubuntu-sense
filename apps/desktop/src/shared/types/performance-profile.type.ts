export type PerformanceProfileId =
  | "low-power"
  | "quiet"
  | "balanced"
  | "balanced-performance"
  | "performance";

export interface PerformanceProfile {
  id: PerformanceProfileId;
  label: string;
  isCurrent: boolean;
}
