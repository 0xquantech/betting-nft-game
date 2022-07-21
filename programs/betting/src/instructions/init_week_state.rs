use crate::{constants::*, states::*};
use anchor_lang::prelude::*;

use std::mem::size_of;

#[derive(Accounts)]
#[instruction(user_key: Pubkey, week: u64)]
pub struct InitWeekState<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init,
        seeds = [WEEK_STATE_SEED, user_key.as_ref(), &week.to_le_bytes()],
        bump,
        payer = payer,
        space = 8 + size_of::<WeekState>()
    )]
    pub user_week_state: Box<Account<'info, WeekState>>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> InitWeekState<'info> {
    pub fn validate(&self) -> Result<()> {
        Ok(())
    }
}

#[access_control(ctx.accounts.validate())]
pub fn handler(ctx: Context<InitWeekState>, user_key: Pubkey, week: u64) -> Result<()> {
    let accts = ctx.accounts;
    accts.user_week_state.user = user_key;
    accts.user_week_state.start_time = week.checked_mul(ONE_WEEK).unwrap();
    Ok(())
}
