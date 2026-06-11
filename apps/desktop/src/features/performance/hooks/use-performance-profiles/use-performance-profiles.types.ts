import type { AsyncState } from "../../../../shared/types/async-state.type";
import type {
  PerformanceProfile,
  PerformanceProfileId,
} from "../../../../shared/types/performance-profile.type";

export interface UsePerformanceProfilesResult {
  profilesState: AsyncState<PerformanceProfile[]>;
  updatingProfileId: PerformanceProfileId | null;
  refresh: () => Promise<void>;
  changeProfile: (profileId: PerformanceProfileId) => Promise<void>;
}
