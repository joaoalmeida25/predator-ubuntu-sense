export interface DashboardViewProps {
  systemStatus: string;
  driverStatus: string;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
}
