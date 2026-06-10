export interface DeviceOverviewSpec {
  label: string;
  value: string;
}

export interface DeviceOverviewCardProps {
  name: string;
  model: string;
  specs: DeviceOverviewSpec[];
}
