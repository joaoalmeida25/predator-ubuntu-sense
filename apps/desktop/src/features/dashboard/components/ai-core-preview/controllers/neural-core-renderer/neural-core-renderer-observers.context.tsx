import {
  createContext,
  useContext,
  type ReactElement,
  type ReactNode,
} from "react";

import type { NeuralCoreNarrativeState } from "../../domain/narrative/neural-core-narrative.types";

interface NeuralCoreRendererObservers {
  readonly onNarrativeStateChange?: (state: NeuralCoreNarrativeState) => void;
}

interface NeuralCoreRendererObserversProviderProps {
  readonly children: ReactNode;
  readonly observers: NeuralCoreRendererObservers;
}

const NeuralCoreRendererObserversContext = createContext<NeuralCoreRendererObservers>({});

export const NeuralCoreRendererObserversProvider = ({
  children,
  observers,
}: NeuralCoreRendererObserversProviderProps): ReactElement => (
  <NeuralCoreRendererObserversContext.Provider value={observers}>
    {children}
  </NeuralCoreRendererObserversContext.Provider>
);

export const useNeuralCoreRendererObservers = (): NeuralCoreRendererObservers => (
  useContext(NeuralCoreRendererObserversContext)
);
