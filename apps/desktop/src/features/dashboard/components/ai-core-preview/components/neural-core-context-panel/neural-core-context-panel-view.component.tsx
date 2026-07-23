import type { ReactElement } from "react";

import styles from "./neural-core-context-panel.module.css";
import type {
  NeuralCoreContextPanelMetricModel,
  NeuralCoreContextPanelStyle,
  NeuralCoreContextPanelViewProps,
} from "./neural-core-context-panel-view.types";
import type { NeuralCoreTopologyStatus } from "../../domain/topology/neural-core-topology.types";

const getStatusGlyph = (status: NeuralCoreTopologyStatus): string => {
  switch (status) {
    case "active": return "●";
    case "idle": return "○";
    case "processing": return "↻";
    case "success": return "✓";
    case "warning": return "!";
    case "error": return "×";
    case "disabled": return "–";
  }
};

const getTrendLabel = (trend: NeuralCoreContextPanelMetricModel["trend"]): string => {
  switch (trend) {
    case "up":
      return "↑ Up";
    case "down":
      return "↓ Down";
    case "stable":
      return "→ Stable";
    case "unknown":
      return "? Unknown";
    default:
      return "";
  }
};

export const NeuralCoreContextPanelView = ({
  isClosing,
  model,
  onClose,
  widthPx,
  compactWidthPx,
}: NeuralCoreContextPanelViewProps): ReactElement => {
  const hasRelationships = model.relatedClusters.length > 0
    || model.synapses.length > 0
    || model.pathways.length > 0;
  const panelStyle: NeuralCoreContextPanelStyle = {
    "--neural-core-context-panel-width": `${widthPx}px`,
    "--neural-core-context-panel-compact-width": `${compactWidthPx}px`,
  };
  return (
    <aside
      className={styles.panel}
      style={panelStyle}
      data-neural-core-label-exclusion
      data-status={model.status}
      data-closing={isClosing ? "true" : "false"}
      aria-labelledby="neural-core-context-panel-title"
    >
      <header className={styles.header}>
        <div className={styles.identity}>
          <span className={styles.type}>{model.typeLabel}</span>
          <h3 id="neural-core-context-panel-title">{model.name}</h3>
          <div className={styles.headerStatus}>
            <span className={styles.statusGlyph} aria-hidden="true">
              {getStatusGlyph(model.status)}
            </span>
            <span>{model.statusLabel}</span>
            {model.activityLabel ? <strong>{model.activityLabel}</strong> : null}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={isClosing}
          aria-label="Close component details"
        >
          ×
        </button>
      </header>
      <div className={styles.content}>
        {model.metrics.length > 0 ? (
          <section className={styles.description}>
            <h4>Metrics</h4>
            <div className={styles.metrics}>
              {model.metrics.map((metric) => (
                <div key={metric.id} className={styles.metric} data-status={metric.status}>
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                  {metric.trend ? <small>{getTrendLabel(metric.trend)}</small> : null}
                  {metric.status && metric.statusLabel ? (
                    <small>
                      <span aria-hidden="true">{getStatusGlyph(metric.status)}</span>
                      {` ${metric.statusLabel}`}
                    </small>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}
        {model.description ? (
          <section>
            <h4>Description</h4>
            <p>{model.description}</p>
          </section>
        ) : null}
        {model.impact ? (
          <section className={styles.impact} data-impact={model.impact.level}>
            <h4>Impact · {model.impact.level}</h4>
            {model.impact.summary ? <p>{model.impact.summary}</p> : null}
            {model.impact.affectedLabels.length > 0 ? (
              <div className={styles.chips}>
                {model.impact.affectedLabels.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}
        {hasRelationships ? (
          <section>
            <h4>Relationships</h4>
            {model.relatedClusters.length > 0 ? (
              <RelationshipGroup label="Components" values={model.relatedClusters} />
            ) : null}
            {model.synapses.length > 0 ? (
              <RelationshipGroup label="Connections" values={model.synapses} />
            ) : null}
            {model.pathways.length > 0 ? (
              <RelationshipGroup label="Pathways" values={model.pathways} />
            ) : null}
          </section>
        ) : null}
      </div>
    </aside>
  );
};

const RelationshipGroup = ({
  label,
  values,
}: { label: string; values: readonly string[] }): ReactElement => {
  return (
    <div className={styles.relationshipGroup}>
      <span>{label}</span>
      <div className={styles.chips}>
        {values.map((value) => <span key={value}>{value}</span>)}
      </div>
    </div>
  );
};
