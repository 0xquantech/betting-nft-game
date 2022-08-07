use crate::{constants::*, error::*, states::*};
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount},
};

use std::mem::size_of;

#[derive(Accounts)]
pub struct CreateFragmentMints<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        seeds = [GLOBAL_STATE_SEED],
        bump,
        has_one = authority
    )]
    pub global_state: Box<Account<'info, GlobalState>>,

    #[account(
        init,
        seeds = ["FRAGMENT1".as_ref()],
        bump,
        payer = authority,
        mint::decimals=6,
        mint::authority=global_state
    )]
    pub fragment1_mint: Box<Account<'info, Mint>>,
    #[account(
        init,
        seeds = ["FRAGMENT2".as_ref()],
        bump,
        payer = authority,
        mint::decimals=6,
        mint::authority=global_state
    )]
    pub fragment2_mint: Box<Account<'info, Mint>>,
    #[account(
        init,
        seeds = ["FRAGMENT3".as_ref()],
        bump,
        payer = authority,
        mint::decimals=6,
        mint::authority=global_state
    )]
    pub fragment3_mint: Box<Account<'info, Mint>>,
    #[account(
        init,
        seeds = ["FRAGMENT4".as_ref()],
        bump,
        payer = authority,
        mint::decimals=6,
        mint::authority=global_state
    )]
    pub fragment4_mint: Box<Account<'info, Mint>>,
    #[account(
        init,
        seeds = ["FRAGMENT5".as_ref()],
        bump,
        payer = authority,
        mint::decimals=6,
        mint::authority=global_state
    )]
    pub fragment5_mint: Box<Account<'info, Mint>>,
    #[account(
        init,
        seeds = ["FRAGMENT6".as_ref()],
        bump,
        payer = authority,
        mint::decimals=6,
        mint::authority=global_state
    )]
    pub fragment6_mint: Box<Account<'info, Mint>>,
    #[account(
        init,
        seeds = ["FRAGMENT7".as_ref()],
        bump,
        payer = authority,
        mint::decimals=6,
        mint::authority=global_state
    )]
    pub fragment7_mint: Box<Account<'info, Mint>>,
    #[account(
        init,
        seeds = ["FRAGMENT8".as_ref()],
        bump,
        payer = authority,
        mint::decimals=6,
        mint::authority=global_state
    )]
    pub fragment8_mint: Box<Account<'info, Mint>>,
    #[account(
        init,
        seeds = ["FRAGMENT9".as_ref()],
        bump,
        payer = authority,
        mint::decimals=6,
        mint::authority=global_state
    )]
    pub fragment9_mint: Box<Account<'info, Mint>>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> CreateFragmentMints<'info> {
    pub fn validate(&self) -> Result<()> {
        Ok(())
    }
}

/// Initialize Staking Program for the first time
/// to init global state with some data for validation
///
#[access_control(ctx.accounts.validate())]
pub fn handler(ctx: Context<CreateFragmentMints>) -> Result<()> {
    let accts = ctx.accounts;
    Ok(())
}
