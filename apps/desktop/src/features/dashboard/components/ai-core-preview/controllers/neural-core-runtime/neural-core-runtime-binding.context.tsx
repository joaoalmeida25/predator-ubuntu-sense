import {
  createContext,
  useContext,
  type ReactElement,
  type ReactNode,
} from "react";

import type { UseNeuralCoreOperationalRuntimeResult } from "../../domain/operational-runtime/hooks/use-neural-core-operational-runtime.types";

export interface NeuralCoreRuntimeBinding {
  readonly operationalRuntime: UseNeuralCoreOperationalRuntimeResult;
}

interface NeuralCoreRuntimeBindingProviderProps {
  readonly binding?: NeuralCoreRuntimeBinding;
  readonly children: ReactNode;
}

const NeuralCoreRuntimeBindingContext = createContext<NeuralCoreRuntimeBinding | undefined>(
  undefined,
);

export const NeuralCoreRuntimeBindingProvider = ({
  binding,
  children,
}: NeuralCoreRuntimeBindingProviderProps): ReactElement => (
  <NeuralCoreRuntimeBindingContext.Provider value={binding}>
    {children}
  </NeuralCoreRuntimeBindingContext.Provider>
);

export const useNeuralCoreRuntimeBinding = (): NeuralCoreRuntimeBinding | undefined => (
  useContext(NeuralCoreRuntimeBindingContext)
);
