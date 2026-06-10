export interface DashboardMetric {
  label: string;
  value: string;
  detail: string;
  tone: "cyan" | "green" | "purple" | "orange";
  percent: number;
}

export interface DashboardPowerMock {
  totalDraw: string;
  battery: string;
  estimate: string;
  plan: string;
}

export interface DashboardQuickAction {
  id: string;
  label: string;
  description: string;
  isEnabled: boolean;
}

export const dashboardPerformanceMetrics: DashboardMetric[] = [
  { label: "CPU", value: "67%", detail: "5.0 GHz", tone: "cyan", percent: 67 },
  { label: "GPU", value: "72%", detail: "2.4 GHz", tone: "green", percent: 72 },
  { label: "RAM", value: "48%", detail: "15.3 / 32 GB", tone: "purple", percent: 48 },
  { label: "Storage", value: "36%", detail: "5.8 / 16 GB", tone: "orange", percent: 36 },
];

export const dashboardTemperatureMetrics: DashboardMetric[] = [
  { label: "CPU Temp", value: "43C", detail: "Placeholder", tone: "purple", percent: 43 },
  { label: "GPU Temp", value: "37C", detail: "Placeholder", tone: "cyan", percent: 37 },
  { label: "System Load", value: "28%", detail: "Placeholder", tone: "green", percent: 28 },
];

export const dashboardPowerMock: DashboardPowerMock = {
  totalDraw: "112 W",
  battery: "83%",
  estimate: "4h 12m",
  plan: "Balanced",
};

export const dashboardQuickActions: DashboardQuickAction[] = [
  { id: "turbo", label: "Turbo Boost", description: "Coming soon", isEnabled: false },
  { id: "cool", label: "CoolSense Auto", description: "Coming soon", isEnabled: false },
  { id: "optimizer", label: "Advanced Optimizer", description: "Coming soon", isEnabled: false },
  { id: "privacy", label: "Privacy Shield", description: "Coming soon", isEnabled: false },
];
