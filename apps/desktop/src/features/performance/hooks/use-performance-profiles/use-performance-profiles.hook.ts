import { useCallback, useEffect, useState } from "react";

import { getPerformanceProfiles } from "../../../../shared/services/performance/get-performance-profiles/get-performance-profiles.service";
import { setPerformanceProfile } from "../../../../shared/services/performance/set-performance-profile/set-performance-profile.service";
import type { AsyncState } from "../../../../shared/types/async-state.type";
import type {
  PerformanceProfile,
  PerformanceProfileId,
} from "../../../../shared/types/performance-profile.type";
import type { UsePerformanceProfilesResult } from "./use-performance-profiles.types";

export const usePerformanceProfiles = (): UsePerformanceProfilesResult => {
  const [profilesState, setProfilesState] = useState<
    AsyncState<PerformanceProfile[]>
  >({
    status: "idle",
    data: null,
    error: null,
  });

  const [updatingProfileId, setUpdatingProfileId] =
    useState<PerformanceProfileId | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    setProfilesState((currentState) => ({
      status: "loading",
      data: currentState.data,
      error: null,
    }));

    try {
      const profiles = await getPerformanceProfiles();

      setProfilesState({
        status: "success",
        data: profiles,
        error: null,
      });
    } catch (error) {
      setProfilesState((currentState) => ({
        status: "error",
        data: currentState.data,
        error: error instanceof Error ? error.message : String(error),
      }));
    }
  }, []);

  const changeProfile = useCallback(
    async (profileId: PerformanceProfileId): Promise<void> => {
      setUpdatingProfileId(profileId);

      try {
        await setPerformanceProfile(profileId);
        await refresh();
      } catch (error) {
        setProfilesState((currentState) => ({
          status: "error",
          data: currentState.data,
          error: error instanceof Error ? error.message : String(error),
        }));
      } finally {
        setUpdatingProfileId(null);
      }
    },
    [refresh],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    profilesState,
    updatingProfileId,
    refresh,
    changeProfile,
  };
};
