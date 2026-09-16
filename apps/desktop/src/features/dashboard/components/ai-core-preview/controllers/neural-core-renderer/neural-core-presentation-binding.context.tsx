import {
  createContext,
  useContext,
  type ReactElement,
  type ReactNode,
} from "react";

import type { NeuralCorePresentationBinding } from "../../domain/presentation/neural-core-presentation-binding.types";

interface NeuralCorePresentationBindingProviderProps {
  readonly binding: NeuralCorePresentationBinding;
  readonly children: ReactNode;
}

const NeuralCorePresentationBindingContext = createContext<
  NeuralCorePresentationBinding | undefined
>(undefined);

export const NeuralCorePresentationBindingProvider = ({
  binding,
  children,
}: NeuralCorePresentationBindingProviderProps): ReactElement => (
  <NeuralCorePresentationBindingContext.Provider value={binding}>
    {children}
  </NeuralCorePresentationBindingContext.Provider>
);

export const useNeuralCorePresentationBinding = (): NeuralCorePresentationBinding | undefined => (
  useContext(NeuralCorePresentationBindingContext)
);
