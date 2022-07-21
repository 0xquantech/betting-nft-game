use anchor_lang::prelude::*;

use crate::{constants::*, error::*, instructions::*, states::*, utils::*};
use anchor_spl::{
    associated_token::{self, AssociatedToken},
    token::{self, Mint, Token, TokenAccount, Transfer},
};

use std::mem::size_of;

#[derive(Accounts)]
#[instruction(arena_id: u64)]
pub struct ReturnBet<'info> {
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

    pub token_mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
}

impl<'info> ReturnBet<'info> {
    fn validate(&self) -> Result<()> {
        let current_time = Clock::get()?.unix_timestamp as u64;
        // require!(current_time > )

        require!(
            self.arena_state.status == ArenaStatus::Cancelled as u8,
            BettingError::ArenaNotCancelled
        );
        // check if user has claimed
        require!(
            self.user_bet_state.is_claimed == 0,
            BettingError::AlreadyClaimed
        );
        Ok(())
    }
    fn return_bet_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.escrow_ata.to_account_info(),
                to: self.user_ata.to_account_info(),
                authority: self.global_state.to_account_info(),
            },
        )
    }
}

#[access_control(ctx.accounts.validate())]
pub fn handler(ctx: Context<ReturnBet>, arena_id: u64) -> Result<()> {
    let current_time = Clock::get()?.unix_timestamp as u64;
    let accts = ctx.accounts;

    let signer_seeds = &[
        GLOBAL_STATE_SEED,
        &[*(ctx.bumps.get("global_state").unwrap())],
    ];
    token::transfer(
        accts.return_bet_context().with_signer(&[signer_seeds]),
        accts.user_bet_state.bet_amount,
    )?;

    accts.user_bet_state.is_claimed = 1;

    Ok(())
}
