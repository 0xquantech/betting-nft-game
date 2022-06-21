use anchor_lang::prelude::*;

use crate::{constants::*, error::*, instructions::*, states::*, utils::*};
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount, Transfer},
};

#[derive(Accounts)]
#[instruction(hour: u64)]
pub struct ClaimHourRankReward<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
      seeds = [GLOBAL_STATE_SEED],
      bump,
      has_one = rank_mint
    )]
    pub global_state: Box<Account<'info, GlobalState>>,

    #[account(
      mut,
      associated_token::mint = rank_mint,
      associated_token::authority = global_state,
    )]
    pub feel_vault_ata: Box<Account<'info, TokenAccount>>,

    #[account(
      mut,
      seeds = [HOUR_STATE_SEED, user.key().as_ref(), &hour.to_le_bytes()],
      bump
    )]
    pub user_hour_state: Box<Account<'info, HourState>>,

    #[account(
      mut,
      seeds = [HOUR_RESULT_SEED, &hour.to_le_bytes()],
      bump
    )]
    pub hour_result: Box<Account<'info, HourResult>>,

    #[account(
      init_if_needed,
      associated_token::mint = rank_mint,
      associated_token::authority = user,
      payer = user
    )]
    pub user_feel_ata: Box<Account<'info, TokenAccount>>,
    
    pub rank_mint: Box<Account<'info, Mint>>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> ClaimHourRankReward<'info> {
    fn validate(&self) -> Result<()> {
      require!(self.user_hour_state.bet_amount >= self.hour_result.tiers[0],
        BettingError::UnableToClaim);
      require!(self.user_hour_state.is_claimed == 0,
         BettingError::AlreadyClaimed);
      Ok(())
    }
    fn claim_reward_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.feel_vault_ata.to_account_info(),
                to: self.user_feel_ata.to_account_info(),
                authority: self.global_state.to_account_info(),
            },
        )
    }
}

#[access_control(ctx.accounts.validate())]
pub fn handler(ctx: Context<ClaimHourRankReward>, hour: u64) -> Result<()> {
    let accts = ctx.accounts;

    let mut reward_amount = 0;
    let tiers = accts.hour_result.tiers;

    for i in 0..=tiers.len() {
      if accts.user_hour_state.bet_amount < tiers[i] {
        reward_amount = accts.hour_result.reward_per_tier[i-1];
        break;
      }
    }
    if reward_amount == 0 {
      reward_amount = accts.hour_result.reward_per_tier[tiers.len() - 1];
    }

    let signer_seeds = &[
      GLOBAL_STATE_SEED,
        &[*(ctx.bumps.get("global_state").unwrap())],
    ];
    // to freelancer
    token::transfer(
        accts.claim_reward_context().with_signer(&[signer_seeds]),
        reward_amount,
    )?;

    accts.user_hour_state.is_claimed = 1;
    Ok(())
}
