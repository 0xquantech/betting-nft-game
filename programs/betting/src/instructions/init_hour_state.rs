use crate::{constants::*, error::*, states::*};
use anchor_lang::prelude::*;

use std::mem::size_of;

#[derive(Accounts)]
#[instruction(user_key: Pubkey, hour: u64)]
pub struct InitHourState<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init,
        seeds = [HOUR_STATE_SEED, user_key.as_ref(), &hour.to_le_bytes()],
        bump,
        payer = payer,
        space = 8 + size_of::<HourState>()
    )]
    pub user_hour_state: Box<Account<'info, HourState>>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> InitHourState<'info> {
    pub fn validate(&self) -> Result<()> {
      Ok(())
    }
}

#[access_control(ctx.accounts.validate())]
pub fn handler(ctx: Context<InitHourState>, user_key: Pubkey, hour: u64) -> Result<()> {
    let accts = ctx.accounts;
    accts.user_hour_state.user = user_key;
    accts.user_hour_state.start_time = hour;
    Ok(())
}
