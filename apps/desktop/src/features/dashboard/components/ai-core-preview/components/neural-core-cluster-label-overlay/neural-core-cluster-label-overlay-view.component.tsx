import type { ReactElement } from "react";

import type { NeuralCoreTopologyStatus } from "../../domain/topology/neural-core-topology.types";
import type { NeuralCoreClusterLabelModel } from "../../visualization/labels/neural-core-cluster-label.types";
import styles from "./neural-core-cluster-label-overlay.module.css";
import type {
  NeuralCoreClusterLabelActivityStyle,
  NeuralCoreClusterLabelOverlayViewProps,
  NeuralCoreClusterLabelTransitionStyle,
} from "./neural-core-cluster-label-overlay-view.types";

const getStatusGlyph = (status: NeuralCoreTopologyStatus): string => {
  switch (status) {
    case "success":
      return "✓";
    case "warning":
      return "!";
    case "error":
      return "×";
    case "disabled":
      return "–";
    case "processing":
      return "↻";
    case "idle":
      return "○";
    case "active":
      return "●";
  }
};

const LabelContent = ({ model }: { model: NeuralCoreClusterLabelModel }): ReactElement => {
  if (model.isCompact) {
    return (
      <div className={styles.compactContent}>
        <span className={styles.selectionIndicator} aria-hidden="true" />
        <strong>{model.title}</strong>
        <span className={styles.compactStatus}>
          <span className={styles.statusGlyph}>{getStatusGlyph(model.status)}</span>
          {model.statusLabel}
        </span>
      </div>
    );
  }
  if (model.level === "overview") {
    return (
      <div className={styles.overviewContent}>
        <span className={styles.statusGlyph}>{getStatusGlyph(model.status)}</span>
        <strong>{model.title}</strong>
      </div>
    );
  }
  const activityStyle: NeuralCoreClusterLabelActivityStyle = {
    "--neural-core-label-activity": `${(model.activity ?? 0) * 100}%`,
  };
  return (
    <div className={styles.expandedContent}>
      <div className={styles.heading}>
        <strong>{model.title}</strong>
        <span className={styles.type}>{model.typeLabel}</span>
      </div>
      <div className={styles.statusRow}>
        <span className={styles.statusGlyph}>{getStatusGlyph(model.status)}</span>
        <span>{model.statusLabel}</span>
        {model.level === "summary" && model.formattedActivity ? (
          <>
            <span className={styles.activityValue}>{model.formattedActivity}</span>
            <span className={styles.activityTrack} style={activityStyle} />
          </>
        ) : null}
      </div>
      {model.level === "detail" && model.metrics.length > 0 ? (
        <div className={styles.metrics}>
          {model.metrics.map((metric) => (
            <span key={metric.id} className={styles.metric}>
              <small>{metric.label}</small>
              <b>{metric.formattedValue}</b>
            </span>
          ))}
        </div>
      ) : null}
      {model.level === "detail" && model.impactLabel ? (
        <span className={styles.impact} data-impact={model.impactLevel}>
          {model.impactLabel}
        </span>
      ) : null}
    </div>
  );
};

export const NeuralCoreClusterLabelOverlayView = ({
  models,
  fadeInSeconds,
  fadeOutSeconds,
  interactionMode,
  selectedClusterId,
  onSelectCluster,
  registerLabelElement,
  registerLeaderLineElement,
  registerOverlayElement,
}: NeuralCoreClusterLabelOverlayViewProps): ReactElement => {
  const transitionStyle: NeuralCoreClusterLabelTransitionStyle = {
    "--neural-core-label-fade-in": `${fadeInSeconds}s`,
    "--neural-core-label-fade-out": `${fadeOutSeconds}s`,
  };
  return (
    <div
      ref={registerOverlayElement}
      className={styles.overlay}
      style={transitionStyle}
      aria-hidden={interactionMode === "presentation" ? true : undefined}
      data-neural-core-cluster-label-overlay
    >
      <svg className={styles.leaderLines} width="100%" height="100%" aria-hidden="true">
        {models.map((model) => (
          <line
            key={model.clusterId}
            ref={(element) => registerLeaderLineElement(model.clusterId, element)}
            className={styles.leaderLine}
            data-status={model.status}
          />
        ))}
      </svg>
      <div className={styles.labels}>
        {models.map((model) => {
          const commonProps = {
            className: `${styles.label} ${styles[model.level]} ${model.isCompact ? styles.compact : ""}`,
            "data-cluster-id": model.clusterId,
            "data-level": model.level,
            "data-status": model.status,
            "data-focused": model.isFocused ? "true" : "false",
            "data-selected": selectedClusterId === model.clusterId ? "true" : "false",
          };
          return interactionMode === "inspection" ? (
            <button
              {...commonProps}
              key={model.clusterId}
              type="button"
              ref={(element) => registerLabelElement(model.clusterId, element)}
              onClick={() => onSelectCluster(model.clusterId)}
              aria-label={`Inspect ${model.title}`}
            >
              <div
                key={`${model.level}:${model.isCompact ? "compact" : "full"}`}
                className={styles.contentTransition}
              >
                <LabelContent model={model} />
              </div>
            </button>
          ) : (
            <div
              {...commonProps}
              key={model.clusterId}
              ref={(element) => registerLabelElement(model.clusterId, element)}
            >
              <div
                key={`${model.level}:${model.isCompact ? "compact" : "full"}`}
                className={styles.contentTransition}
              >
                <LabelContent model={model} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
