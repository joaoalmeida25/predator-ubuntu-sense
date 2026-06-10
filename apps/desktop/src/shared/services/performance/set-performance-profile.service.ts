import { invoke } from "@tauri-apps/api/core";

import type { PerformanceProfileId } from "../../types/performance-profile.type";

export const setPerformanceProfile = async (
  profileId: PerformanceProfileId,
): Promise<string> => {
  return invoke<string>("set_performance_profile", {
    profile: profileId,
  });
};
