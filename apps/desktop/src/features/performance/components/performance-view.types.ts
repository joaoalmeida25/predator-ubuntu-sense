import type { AsyncState } from "../../../shared/types/async-state.type";
import type {
  PerformanceProfile,
  PerformanceProfileId,
} from "../../../shared/types/performance-profile.type";
import type {
  PerformanceProfileVisual,
  PerformanceSupportMetric,
} from "../performance.mock";

export interface PerformanceViewProps {
  profilesState: AsyncState<PerformanceProfile[]>;
  updatingProfileId: PerformanceProfileId | null;
  profileVisuals: Record<PerformanceProfileId, PerformanceProfileVisual>;
  systemMetrics: PerformanceSupportMetric[];
  thermalMetrics: PerformanceSupportMetric[];
  onRefresh: () => void;
  onProfileChange: (profileId: PerformanceProfileId) => void;
}
