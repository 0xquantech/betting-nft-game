use crate::{constants::*, error::*, utils::*};
use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct UserState {
    pub user: Pubkey,
    pub referrer: Pubkey,
    pub is_ref_inited: u8,
    pub reserves: [u64; 8],
}
