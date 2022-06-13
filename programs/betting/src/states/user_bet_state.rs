use crate::{constants::*, error::*, utils::*};
use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct UserBetState {
    pub bet_timestamp: u64,
    pub arena_id: u64,
    pub bet_amount: u64,
    pub is_up: u8,

    pub is_claimed: u8,
}
