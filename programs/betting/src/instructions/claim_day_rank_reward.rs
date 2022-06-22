use anchor_lang::prelude::*;

use crate::{constants::*, error::*, instructions::*, states::*, utils::*};
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount, Transfer},
};

#[derive(Accounts)]
#[instruction(day: u64)]
pub struct ClaimDayRankReward<'info> {
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
      seeds = [DAY_STATE_SEED, user.key().as_ref(), &day.to_le_bytes()],
      bump
    )]
    pub user_day_state: Box<Account<'info, DayState>>,

    #[account(
      mut,
      seeds = [DAY_RESULT_SEED, &day.to_le_bytes()],
      bump
    )]
    pub day_result: Box<Account<'info, DayResult>>,

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

impl<'info> ClaimDayRankReward<'info> {
    fn validate(&self) -> Result<()> {
      let last = self.day_result.tiers.len() - 1;
      require!(self.user_day_state.bet_amount >= self.day_result.tiers[last],
        BettingError::UnableToClaim);
      require!(self.user_day_state.is_claimed == 0,
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
pub fn handler(ctx: Context<ClaimDayRankReward>, day: u64) -> Result<()> {
    let accts = ctx.accounts;

    let mut reward_amount = 0;
    let tiers = accts.day_result.tiers;
    let last = tiers.len() - 1;
    for i in last..=0 {
      if accts.user_day_state.bet_amount >= tiers[i] {
        reward_amount = accts.day_result.reward_per_tier[i];
        break;
      }
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

    accts.user_day_state.is_claimed = 1;
    Ok(())
}
