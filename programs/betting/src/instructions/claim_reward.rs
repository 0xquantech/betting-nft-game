use anchor_lang::prelude::*;

use crate::{constants::*, error::*, states::*};
use anchor_spl::{
    associated_token::{AssociatedToken},
    token::{self, Mint, Token, TokenAccount, Transfer},
};

#[derive(Accounts)]
#[instruction(arena_id: u64)]
pub struct ClaimReward<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
      seeds = [GLOBAL_STATE_SEED],
      bump,
      has_one = token_mint
    )]
    pub global_state: Box<Account<'info, GlobalState>>,

    #[account(
      mut,
      seeds = [ARENA_STATE_SEED, &arena_id.to_le_bytes()],
      bump,
    )]
    pub arena_state: Account<'info, ArenaState>,

    #[account(
      mut,
      seeds = [USER_BET_SEED, user.key().as_ref(), &arena_id.to_le_bytes()],
      bump,
    )]
    pub user_bet_state: Account<'info, UserBetState>,

    #[account(
      mut,
      associated_token::mint = token_mint,
      associated_token::authority = user
    )]
    pub user_ata: Account<'info, TokenAccount>,

    #[account(
      mut,
      associated_token::mint = token_mint,
      associated_token::authority = global_state,
    )]
    pub escrow_ata: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [USER_STATE_SEED, user.key().as_ref()],
        bump
    )]
    pub user_state: Box<Account<'info, UserState>>,

    #[account(
        mut,
        seeds = [USER_STATE_SEED, user_state.referrer.as_ref()],
        bump
    )]
    pub ref_user_state: Box<Account<'info, UserState>>,

    #[account(
        init_if_needed,
        associated_token::mint = token_mint,
        associated_token::authority = ref_user_state,
        payer = user,
    )]
    pub ref_user_vault_ata: Box<Account<'info, TokenAccount>>,

    pub token_mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> ClaimReward<'info> {
    fn validate(&self) -> Result<()> {
        let current_time = Clock::get()?.unix_timestamp as u64;
        // require!(current_time > )

        require!(
            self.arena_state.status == ArenaStatus::EndSuccess as u8
                || self.arena_state.status == ArenaStatus::EndRatioBelow as u8,
            BettingError::ArenaNotFinished
        );
        // check bet result
        require!(
            self.user_bet_state.is_up == self.arena_state.bet_result,
            BettingError::BetResultMisMatch
        );
        // check if user has claimed
        require!(
            self.user_bet_state.is_claimed == 0,
            BettingError::AlreadyClaimed
        );
        Ok(())
    }
    fn claim_reward_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.escrow_ata.to_account_info(),
                to: self.user_ata.to_account_info(),
                authority: self.global_state.to_account_info(),
            },
        )
    }
    fn take_referral_fee_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.escrow_ata.to_account_info(),
                to: self.ref_user_vault_ata.to_account_info(),
                authority: self.global_state.to_account_info(),
            },
        )
    }
}

#[access_control(ctx.accounts.validate())]
pub fn handler(ctx: Context<ClaimReward>, arena_id: u64) -> Result<()> {
    let current_time = Clock::get()?.unix_timestamp as u64;
    let accts = ctx.accounts;

    // winner_ratio is < 1, winner returns back his bet amount.
    if accts.arena_state.status == ArenaStatus::EndRatioBelow as u8 {
        let signer_seeds = &[
            GLOBAL_STATE_SEED,
            &[*(ctx.bumps.get("global_state").unwrap())],
        ];
        token::transfer(
            accts.claim_reward_context().with_signer(&[signer_seeds]),
            accts.user_bet_state.bet_amount,
        )?;
        accts.user_bet_state.is_claimed = 1;
        return Ok(());
    }
    // total bet amount = up + down
    let bet_total_amount = accts
        .arena_state
        .up_amount
        .checked_add(accts.arena_state.down_amount)
        .unwrap();

    // user reward = bet_total_amount * (mybetUp / totalbetInMySide)
    let total_user_success_bet = if accts.arena_state.bet_result == 0 {
        accts.arena_state.down_amount
    } else {
        accts.arena_state.up_amount
    };

    // user's reward
    let user_reward = u128::from(bet_total_amount)
        .checked_mul(accts.user_bet_state.bet_amount as u128)
        .unwrap()
        .checked_div(total_user_success_bet as u128)
        .unwrap();

    // Fee for platform = user's reward * platformFeeRate
    let platform_fee = user_reward
        .checked_mul(accts.global_state.platform_fee_rate as u128)
        .unwrap()
        .checked_div(FEE_RATE_DENOMINATOR as u128)
        .unwrap();

    // Referral Fee = Fee for platform * referralFeeRate
    let ref_fee = platform_fee
        .checked_mul(accts.global_state.referral_fee_rate as u128)
        .unwrap()
        .checked_div(FEE_RATE_DENOMINATOR as u128)
        .unwrap();

    accts.ref_user_state.ref_reward = accts
        .ref_user_state
        .ref_reward
        .checked_add(ref_fee as u64)
        .unwrap();

    // This is user's real reward which user will have had received
    let user_real_reward = user_reward.checked_sub(platform_fee).unwrap() as u64;

    let signer_seeds = &[
        GLOBAL_STATE_SEED,
        &[*(ctx.bumps.get("global_state").unwrap())],
    ];

    token::transfer(
        accts.claim_reward_context().with_signer(&[signer_seeds]),
        user_real_reward,
    )?;

    token::transfer(
        accts
            .take_referral_fee_context()
            .with_signer(&[signer_seeds]),
        ref_fee as u64,
    )?;

    accts.user_bet_state.is_claimed = 1;
    Ok(())
}
