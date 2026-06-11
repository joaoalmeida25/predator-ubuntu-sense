import type { ReactElement } from "react";

import predatorMarkUrl from "../../../assets/brand/predator-ubuntu-mark.svg";
import laptopThumbUrl from "../../../assets/device/predator-laptop-thumb.webp";
import { appNavigationItems } from "../../app-navigation.config";
import type { AppPageId } from "../../app.types";
import { AppSidebarView } from "./app-sidebar-view.component";

interface AppSidebarProps {
  activePage: AppPageId;
  onPageChange: (pageId: AppPageId) => void;
}

export const AppSidebar = ({
  activePage,
  onPageChange,
}: AppSidebarProps): ReactElement => {
  return (
    <AppSidebarView
      activePage={activePage}
      brandMarkUrl={predatorMarkUrl}
      deviceImageUrl={laptopThumbUrl}
      navigationItems={appNavigationItems}
      onPageChange={onPageChange}
    />
  );
};
