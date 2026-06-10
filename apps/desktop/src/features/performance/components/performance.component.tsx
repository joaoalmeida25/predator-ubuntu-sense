import type { ReactElement } from "react";

import {
  performanceProfileVisuals,
  systemPerformanceMetrics,
  thermalOverviewMetrics,
} from "../performance.mock";
import { usePerformanceProfiles } from "../hooks/use-performance-profiles.hook";
import { PerformanceView } from "./performance-view.component";

export const Performance = (): ReactElement => {
  const { profilesState, updatingProfileId, refresh, changeProfile } =
    usePerformanceProfiles();

  return (
    <PerformanceView
      profilesState={profilesState}
      updatingProfileId={updatingProfileId}
      profileVisuals={performanceProfileVisuals}
      systemMetrics={systemPerformanceMetrics}
      thermalMetrics={thermalOverviewMetrics}
      onRefresh={() => void refresh()}
      onProfileChange={(profileId) => void changeProfile(profileId)}
    />
  );
};
