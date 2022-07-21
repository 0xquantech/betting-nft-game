use anchor_lang::prelude::*;

use crate::{constants::*, error::*, instructions::*, states::*, utils::*};

use anchor_spl::{
    associated_token::{self, AssociatedToken},
    token::{self, Mint, Token, TokenAccount, Transfer},
};

use pyth_client;

use std::mem::size_of;

#[derive(Accounts)]
#[instruction(arena_id: u64)]
pub struct CancelArena<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        seeds = [GLOBAL_STATE_SEED],
        bump,
        has_one = authority,
        has_one = pyth_account
    )]
    pub global_state: Box<Account<'info, GlobalState>>,

    #[account(
        mut,
        seeds = [ARENA_STATE_SEED, &arena_id.to_le_bytes()],
        bump,
    )]
    pub arena_state: Box<Account<'info, ArenaState>>,

    /// CHECK:
    pub pyth_account: AccountInfo<'info>,
}

impl<'info> CancelArena<'info> {
    fn validate(&self) -> Result<()> {
        Ok(())
    }
}

#[access_control(ctx.accounts.validate())]
pub fn handler(ctx: Context<CancelArena>, arena_id: u64) -> Result<()> {
    let current_time = Clock::get()?.unix_timestamp as u64;

    let accts = ctx.accounts;
    let pyth_price_info = &accts.pyth_account;
    let pyth_price_data = &pyth_price_info.try_borrow_data()?;
    let pyth_price = pyth_client::cast::<pyth_client::Price>(pyth_price_data);

    accts.arena_state.final_price = pyth_price.agg.price as u64;
    accts.arena_state.end_timestamp = current_time;

    // arena is cancelled.
    accts.arena_state.status = ArenaStatus::Cancelled as u8;

    Ok(())
}
