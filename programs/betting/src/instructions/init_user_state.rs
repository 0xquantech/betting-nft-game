use crate::{constants::*, error::*, states::*};
use anchor_lang::prelude::*;

use std::mem::size_of;

#[derive(Accounts)]
#[instruction(user_key: Pubkey)]
pub struct InitUserState<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init,
        seeds = [USER_STATE_SEED, user_key.as_ref()],
        bump,
        payer = payer,
        space = 8 + size_of::<UserState>()
    )]
    pub user_state: Box<Account<'info, UserState>>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> InitUserState<'info> {
    pub fn validate(&self) -> Result<()> {
      Ok(())
    }
}

#[access_control(ctx.accounts.validate())]
pub fn handler(ctx: Context<InitUserState>, user_key: Pubkey) -> Result<()> {
    let accts = ctx.accounts;
    accts.user_state.user = user_key;
    Ok(())
}
