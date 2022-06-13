use anchor_lang::prelude::*;

use crate::{constants::*, error::*, instructions::*, states::*, utils::*};
use anchor_spl::token::{Mint, Token, TokenAccount};

use pyth_client;

use std::mem::size_of;

#[derive(Accounts)]
#[instruction(arena_id: u64)]
pub struct EndArena<'info> {
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

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> EndArena<'info> {
    fn validate(&self) -> Result<()> {
        Ok(())
    }
    // CHECK: when take fee
}

#[access_control(ctx.accounts.validate())]
pub fn handler(ctx: Context<EndArena>, arena_id: u64) -> Result<()> {
    let current_time = Clock::get()?.unix_timestamp as u64;

    let accts = ctx.accounts;
    let pyth_price_info = &accts.pyth_account;
    let pyth_price_data = &pyth_price_info.try_borrow_data()?;
    let pyth_price = pyth_client::cast::<pyth_client::Price>(pyth_price_data);

    accts.arena_state.final_price = pyth_price.agg.price as u64;
    accts.arena_state.end_timestamp = current_time;

    accts.arena_state.bet_result =
        if accts.arena_state.final_price >= accts.arena_state.locked_price {
            1
        } else {
            0
        };
    accts.arena_state.finalized = 1;

    msg!("locked price = {:?}", accts.arena_state.locked_price);
    msg!("final price = {:?}", accts.arena_state.final_price);
    msg!("bet_result = {:?}", accts.arena_state.bet_result);
    Ok(())
}
