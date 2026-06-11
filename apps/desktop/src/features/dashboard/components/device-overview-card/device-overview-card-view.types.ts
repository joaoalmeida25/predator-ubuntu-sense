export interface DeviceOverviewSpec {
  label: string;
  value: string;
}

export interface DeviceOverviewCardViewProps {
  deviceImageUrl: string;
  model: string;
  name: string;
  specs: DeviceOverviewSpec[];
}
