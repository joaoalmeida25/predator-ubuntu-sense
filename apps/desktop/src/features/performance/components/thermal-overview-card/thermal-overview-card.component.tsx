import type { ReactElement } from "react";

import thermalRenderUrl from "../../../../assets/device/thermal-underside.webp";
import { ThermalOverviewCardView } from "./thermal-overview-card-view.component";
import type { ThermalOverviewCardViewProps } from "./thermal-overview-card-view.types";

type ThermalOverviewCardProps = Omit<ThermalOverviewCardViewProps, "thermalImageUrl">;

export const ThermalOverviewCard = ({
  metrics,
}: ThermalOverviewCardProps): ReactElement => {
  return <ThermalOverviewCardView metrics={metrics} thermalImageUrl={thermalRenderUrl} />;
};
