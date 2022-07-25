use crate::{constants::*, states::*};
use anchor_lang::prelude::*;

use std::mem::size_of;

#[derive(Accounts)]
#[instruction(user_key: Pubkey, box_id: u64)]
pub struct InitEightBoxState<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init,
        seeds = [EIGHT_BOX_STATE_SEED, user_key.as_ref(), &box_id.to_le_bytes()],
        bump,
        payer = payer,
        space = 8 + size_of::<EightBoxState>()
    )]
    pub eight_box_state: Box<Account<'info, EightBoxState>>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> InitEightBoxState<'info> {
    pub fn validate(&self) -> Result<()> {
        Ok(())
    }
}

#[access_control(ctx.accounts.validate())]
pub fn handler(ctx: Context<InitEightBoxState>, user_key: Pubkey, box_id: u64) -> Result<()> {
    let accts = ctx.accounts;
    accts.eight_box_state.user = user_key;
    accts.eight_box_state.start_time = box_id.checked_mul(EIGHT_HOUR).unwrap();
    Ok(())
}
