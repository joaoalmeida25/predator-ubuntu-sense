import type { ReactElement } from "react";

import type {
  PerformanceProfile,
  PerformanceProfileId,
} from "../../../../shared/types/performance-profile.type";
import type { PerformanceProfileVisual } from "../../mocks/performance-telemetry.mock";
import { PerformanceProfileCardView } from "./performance-profile-card-view.component";

interface PerformanceProfileCardProps {
  isDisabled: boolean;
  isUpdating: boolean;
  profile: PerformanceProfile;
  visual: PerformanceProfileVisual;
  onProfileChange: (profileId: PerformanceProfileId) => void;
}

export const PerformanceProfileCard = ({
  profile,
  visual,
  isUpdating,
  isDisabled,
  onProfileChange,
}: PerformanceProfileCardProps): ReactElement => {
  const ariaLabel = isUpdating
    ? `Applying ${visual.title} performance profile`
    : profile.isCurrent
    ? `${visual.title} profile is active`
    : `Apply ${visual.title} performance profile`;

  const handleSelect = (): void => {
    onProfileChange(profile.id);
  };

  return (
    <PerformanceProfileCardView
      ariaLabel={ariaLabel}
      profile={profile}
      visual={visual}
      isUpdating={isUpdating}
      isDisabled={isDisabled}
      onSelect={handleSelect}
    />
  );
};
