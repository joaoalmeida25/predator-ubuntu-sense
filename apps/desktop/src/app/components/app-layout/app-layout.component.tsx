import type { ReactElement, ReactNode } from "react";

import { AppHeader } from "../app-header/app-header.component";
import { AppSidebar } from "../app-sidebar/app-sidebar.component";
import type { AppPageId } from "../../app.types";
import { AppLayoutView } from "./app-layout-view.component";

interface AppLayoutProps {
  activePage: AppPageId;
  children: ReactNode;
  onPageChange: (pageId: AppPageId) => void;
}

export const AppLayout = ({
  activePage,
  children,
  onPageChange,
}: AppLayoutProps): ReactElement => {
  return (
    <AppLayoutView
      header={<AppHeader activePage={activePage} />}
      sidebar={<AppSidebar activePage={activePage} onPageChange={onPageChange} />}
    >
      {children}
    </AppLayoutView>
  );
};
