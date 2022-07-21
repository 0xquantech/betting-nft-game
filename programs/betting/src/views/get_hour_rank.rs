use anchor_lang::prelude::*;

use crate::{states::*};

#[derive(Accounts)]
pub struct GetHourRank<'info> {
    pub user_hour_state: Box<Account<'info, HourState>>,
    pub hour_result: Box<Account<'info, HourResult>>,
}

pub fn handler(ctx: Context<GetHourRank>) -> Result<u8> {
    let accts = ctx.accounts;
    let mut position = accts
        .hour_result
        .tiers
        .iter()
        .position(|tier| accts.user_hour_state.bet_amount >= *tier)
        .unwrap_or(0);
        
    // if not listed in winner-list, position is 0.
    // position will start from 1, 2, ...
    position = position + 1;

    Ok(position as u8)
}
