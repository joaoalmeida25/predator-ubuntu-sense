import { invoke } from "@tauri-apps/api/core";

export async function getSystemStatus(): Promise<string> {
  return invoke<string>("get_system_status");
}

export async function getDriverStatus(): Promise<string> {
  return invoke<string>("get_driver_status");
}
