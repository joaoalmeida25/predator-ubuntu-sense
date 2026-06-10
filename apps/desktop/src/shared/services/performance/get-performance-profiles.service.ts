import { invoke } from "@tauri-apps/api/core";

import type { PerformanceProfile } from "../../types/performance-profile.type";

export const getPerformanceProfiles = async (): Promise<PerformanceProfile[]> => {
  return invoke<PerformanceProfile[]>("list_performance_profiles");
};
