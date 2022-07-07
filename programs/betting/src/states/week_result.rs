use crate::{constants::*, error::*, utils::*};
use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct WeekResult {
    pub week: u64,
    pub tiers: [u64; 9],
    pub reward_per_tier: [u64; 9],
}
