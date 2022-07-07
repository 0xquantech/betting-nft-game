use anchor_lang::prelude::*;

declare_id!("CkjLXWUbYttpTxDXvSxy3gwzA7PUfxs2W25F7kR7zE2j");

/// constant
pub mod constants;
/// error
pub mod error;
/// instructions
pub mod instructions;
/// states
pub mod states;
/// utils
pub mod utils;

use crate::instructions::*;

#[program]
pub mod betting {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, new_authority: Pubkey) -> Result<()> {
        initialize::handler(ctx, new_authority)
    }

    pub fn open_arena(ctx: Context<OpenArena>, arena_id: u64) -> Result<()> {
        open_arena::handler(ctx, arena_id)
    }

    pub fn start_arena(ctx: Context<StartArena>, arena_id: u64) -> Result<()> {
        start_arena::handler(ctx, arena_id)
    }

    pub fn cancel_arena(ctx: Context<CancelArena>, arena_id: u64) -> Result<()> {
        cancel_arena::handler(ctx, arena_id)
    }

    pub fn user_bet(
        ctx: Context<UserBet>,
        arena_id: u64,
        bet_amount: u64,
        hour: u64,
        day: u64,
        week: u64,
        bet_side: u8,
        ref_key: Pubkey,
        hash_key: [u8; 32],
    ) -> Result<()> {
        user_bet::handler(
            ctx, arena_id, bet_amount, hour, day, week, bet_side, ref_key, hash_key,
        )
    }

    pub fn end_arena(ctx: Context<EndArena>, arena_id: u64) -> Result<()> {
        end_arena::handler(ctx, arena_id)
    }

    pub fn claim_reward(ctx: Context<ClaimReward>, arena_id: u64) -> Result<()> {
        claim_reward::handler(ctx, arena_id)
    }

    pub fn return_bet(ctx: Context<ReturnBet>, arena_id: u64) -> Result<()> {
        return_bet::handler(ctx, arena_id)
    }

    pub fn init_user_state(ctx: Context<InitUserState>, user_key: Pubkey) -> Result<()> {
        init_user_state::handler(ctx, user_key)
    }

    pub fn claim_referral_reward(ctx: Context<ClaimReferralReward>) -> Result<()> {
        claim_referral_reward::handler(ctx)
    }

    pub fn init_hour_state(ctx: Context<InitHourState>, user_key: Pubkey, hour: u64) -> Result<()> {
        init_hour_state::handler(ctx, user_key, hour)
    }

    pub fn init_day_state(ctx: Context<InitDayState>, user_key: Pubkey, day: u64) -> Result<()> {
        init_day_state::handler(ctx, user_key, day)
    }

    pub fn init_week_state(ctx: Context<InitWeekState>, user_key: Pubkey, week: u64) -> Result<()> {
        init_week_state::handler(ctx, user_key, week)
    }

    pub fn end_hour(
        ctx: Context<EndHour>,
        hour: u64,
        tiers: [u64; 5],
        rewards: [u64; 5],
    ) -> Result<()> {
        end_hour::handler(ctx, hour, tiers, rewards)
    }

    pub fn end_day(
        ctx: Context<EndDay>,
        day: u64,
        tiers: [u64; 7],
        rewards: [u64; 7],
    ) -> Result<()> {
        end_day::handler(ctx, day, tiers, rewards)
    }

    pub fn end_week(
        ctx: Context<EndWeek>,
        week: u64,
        tiers: [u64; 9],
        rewards: [u64; 9],
    ) -> Result<()> {
        end_week::handler(ctx, week, tiers, rewards)
    }

    pub fn claim_hour_rank_reward(ctx: Context<ClaimHourRankReward>, hour: u64) -> Result<()> {
        claim_hour_rank_reward::handler(ctx, hour)
    }

    pub fn claim_day_rank_reward(ctx: Context<ClaimDayRankReward>, day: u64) -> Result<()> {
        claim_day_rank_reward::handler(ctx, day)
    }

    pub fn claim_week_rank_reward(ctx: Context<ClaimWeekRankReward>, week: u64) -> Result<()> {
        claim_week_rank_reward::handler(ctx, week)
    }
}
