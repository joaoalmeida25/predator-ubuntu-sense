import type { ReactElement, ReactNode } from "react";
import styles from "./app-layout.module.css";

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps): ReactElement => {
  return <main className={styles.shell}>{children}</main>;
};
