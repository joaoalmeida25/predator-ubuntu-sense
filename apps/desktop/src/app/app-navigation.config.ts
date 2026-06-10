import type { AppNavigationItem } from "./app.types";

export const appNavigationItems: AppNavigationItem[] = [
  { id: "dashboard", label: "Dashboard", icon: "D", isEnabled: true },
  { id: "performance", label: "Performance", icon: "P", isEnabled: true },
  { id: "system", label: "System", icon: "S", isEnabled: false, statusLabel: "Soon" },
  { id: "lighting", label: "Lighting", icon: "L", isEnabled: false, statusLabel: "Soon" },
  { id: "network", label: "Network", icon: "N", isEnabled: false, statusLabel: "Soon" },
  { id: "devices", label: "Devices", icon: "DV", isEnabled: false, statusLabel: "Soon" },
  { id: "power", label: "Power", icon: "PW", isEnabled: false, statusLabel: "Soon" },
  { id: "settings", label: "Settings", icon: "ST", isEnabled: false, statusLabel: "Soon" },
];
