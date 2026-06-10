export type AppPageId =
  | "dashboard"
  | "performance"
  | "system"
  | "lighting"
  | "network"
  | "devices"
  | "power"
  | "settings";

export interface AppNavigationItem {
  id: AppPageId;
  label: string;
  isEnabled: boolean;
  statusLabel?: string;
}
