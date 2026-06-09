#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PerformanceProfile {
    LowPower,
    Quiet,
    Balanced,
    BalancedPerformance,
    Performance,
}
