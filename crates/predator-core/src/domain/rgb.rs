use std::{fmt, str::FromStr};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct RgbColor {
    pub r: u8,
    pub g: u8,
    pub b: u8,
}

impl RgbColor {
    pub fn from_hex(hex: &str) -> Result<Self, String> {
        let value = hex.trim().trim_start_matches('#');

        if value.len() != 6 {
            return Err(format!("invalid RGB hex color: {hex}"));
        }

        let r = u8::from_str_radix(&value[0..2], 16)
            .map_err(|_| format!("invalid red channel in color: {hex}"))?;
        let g = u8::from_str_radix(&value[2..4], 16)
            .map_err(|_| format!("invalid green channel in color: {hex}"))?;
        let b = u8::from_str_radix(&value[4..6], 16)
            .map_err(|_| format!("invalid blue channel in color: {hex}"))?;

        Ok(Self { r, g, b })
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RgbDevice {
    Keyboard,
    Lid,
    Button,
    All,
}

impl RgbDevice {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Keyboard => "keyboard",
            Self::Lid => "lid",
            Self::Button => "button",
            Self::All => "all",
        }
    }

    pub fn concrete_devices(&self) -> Vec<RgbDevice> {
        match self {
            Self::All => vec![RgbDevice::Keyboard, RgbDevice::Lid, RgbDevice::Button],
            device => vec![*device],
        }
    }
}

impl fmt::Display for RgbDevice {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.as_str())
    }
}

impl FromStr for RgbDevice {
    type Err = String;

    fn from_str(value: &str) -> Result<Self, Self::Err> {
        match value.trim() {
            "keyboard" => Ok(Self::Keyboard),
            "lid" => Ok(Self::Lid),
            "button" => Ok(Self::Button),
            "all" => Ok(Self::All),
            invalid => Err(format!("unsupported RGB device: {invalid}")),
        }
    }
}
