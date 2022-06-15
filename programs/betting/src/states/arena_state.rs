use crate::{constants::*, error::*, utils::*};
use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct ArenaState {
    pub locked_price: u64,
    pub start_timestamp: u64,
    pub duration: u64,

    pub up_amount: u64,
    pub up_count: u64,
    pub down_amount: u64,
    pub down_count: u64,

    pub final_price: u64,
    pub end_timestamp: u64,
    pub bet_result: u8,
    pub finalized: u8,

    pub reserves: [u64; 12],
}
