import type { ReactElement } from "react";

import styles from "./neural-core-demo-controls.module.css";
import type { NeuralCoreDemoControlsViewProps } from "./neural-core-demo-controls-view.types";

const getScenarioToneClass = (
  scenario: NeuralCoreDemoControlsViewProps["currentScenario"],
): string => {
  switch (scenario) {
    case "warning-state":
      return styles.warning;
    case "error-state":
      return styles.error;
    case "success-state":
      return styles.success;
    default:
      return "";
  }
};

export const NeuralCoreDemoControlsView = ({
  currentScenario,
  descriptionId,
  disabled,
  onScenarioChange,
  options,
  selectedOption,
}: NeuralCoreDemoControlsViewProps): ReactElement => {
  return (
    <section
      className={styles.controls}
      aria-label="AI Core demonstration scenarios"
      data-neural-core-label-exclusion
    >
      <div
        className={styles.optionList}
        role="group"
        aria-describedby={descriptionId}
      >
        {options.map((option) => {
          const isSelected = Object.is(option.scenario, currentScenario);

          return (
            <button
              key={option.scenario}
              className={`${styles.option} ${getScenarioToneClass(option.scenario)}`}
              type="button"
              aria-pressed={isSelected}
              disabled={disabled}
              onClick={() => onScenarioChange(option.scenario)}
            >
              {option.shortLabel ?? option.label}
            </button>
          );
        })}
      </div>

      <div className={styles.selection} aria-live="polite">
        <span>{disabled ? "External State Active" : `Selected: ${selectedOption.label}`}</span>
        <p id={descriptionId}>
          {disabled
            ? "Demo selection is unavailable while an explicit state is active."
            : selectedOption.description}
        </p>
      </div>
    </section>
  );
};
