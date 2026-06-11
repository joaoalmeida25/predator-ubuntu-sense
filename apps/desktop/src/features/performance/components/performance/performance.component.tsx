import type { ReactElement } from "react";

import type { PerformanceProfile } from "../../../../shared/types/performance-profile.type";
import { usePerformanceProfiles } from "../../hooks/use-performance-profiles/use-performance-profiles.hook";
import {
  performanceProfileVisuals,
  systemPerformanceMetrics,
  thermalOverviewMetrics,
} from "../../mocks/performance-telemetry.mock";
import { PerformanceView } from "./performance-view.component";

const getActiveProfile = (
  profiles: PerformanceProfile[],
): PerformanceProfile | null => {
  return profiles.find((profile) => profile.isCurrent) ?? profiles[0] ?? null;
};

export const Performance = (): ReactElement => {
  const { profilesState, updatingProfileId, changeProfile } =
    usePerformanceProfiles();

  const profiles = profilesState.data ?? [];
  const activeProfile = getActiveProfile(profiles);
  const activeVisual = activeProfile ? performanceProfileVisuals[activeProfile.id] : null;

  return (
    <PerformanceView
      profiles={profiles}
      error={profilesState.error}
      updatingProfileId={updatingProfileId}
      activeProfileTitle={activeVisual?.title ?? "Unknown"}
      activeProfileTone={activeVisual?.tone ?? null}
      profileVisuals={performanceProfileVisuals}
      systemMetrics={systemPerformanceMetrics}
      thermalMetrics={thermalOverviewMetrics}
      onProfileChange={(profileId) => void changeProfile(profileId)}
    />
  );
};
