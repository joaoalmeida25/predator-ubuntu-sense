use std::{fmt, str::FromStr};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PerformanceProfile {
    LowPower,
    Quiet,
    Balanced,
    BalancedPerformance,
    Performance,
}

impl PerformanceProfile {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::LowPower => "low-power",
            Self::Quiet => "quiet",
            Self::Balanced => "balanced",
            Self::BalancedPerformance => "balanced-performance",
            Self::Performance => "performance",
        }
    }

    pub fn friendly_name(&self) -> &'static str {
        match self {
            Self::LowPower => "Eco",
            Self::Quiet => "Quiet",
            Self::Balanced => "Balanced",
            Self::BalancedPerformance => "Performance",
            Self::Performance => "Turbo",
        }
    }
}

impl fmt::Display for PerformanceProfile {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.as_str())
    }
}

impl FromStr for PerformanceProfile {
    type Err = String;

    fn from_str(value: &str) -> Result<Self, Self::Err> {
        match value.trim() {
            "low-power" => Ok(Self::LowPower),
            "quiet" => Ok(Self::Quiet),
            "balanced" => Ok(Self::Balanced),
            "balanced-performance" => Ok(Self::BalancedPerformance),
            "performance" => Ok(Self::Performance),
            invalid => Err(format!("unsupported performance profile: {invalid}")),
        }
    }
}
