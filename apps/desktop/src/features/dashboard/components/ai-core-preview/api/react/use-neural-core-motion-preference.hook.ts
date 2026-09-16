import { useEffect, useState } from "react";

import type { NeuralCoreMotionPreference } from "../core/neural-core-config.types";

const getSystemReducedMotion = (): boolean => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

export const useNeuralCoreMotionPreference = (
  preference: NeuralCoreMotionPreference,
): boolean => {
  const [systemReducedMotion, setSystemReducedMotion] = useState(getSystemReducedMotion);

  useEffect(() => {
    if (preference !== "system") {
      return undefined;
    }
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      setSystemReducedMotion(false);
      return undefined;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = (event: MediaQueryListEvent): void => {
      setSystemReducedMotion(event.matches);
    };
    setSystemReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [preference]);

  if (preference === "reduced") {
    return true;
  }
  if (preference === "standard") {
    return false;
  }
  return systemReducedMotion;
};
