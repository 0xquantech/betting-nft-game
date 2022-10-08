use anchor_lang::prelude::*;

use crate::{constants::*, error::*, instructions::*, states::*, utils::*};

#[derive(Accounts)]
pub struct CloseWeekResult<'info> {
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
    pub week_result: Box<Account<'info, WeekResult>>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(
    ctx: Context<CloseWeekResult>,
) -> Result<()> {
    Ok(())
}
