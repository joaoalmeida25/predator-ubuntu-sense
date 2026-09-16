import {
  createContext,
  useContext,
  type ReactElement,
  type ReactNode,
} from "react";

import type { UseNeuralCoreInspectionResult } from "../../hooks/use-neural-core-inspection/use-neural-core-inspection.types";

export interface NeuralCoreInspectionBinding {
  readonly controller: UseNeuralCoreInspectionResult;
}

interface NeuralCoreInspectionBindingProviderProps {
  readonly binding: NeuralCoreInspectionBinding;
  readonly children: ReactNode;
}

const NeuralCoreInspectionBindingContext = createContext<NeuralCoreInspectionBinding | undefined>(
  undefined,
);

export const NeuralCoreInspectionBindingProvider = ({
  binding,
  children,
}: NeuralCoreInspectionBindingProviderProps): ReactElement => (
  <NeuralCoreInspectionBindingContext.Provider value={binding}>
    {children}
  </NeuralCoreInspectionBindingContext.Provider>
);

export const useNeuralCoreInspectionBinding = (): NeuralCoreInspectionBinding | undefined => (
  useContext(NeuralCoreInspectionBindingContext)
);
