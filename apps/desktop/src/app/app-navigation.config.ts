import type { AppNavigationItem } from "./app.types";

export const appNavigationItems: AppNavigationItem[] = [
  { id: "dashboard", label: "Dashboard", isEnabled: true },
  { id: "performance", label: "Performance", isEnabled: true },
  { id: "system", label: "System", isEnabled: false, statusLabel: "Soon" },
  { id: "lighting", label: "Lighting", isEnabled: false, statusLabel: "Soon" },
  { id: "network", label: "Network", isEnabled: false, statusLabel: "Soon" },
  { id: "devices", label: "Devices", isEnabled: false, statusLabel: "Soon" },
  { id: "power", label: "Power", isEnabled: false, statusLabel: "Soon" },
  { id: "settings", label: "Settings", isEnabled: false, statusLabel: "Soon" },
];
