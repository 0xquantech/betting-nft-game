use anchor_lang::prelude::*;

use crate::{constants::*, error::*, instructions::*, states::*, utils::*};

#[derive(Accounts)]
pub struct CloseArenaState<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
      seeds = [GLOBAL_STATE_SEED],
      bump,
      has_one = authority
    )]
    pub global_state: Box<Account<'info, GlobalState>>,

    #[account(
      mut,
      close = authority
    )]
    pub arena_state: Box<Account<'info, ArenaState>>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(
    ctx: Context<CloseArenaState>,
) -> Result<()> {
    Ok(())
}
