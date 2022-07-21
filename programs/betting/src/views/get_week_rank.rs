use anchor_lang::prelude::*;

use crate::{states::*};

#[derive(Accounts)]
pub struct GetWeekRank<'info> {
    pub user_week_state: Box<Account<'info, WeekState>>,
    pub week_result: Box<Account<'info, WeekResult>>,
}

pub fn handler(ctx: Context<GetWeekRank>) -> Result<u8> {
    let accts = ctx.accounts;
    let mut position = accts
        .week_result
        .tiers
        .iter()
        .position(|tier| accts.user_week_state.bet_amount >= *tier)
        .unwrap_or(0);
        
    // if not listed in winner-list, position is 0.
    // position will start from 1, 2, ...
    position = position + 1;

    Ok(position as u8)
}
