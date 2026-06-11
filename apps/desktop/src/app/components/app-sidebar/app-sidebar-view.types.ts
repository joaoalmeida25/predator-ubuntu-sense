import type { AppNavigationItem, AppPageId } from "../../app.types";

export interface AppSidebarViewProps {
  activePage: AppPageId;
  brandMarkUrl: string;
  deviceImageUrl: string;
  navigationItems: AppNavigationItem[];
  onPageChange: (pageId: AppPageId) => void;
}
