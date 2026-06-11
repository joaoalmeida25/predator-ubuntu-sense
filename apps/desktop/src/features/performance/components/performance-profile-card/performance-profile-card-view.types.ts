import type {
  PerformanceProfile,
} from "../../../../shared/types/performance-profile.type";
import type { PerformanceProfileVisual } from "../../mocks/performance-telemetry.mock";

export interface PerformanceProfileCardViewProps {
  ariaLabel: string;
  isDisabled: boolean;
  isUpdating: boolean;
  profile: PerformanceProfile;
  visual: PerformanceProfileVisual;
  onSelect: () => void;
}
