use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct GlobalState {
    pub is_initialized: u8,
    pub authority: Pubkey,
    pub treasury: Pubkey,
    
    pub btc_pyth_account: Pubkey,
    pub eth_pyth_account: Pubkey,
    pub sol_pyth_account: Pubkey,
    pub avax_pyth_account: Pubkey,
    pub ada_pyth_account: Pubkey,

    pub token_mint: Pubkey, // usdc
    pub rank_mint: Pubkey,  // feel
    pub arena_duration: u64,
    pub platform_fee_rate: u64,
    pub referral_fee_rate: u64,

    pub reserves: [u64; 12],
}
