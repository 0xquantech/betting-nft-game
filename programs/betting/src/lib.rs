use anchor_lang::prelude::*;

declare_id!("7RQaqufWuf9px2fz6Rc3z3XghhKn77Vwf7KTXGSNsqzH");

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

    pub fn start_arena(ctx: Context<StartArena>, arena_id: u64) -> Result<()> {
        start_arena::handler(ctx, arena_id)
    }

    pub fn user_bet(ctx: Context<UserBet>, arena_id: u64, bet_amount: u64, bet_side: u8, ref_key: Pubkey, hash_key: [u8; 32]) -> Result<()> {
        user_bet::handler(ctx, arena_id, bet_amount, bet_side, ref_key, hash_key)
    }

    pub fn end_arena(ctx: Context<EndArena>, arena_id: u64) -> Result<()> {
        end_arena::handler(ctx, arena_id)
    }

    pub fn claim_reward(ctx: Context<ClaimReward>, arena_id: u64) -> Result<()> {
        claim_reward::handler(ctx, arena_id)
    }

    pub fn init_user_state(ctx: Context<InitUserState>, user_key: Pubkey) -> Result<()> {
        init_user_state::handler(ctx, user_key)
    }

    pub fn claim_referral_reward(ctx: Context<ClaimReferralReward>) -> Result<()> {
        claim_referral_reward::handler(ctx)
    }

}
