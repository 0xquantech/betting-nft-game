use anchor_lang::prelude::*;

use crate::states::*;

#[derive(Accounts)]
pub struct GetDayRank<'info> {
    pub user_day_state: Box<Account<'info, DayState>>,
    pub day_result: Box<Account<'info, DayResult>>,
}

pub fn handler(ctx: Context<GetDayRank>) -> Result<u8> {
    let accts = ctx.accounts;
    let mut position = accts
        .day_result
        .tiers
        .iter()
        .position(|tier| accts.user_day_state.bet_amount >= *tier)
        .unwrap_or(0);

    // if not listed in winner-list, position is 0.
    // position will start from 1, 2, ...
    position = position + 1;

    //Ok(position.unwrap() as u8);
    Ok(position as u8)
}
