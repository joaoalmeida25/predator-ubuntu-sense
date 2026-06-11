import { invoke } from "@tauri-apps/api/core";

export const getDriverStatus = async (): Promise<string> => {
  return invoke<string>("get_driver_status");
};
