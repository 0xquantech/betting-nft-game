use anchor_lang::prelude::*;

use crate::{constants::*, error::*, instructions::*, states::*, utils::*};
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount, Transfer},
};
use mpl_token_metadata::{
    ID as MetadataProgramId,
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
    #[account(address = MetadataProgramId)]
    /// CHECK:
    pub token_metadata_program: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> ClaimDayRankReward<'info> {
    fn validate(&self) -> Result<()> {
        let last = self.day_result.tiers.len() - 1;
        require!(
            self.user_day_state.bet_amount >= self.day_result.tiers[last],
            BettingError::UnableToClaim
        );
        require!(
            self.user_day_state.is_claimed == 0,
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
pub fn handler<'a, 'b, 'c, 'info>(ctx: Context<'a, 'b, 'c, 'info, ClaimDayRankReward<'info>>, day: u64) -> Result<()> {
    let accts = ctx.accounts;
    let rem_accts = &mut ctx.remaining_accounts.iter();

    let position = accts
        .day_result
        .tiers
        .iter()
        .position(|tier| accts.user_day_state.bet_amount >= *tier)
        .unwrap();
    let reward_amount = accts.day_result.reward_per_tier[position];

    msg!("day bet amount = {}", accts.user_day_state.bet_amount);
    msg!("reward tiers = {:?}", accts.day_result.reward_per_tier);
    msg!("reward_amount = {}", reward_amount);

    let signer_seeds = &[
        GLOBAL_STATE_SEED,
        &[*(ctx.bumps.get("global_state").unwrap())],
    ];
    // to freelancer
    token::transfer(
        accts.claim_reward_context().with_signer(&[signer_seeds]),
        reward_amount,
    )?;

    if position == 0 {
        let current_time = Clock::get()?.unix_timestamp as u64;
        let fragment_id = 8; // in week rank, the top winner will get Fragment 9.
        let fragment_minter = next_account_info(rem_accts)?;
        let fragment_mint = next_account_info(rem_accts)?;
        let fragment_ata = next_account_info(rem_accts)?;
        let fragment_metadata = next_account_info(rem_accts)?;
        mint_fragment(
            fragment_mint.to_account_info(),
            fragment_ata.to_account_info(),
            fragment_metadata.to_account_info(),
            fragment_minter.to_account_info(),
            accts.user.to_account_info(),
            accts.token_metadata_program.to_account_info(),
            accts.token_program.to_account_info(),
            accts.system_program.to_account_info(),
            accts.rent.to_account_info(),
            accts.global_state.treasury,
            ctx.program_id,
            fragment_id
        )?;
    }

    accts.user_day_state.is_claimed = 1;
    Ok(())
}
