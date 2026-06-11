import type {
  PerformanceProfile,
  PerformanceProfileId,
} from "../../../../shared/types/performance-profile.type";
import type {
  PerformanceProfileTone,
  PerformanceProfileVisual,
  PerformanceSupportMetric,
} from "../../mocks/performance-telemetry.mock";

export interface PerformanceViewProps {
  activeProfileTitle: string;
  activeProfileTone: PerformanceProfileTone | null;
  error: string | null;
  profiles: PerformanceProfile[];
  profileVisuals: Record<PerformanceProfileId, PerformanceProfileVisual>;
  systemMetrics: PerformanceSupportMetric[];
  thermalMetrics: PerformanceSupportMetric[];
  updatingProfileId: PerformanceProfileId | null;
  onProfileChange: (profileId: PerformanceProfileId) => void;
}
