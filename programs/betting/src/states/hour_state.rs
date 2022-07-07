use crate::{constants::*, error::*, utils::*};
use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct HourState {
    pub user: Pubkey,
    pub start_time: u64,
    pub bet_amount: u64,
    pub is_claimed: u8,
}
