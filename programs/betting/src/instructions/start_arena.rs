use anchor_lang::prelude::*;

use crate::{constants::*, error::*, instructions::*, states::*, utils::*};
use anchor_spl::token::{Mint, Token, TokenAccount};

use pyth_client;

use std::mem::size_of;

#[derive(Accounts)]
#[instruction(arena_id: u64)]
pub struct StartArena<'info> {
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
      init,
      seeds = [ARENA_STATE_SEED, &arena_id.to_le_bytes()],
      bump,
      payer = authority,
      space = 8 + size_of::<ArenaState>()
    )]
    pub arena_state: Box<Account<'info, ArenaState>>,

    /// CHECK: check in global state
    pub pyth_account: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> StartArena<'info> {
    fn validate(&self) -> Result<()> {
        Ok(())
    }
}

#[access_control(ctx.accounts.validate())]
pub fn handler(ctx: Context<StartArena>, arena_id: u64) -> Result<()> {
    let current_time = Clock::get()?.unix_timestamp as u64;

    let accts = ctx.accounts;
    let pyth_price_info = &accts.pyth_account;
    let pyth_price_data = &pyth_price_info.try_borrow_data()?;
    let pyth_price = pyth_client::cast::<pyth_client::Price>(pyth_price_data);

    accts.arena_state.locked_price = pyth_price.agg.price as u64;
    accts.arena_state.start_timestamp = current_time;
    accts.arena_state.duration = accts.global_state.arena_duration;

    msg!("locked price = {:?}", accts.arena_state.locked_price);

    Ok(())
}
