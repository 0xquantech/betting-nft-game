use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct NftBuildState {
    pub user: Pubkey,
    pub build_state: u16
}
