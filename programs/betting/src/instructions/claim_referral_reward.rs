use anchor_lang::prelude::*;

use crate::{constants::*, error::*, instructions::*, states::*, utils::*};
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount, Transfer},
};

#[derive(Accounts)]
pub struct ClaimReferralReward<'info> {
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
      associated_token::mint = token_mint,
      associated_token::authority = user,
    )]
    pub user_ata: Box<Account<'info, TokenAccount>>,

    #[account(
      mut,
      seeds = [USER_STATE_SEED, user.key().as_ref()],
      bump,
      has_one = user
    )]
    pub user_state: Account<'info, UserState>,

    #[account(
        init_if_needed,
        associated_token::mint = token_mint,
        associated_token::authority = user_state,
        payer = user
    )]
    pub user_vault_ata: Box<Account<'info, TokenAccount>>,

    pub token_mint: Box<Account<'info, Mint>>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> ClaimReferralReward<'info> {
    fn validate(&self) -> Result<()> {
        Ok(())
    }
    fn claim_referral_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.user_vault_ata.to_account_info(),
                to: self.user_ata.to_account_info(),
                authority: self.user_state.to_account_info(),
            },
        )
    }
}

#[access_control(ctx.accounts.validate())]
pub fn handler(ctx: Context<ClaimReferralReward>) -> Result<()> {
    let accts = ctx.accounts;
    let user_key = accts.user.key();
    let signer_seeds = &[
        USER_STATE_SEED,
        user_key.as_ref(),
        &[*(ctx.bumps.get("user_state").unwrap())],
    ];
    // to freelancer
    token::transfer(
        accts.claim_referral_context().with_signer(&[signer_seeds]),
        accts.user_vault_ata.amount,
    )?;

    accts.user_state.ref_reward = 0;
    Ok(())
}
