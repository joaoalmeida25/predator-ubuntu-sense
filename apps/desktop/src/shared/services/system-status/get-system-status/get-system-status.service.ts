import { invoke } from "@tauri-apps/api/core";

export const getSystemStatus = async (): Promise<string> => {
  return invoke<string>("get_system_status");
};
