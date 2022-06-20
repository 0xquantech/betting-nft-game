use crate::{constants::*, error::*, states::*};
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::{self, AssociatedToken},
    token::{Mint, Token, TokenAccount},
};

use std::mem::size_of;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        seeds = [GLOBAL_STATE_SEED],
        bump,
        payer = authority,
        space = 8 + size_of::<GlobalState>()
    )]
    pub global_state: Box<Account<'info, GlobalState>>,

    #[account(
        init,
        associated_token::mint = token_mint,
        associated_token::authority = global_state,
        payer = authority
    )]
    pub escrow_ata: Account<'info, TokenAccount>,

    #[account(
        init,
        associated_token::mint = rank_mint,
        associated_token::authority = global_state,
        payer = authority
    )]
    pub feel_vault_ata: Account<'info, TokenAccount>,

    pub token_mint: Account<'info, Mint>,
    pub rank_mint: Account<'info, Mint>,

    /// CHECK: no need to check
    pub treasury: AccountInfo<'info>,
    /// CHECK: no need to check
    pub pyth_account: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> Initialize<'info> {
    pub fn validate(&self) -> Result<()> {
        if self.global_state.is_initialized == 1 {
            require!(
                self.global_state.authority.eq(&self.authority.key()),
                BettingError::NotAllowedAuthority
            )
        }
        Ok(())
    }
}

/// Initialize Staking Program for the first time
/// to init global state with some data for validation
///
#[access_control(ctx.accounts.validate())]
pub fn handler(ctx: Context<Initialize>, new_authority: Pubkey) -> Result<()> {
    let accts = ctx.accounts;
    accts.global_state.is_initialized = 1;
    accts.global_state.authority = new_authority;
    accts.global_state.treasury = accts.treasury.key();
    accts.global_state.pyth_account = accts.pyth_account.key();
    accts.global_state.platform_fee_rate = INITIAL_PLATFORM_FEE_RATE;
    accts.global_state.referral_fee_rate = INITIAL_REF_FEE_RATE;
    accts.global_state.token_mint = accts.token_mint.key();
    accts.global_state.rank_mint = accts.rank_mint.key();
    Ok(())
}
