use crate::{constants::*, error::*, utils::*};
use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct GlobalState {
    pub is_initialized: u8,
    pub authority: Pubkey,
    pub treasury: Pubkey,
    pub pyth_account: Pubkey,
    pub token_mint: Pubkey,
    pub rank_mint: Pubkey,
    pub arena_duration: u64,
    pub platform_fee_rate: u64,
    pub referral_fee_rate: u64,

    pub reserves: [u64; 12],
}
