use anchor_lang::prelude::*;

use crate::{constants::*, error::*, instructions::*, states::*, utils::*};

use anchor_spl::{
    associated_token::{self, AssociatedToken},
    token::{self, Mint, Token, TokenAccount, Transfer},
};

use std::mem::size_of;

#[derive(Accounts)]
#[instruction(week: u64)]
pub struct EndWeek<'info> {
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
      seeds = [WEEK_RESULT_SEED, &week.to_le_bytes()],
      bump,
      payer = authority,
      space = 8 + size_of::<WeekResult>()
    )]
    pub week_result: Box<Account<'info, WeekResult>>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> EndWeek<'info> {
    fn validate(&self) -> Result<()> {
        Ok(())
    }
}

#[access_control(ctx.accounts.validate())]
pub fn handler(ctx: Context<EndWeek>, week: u64, tiers: [u64; 9], rewards: [u64; 9]) -> Result<()> {
    let current_time = Clock::get()?.unix_timestamp as u64;

    ctx.accounts.week_result.tiers = tiers;
    ctx.accounts.week_result.reward_per_tier = rewards;
    ctx.accounts.week_result.week = week;

    Ok(())
}
