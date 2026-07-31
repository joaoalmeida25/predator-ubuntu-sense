import type { RefObject } from "react";
import type { Group } from "three";

import type {
  NeuralCoreClusterGrammarState,
} from "../../visualization/cluster-grammar/neural-core-cluster-grammar.types";
import type {
  NeuralCoreSemanticFocusLensConfig,
} from "../../visualization/focus-lens/neural-core-semantic-focus-lens.types";

export interface NeuralCoreClusterTerritoriesViewProps {
  grammar: NeuralCoreClusterGrammarState;
  focusLensConfig: NeuralCoreSemanticFocusLensConfig;
  territoryRefs: readonly RefObject<Group | null>[];
}
