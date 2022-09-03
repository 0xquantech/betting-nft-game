use crate::{constants::*, error::*, instructions::*, states::*, utils::*};
use anchor_lang::prelude::*;

use pyth_client;

#[derive(Accounts)]
#[instruction(arena_id: u64)]
pub struct StartArena<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
      seeds = [GLOBAL_STATE_SEED],
      bump,
      has_one = authority,
      has_one = sol_pyth_account
    )]
    pub global_state: Box<Account<'info, GlobalState>>,

    #[account(
      mut,
      seeds = [ARENA_STATE_SEED, &arena_id.to_le_bytes()],
      bump
    )]
    pub arena_state: Box<Account<'info, ArenaState>>,

    /// CHECK: check in global state
    pub sol_pyth_account: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> StartArena<'info> {
    fn validate(&self) -> Result<()> {
        require!(
            self.arena_state.status == ArenaStatus::Opened as u8,
            BettingError::FinishedArena
        );
        Ok(())
    }
}

#[access_control(ctx.accounts.validate())]
pub fn handler(ctx: Context<StartArena>, arena_id: u64) -> Result<()> {
    let current_time = Clock::get()?.unix_timestamp as u64;

    let accts = ctx.accounts;
    let pyth_price_info = &accts.sol_pyth_account;
    let pyth_price_data = &pyth_price_info.try_borrow_data()?;
    let pyth_price = pyth_client::cast::<pyth_client::Price>(pyth_price_data);

    accts.arena_state.locked_price = pyth_price.agg.price as u64;
    accts.arena_state.start_timestamp = current_time;
    accts.arena_state.duration = accts.global_state.arena_duration;
    accts.arena_state.status = ArenaStatus::Started as u8;

    msg!("locked price = {:?}", accts.arena_state.locked_price);

    Ok(())
}
