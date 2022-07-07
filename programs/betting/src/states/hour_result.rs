use crate::{constants::*, error::*, utils::*};
use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct HourResult {
    pub hour: u64,
    pub tiers: [u64; 5],
    pub reward_per_tier: [u64; 5],
}
