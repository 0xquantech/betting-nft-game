use crate::{constants::*, states::*};
use anchor_lang::prelude::*;

use std::mem::size_of;

#[derive(Accounts)]
#[instruction(arena_id: u64)]
pub struct OpenArena<'info> {
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
      seeds = [ARENA_STATE_SEED, &arena_id.to_le_bytes()],
      bump,
      payer = authority,
      space = 8 + size_of::<ArenaState>()
    )]
    pub arena_state: Box<Account<'info, ArenaState>>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> OpenArena<'info> {
    fn validate(&self) -> Result<()> {
        Ok(())
    }
}

#[access_control(ctx.accounts.validate())]
pub fn handler(ctx: Context<OpenArena>, arena_id: u64) -> Result<()> {
    let current_time = Clock::get()?.unix_timestamp as u64;

    let accts = ctx.accounts;
    accts.arena_state.arena_id = arena_id;
    accts.arena_state.status = ArenaStatus::Opened as u8;
    Ok(())
}
