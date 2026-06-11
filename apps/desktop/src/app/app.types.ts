export type AppPageId =
  | "dashboard"
  | "performance"
  | "system"
  | "lighting"
  | "power"
  | "thermal"
  | "devices"
  | "settings";

export interface AppNavigationItem {
  id: AppPageId;
  label: string;
  isEnabled: boolean;
  statusLabel?: string;
}
