import type { ReactElement } from "react";

import laptopRenderUrl from "../../../../assets/device/predator-laptop.webp";
import { DeviceOverviewCardView } from "./device-overview-card-view.component";
import type { DeviceOverviewCardViewProps } from "./device-overview-card-view.types";

type DeviceOverviewCardProps = Omit<DeviceOverviewCardViewProps, "deviceImageUrl">;

export const DeviceOverviewCard = ({
  name,
  model,
  specs,
}: DeviceOverviewCardProps): ReactElement => {
  return (
    <DeviceOverviewCardView
      deviceImageUrl={laptopRenderUrl}
      name={name}
      model={model}
      specs={specs}
    />
  );
};
