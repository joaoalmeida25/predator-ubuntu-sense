import {
  createContext,
  useContext,
  type ReactElement,
  type ReactNode,
} from "react";

import type { NeuralCoreTopologyCompatibilityData } from "../../domain/topology/neural-core-topology-compatibility.types";

interface NeuralCoreModelCompatibilityProviderProps {
  readonly children: ReactNode;
  readonly compatibility: NeuralCoreTopologyCompatibilityData;
}

const NeuralCoreModelCompatibilityContext = createContext<
  NeuralCoreTopologyCompatibilityData | undefined
>(undefined);

export const NeuralCoreModelCompatibilityProvider = ({
  children,
  compatibility,
}: NeuralCoreModelCompatibilityProviderProps): ReactElement => (
  <NeuralCoreModelCompatibilityContext.Provider value={compatibility}>
    {children}
  </NeuralCoreModelCompatibilityContext.Provider>
);

export const useNeuralCoreModelCompatibility = (
): NeuralCoreTopologyCompatibilityData | undefined => (
  useContext(NeuralCoreModelCompatibilityContext)
);
