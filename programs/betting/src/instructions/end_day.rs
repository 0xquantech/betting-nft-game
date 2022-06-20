use anchor_lang::prelude::*;

use crate::{constants::*, error::*, instructions::*, states::*, utils::*};

use anchor_spl::{
    associated_token::{self, AssociatedToken},
    token::{self, Mint, Token, TokenAccount, Transfer},
};

use std::mem::size_of;

#[derive(Accounts)]
#[instruction(day: u64)]
pub struct EndDay<'info> {
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
      seeds = [DAY_RESULT_SEED, &day.to_le_bytes()],
      bump,
      payer = authority,
      space = 8 + size_of::<DayResult>()
    )]
    pub day_result: Box<Account<'info, DayResult>>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> EndDay<'info> {
    fn validate(&self) -> Result<()> {
        Ok(())
    }
}

#[access_control(ctx.accounts.validate())]
pub fn handler(ctx: Context<EndDay>, day: u64, tiers: [u64; 7], rewards: [u64; 7]) -> Result<()> {
    let current_time = Clock::get()?.unix_timestamp as u64;

    ctx.accounts.day_result.tiers = tiers;
    ctx.accounts.day_result.reward_per_tier = rewards;
    ctx.accounts.day_result.day = day;
    
    Ok(())
}
