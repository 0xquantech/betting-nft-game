use anchor_lang::prelude::*;

use crate::{constants::*, error::*, instructions::*, states::*, utils::*};
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount, Transfer},
};
use mpl_token_metadata::ID as MetadataProgramId;
#[derive(Accounts)]
#[instruction(week: u64)]
pub struct ClaimWeekRankReward<'info> {
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
      seeds = [WEEK_STATE_SEED, user.key().as_ref(), &week.to_le_bytes()],
      bump
    )]
    pub user_week_state: Box<Account<'info, WeekState>>,

    #[account(
      mut,
      seeds = [WEEK_RESULT_SEED, &week.to_le_bytes()],
      bump
    )]
    pub week_result: Box<Account<'info, WeekResult>>,

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
    #[account(address = MetadataProgramId)]
    /// CHECK:
    pub token_metadata_program: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> ClaimWeekRankReward<'info> {
    fn validate(&self) -> Result<()> {
        let last = self.week_result.tiers.len() - 1;
        require!(
            self.user_week_state.bet_amount >= self.week_result.tiers[last],
            BettingError::UnableToClaim
        );
        require!(
            self.user_week_state.is_claimed == 0,
            BettingError::AlreadyClaimed
        );
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
pub fn handler<'a, 'b, 'c, 'info>(
    ctx: Context<'a, 'b, 'c, 'info, ClaimWeekRankReward<'info>>,
    week: u64,
) -> Result<()> {
    let accts = ctx.accounts;
    let rem_accts = &mut ctx.remaining_accounts.iter();

    let position = accts
        .week_result
        .tiers
        .iter()
        .position(|tier| accts.user_week_state.bet_amount >= *tier)
        .unwrap();

    let reward_amount = accts.week_result.reward_per_tier[position];
    let signer_seeds = &[
        GLOBAL_STATE_SEED,
        &[*(ctx.bumps.get("global_state").unwrap())],
    ];
    // to freelancer
    token::transfer(
        accts.claim_reward_context().with_signer(&[signer_seeds]),
        reward_amount,
    )?;
    let current_time = Clock::get()?.unix_timestamp as u64;
    if position == 0 {
        msg!("position is zero");
        let nft_minter = next_account_info(rem_accts)?;
        let nft_mint = next_account_info(rem_accts)?;
        let nft_ata = next_account_info(rem_accts)?;
        let nft_metadata = next_account_info(rem_accts)?;
        let edition = next_account_info(rem_accts)?;
        mint_nft(
            nft_mint.to_account_info(),
            nft_ata.to_account_info(),
            nft_metadata.to_account_info(),
            edition.to_account_info(),
            nft_minter.to_account_info(),
            accts.user.to_account_info(),
            accts.token_metadata_program.to_account_info(),
            accts.token_program.to_account_info(),
            accts.system_program.to_account_info(),
            accts.rent.to_account_info(),
            accts.global_state.treasury,
            ctx.program_id,
        )?;
    }
    if position == 1 || position == 2 {
      msg!("position is {}", position);
      let bundle_minter = next_account_info(rem_accts)?;
      let bundle_mint = next_account_info(rem_accts)?;
      let bundle_ata = next_account_info(rem_accts)?;
      let bundle_metadata = next_account_info(rem_accts)?;
      let bundle_edition = next_account_info(rem_accts)?;
      mint_bundle(
          bundle_mint.to_account_info(),
          bundle_ata.to_account_info(),
          bundle_metadata.to_account_info(),
          bundle_edition.to_account_info(),
          bundle_minter.to_account_info(),
          accts.user.to_account_info(),
          accts.token_metadata_program.to_account_info(),
          accts.token_program.to_account_info(),
          accts.system_program.to_account_info(),
          accts.rent.to_account_info(),
          accts.global_state.treasury,
          ctx.program_id,
          4,
      )?;
    }
    accts.user_week_state.is_claimed = 1;
    Ok(())
}
