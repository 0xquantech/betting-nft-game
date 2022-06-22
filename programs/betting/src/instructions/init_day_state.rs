use crate::{constants::*, error::*, states::*};
use anchor_lang::prelude::*;

use std::mem::size_of;

#[derive(Accounts)]
#[instruction(user_key: Pubkey, day: u64)]
pub struct InitDayState<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init,
        seeds = [DAY_STATE_SEED, user_key.as_ref(), &day.to_le_bytes()],
        bump,
        payer = payer,
        space = 8 + size_of::<DayState>()
    )]
    pub user_day_state: Box<Account<'info, DayState>>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> InitDayState<'info> {
    pub fn validate(&self) -> Result<()> {
      Ok(())
    }
}

#[access_control(ctx.accounts.validate())]
pub fn handler(ctx: Context<InitDayState>, user_key: Pubkey, day: u64) -> Result<()> {
    let accts = ctx.accounts;
    accts.user_day_state.user = user_key;
    accts.user_day_state.start_time = day.checked_mul(ONE_DAY).unwrap();
    Ok(())
}
