use crate::{constants::*, error::*, utils::*};
use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct DayResult {
    pub day: u64,
    pub tiers: [u64; 7],
    pub reward_per_tier: [u64; 7]
}
