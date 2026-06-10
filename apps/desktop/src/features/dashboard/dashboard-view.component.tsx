import type { DashboardViewProps } from "./dashboard.types";

export function DashboardView({
  systemStatus,
  driverStatus,
  isLoading,
  error,
  onRefresh,
}: DashboardViewProps) {
  return (
    <section className="dashboard">
      <header className="dashboard__header">
        <div>
          <p className="eyebrow">Predator Ubuntu Sense</p>
          <h1>Linux control center</h1>
          <p className="description">
            Dashboard inicial consumindo os comandos locais do predatorctl.
          </p>
        </div>

        <button type="button" onClick={onRefresh} disabled={isLoading}>
          {isLoading ? "Refreshing..." : "Refresh"}
        </button>
      </header>

      {error && (
        <article className="error-card">
          <strong>Erro ao carregar status</strong>
          <pre>{error}</pre>
        </article>
      )}

      <div className="dashboard__grid">
        <article className="status-card">
          <h2>System status</h2>
          <pre>{systemStatus}</pre>
        </article>

        <article className="status-card">
          <h2>Driver runtime</h2>
          <pre>{driverStatus}</pre>
        </article>
      </div>
    </section>
  );
}
