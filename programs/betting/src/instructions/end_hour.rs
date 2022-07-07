use anchor_lang::prelude::*;

use crate::{constants::*, error::*, instructions::*, states::*, utils::*};

use anchor_spl::{
    associated_token::{self, AssociatedToken},
    token::{self, Mint, Token, TokenAccount, Transfer},
};

use std::mem::size_of;

#[derive(Accounts)]
#[instruction(hour: u64)]
pub struct EndHour<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        seeds = [GLOBAL_STATE_SEED],
        bump,
        has_one = authority,
    )]
    pub global_state: Box<Account<'info, GlobalState>>,

    #[account(
      init,
      seeds = [HOUR_RESULT_SEED, &hour.to_le_bytes()],
      bump,
      payer = authority,
      space = 8 + size_of::<HourResult>()
    )]
    pub hour_result: Box<Account<'info, HourResult>>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> EndHour<'info> {
    fn validate(&self) -> Result<()> {
        Ok(())
    }
}

#[access_control(ctx.accounts.validate())]
pub fn handler(ctx: Context<EndHour>, hour: u64, tiers: [u64; 5], rewards: [u64; 5]) -> Result<()> {
    let current_time = Clock::get()?.unix_timestamp as u64;

    ctx.accounts.hour_result.tiers = tiers;
    ctx.accounts.hour_result.reward_per_tier = rewards;
    ctx.accounts.hour_result.hour = hour;

    Ok(())
}
