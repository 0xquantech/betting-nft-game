use anchor_lang::prelude::*;

use crate::{constants::*, error::*, instructions::*, states::*, utils::*};
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, MintTo, Token, TokenAccount, Transfer},
};
use mpl_token_metadata::ID as MetadataProgramId;

#[warn(unused_doc_comments)]
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
    #[account(address = MetadataProgramId)]
    /// CHECK:
    pub token_metadata_program: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> ClaimHourRankReward<'info> {
    fn validate(&self) -> Result<()> {
        let last = self.hour_result.tiers.len() - 1;
        require!(
            self.user_hour_state.bet_amount >= self.hour_result.tiers[last],
            BettingError::UnableToClaim
        );
        require!(
            self.user_hour_state.is_claimed == 0,
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
    ctx: Context<'a, 'b, 'c, 'info, ClaimHourRankReward<'info>>,
    hour: u64,
) -> Result<()> {
    let accts = ctx.accounts;
    let rem_accts = &mut ctx.remaining_accounts.iter();

    let position = accts
        .hour_result
        .tiers
        .iter()
        .position(|tier| accts.user_hour_state.bet_amount >= *tier)
        .unwrap();

    // token transfer
    let reward_amount = accts.hour_result.reward_per_tier[position];
    let signer_seeds = &[
        GLOBAL_STATE_SEED,
        &[*(ctx.bumps.get("global_state").unwrap())],
    ];
    token::transfer(
        accts.claim_reward_context().with_signer(&[signer_seeds]),
        reward_amount,
    )?;
    // let token_pro = accts.token_program.to_account_info();

    // nft reward if user is the top
    // remaining accounts
    // 1. fragmentMinterKey
    // 2. mintKey
    // 3. accountKey
    // 4. metadataKey

    // Top1 -> Pack1
    if position == 0 {
        msg!("position is zero");
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
            0,
        )?;
    }

    accts.user_hour_state.is_claimed = 1;

    Ok(())
}
