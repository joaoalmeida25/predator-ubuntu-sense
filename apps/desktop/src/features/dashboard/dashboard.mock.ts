export interface DashboardMetric {
  label: string;
  value: string;
  detail: string;
  tone: "cyan" | "green" | "purple" | "orange" | "blue";
  percent: number;
}

export const dashboardPerformanceMetrics: DashboardMetric[] = [
  { label: "CPU", value: "67%", detail: "5.0 GHz", tone: "blue", percent: 67 },
  { label: "GPU", value: "72%", detail: "2.4 GHz", tone: "green", percent: 72 },
  { label: "RAM", value: "48%", detail: "15.3 / 32 GB", tone: "purple", percent: 48 },
  { label: "Storage", value: "36%", detail: "5.8 / 16 GB", tone: "orange", percent: 36 },
];

export const dashboardSystemMetrics: DashboardMetric[] = [
  { label: "CPU Temp", value: "43°C", detail: "Placeholder", tone: "purple", percent: 43 },
  { label: "GPU Temp", value: "37°C", detail: "Placeholder", tone: "cyan", percent: 37 },
  { label: "System Load", value: "28%", detail: "Placeholder", tone: "blue", percent: 28 },
];
