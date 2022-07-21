use anchor_lang::prelude::*;

use crate::{constants::*, error::*, states::*, utils::*};
use anchor_spl::{
    associated_token::{AssociatedToken},
    token::{self, Mint, Token, TokenAccount, Transfer},
};

use std::mem::size_of;

#[derive(Accounts)]
#[instruction(arena_id: u64, b: u64, hour: u64, day: u64, week: u64, box_id: u64)]
pub struct UserBet<'info> {
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
    pub arena_state: Box<Account<'info, ArenaState>>,

    #[account(
      mut,
      seeds = [USER_STATE_SEED, user.key().as_ref()],
      bump
    )]
    pub user_state: Box<Account<'info, UserState>>,

    #[account(
      init,
      seeds = [USER_BET_SEED, user.key().as_ref(), &arena_id.to_le_bytes()],
      bump,
      payer = user,
      space = 8 + size_of::<UserBetState>()
    )]
    pub user_bet_state: Account<'info, UserBetState>,

    #[account(
        mut,
        seeds = [EIGHT_BOX_STATE_SEED, user.key().as_ref(), &box_id.to_le_bytes()],
        bump
      )]
    pub eight_box_state: Box<Account<'info, EightBoxState>>,

    #[account(
      mut,
      seeds = [HOUR_STATE_SEED, user.key().as_ref(), &hour.to_le_bytes()],
      bump
    )]
    pub user_hour_state: Box<Account<'info, HourState>>,

    #[account(
      mut,
      seeds = [DAY_STATE_SEED, user.key().as_ref(), &day.to_le_bytes()],
      bump
    )]
    pub user_day_state: Box<Account<'info, DayState>>,

    #[account(
      mut,
      seeds = [WEEK_STATE_SEED, user.key().as_ref(), &week.to_le_bytes()],
      bump
    )]
    pub user_week_state: Box<Account<'info, WeekState>>,

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
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> UserBet<'info> {
    fn validate(&self, ref_key: Pubkey, hash_key: [u8; 32]) -> Result<()> {
        let current_time = Clock::get()?.unix_timestamp as u64;
        // require!(current_time > )

        require!(
            self.arena_state.status == ArenaStatus::Opened as u8,
            BettingError::ArenaNotOpened
        );
        if self.user_state.is_ref_inited == 1 {
            require!(
                self.user_state.referrer.eq(&ref_key),
                BettingError::ReferrerMisMatch
            );
        }
        assert_ref_hash(self.user.key(), ref_key, hash_key)?;

        // validate hour, day, week states
        require!(
            self.user_hour_state.start_time <= current_time
                && self.user_hour_state.start_time + ONE_HOUR >= current_time,
            BettingError::IncorrectHour
        );

        require!(
            self.user_day_state.start_time <= current_time
                && self.user_day_state.start_time + ONE_DAY >= current_time,
            BettingError::IncorrectDay
        );

        require!(
            self.user_week_state.start_time <= current_time
                && self.user_week_state.start_time + ONE_WEEK >= current_time,
            BettingError::IncorrectWeek
        );

        Ok(())
    }
    fn bet_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.user_ata.to_account_info(),
                to: self.escrow_ata.to_account_info(),
                authority: self.user.to_account_info(),
            },
        )
    }
}

#[access_control(ctx.accounts.validate(ref_key, hash_key))]
pub fn handler(
    ctx: Context<UserBet>,
    arena_id: u64,
    bet_amount: u64,
    hour: u64,
    day: u64,
    week: u64,
    box_id: u64,
    is_up: u8,
    ref_key: Pubkey,
    hash_key: [u8; 32],
) -> Result<()> {
    let current_time = Clock::get()?.unix_timestamp as u64;
    let accts = ctx.accounts;
    accts.user_bet_state.user = accts.user.key();
    accts.user_bet_state.bet_timestamp = current_time;
    accts.user_bet_state.arena_id = arena_id;
    accts.user_bet_state.bet_amount = bet_amount;

    if is_up == 0 {
        accts.user_bet_state.is_up = 0;
        accts.arena_state.down_count += 1;
        accts.arena_state.down_amount = accts
            .arena_state
            .down_amount
            .checked_add(bet_amount)
            .unwrap();
    } else {
        accts.user_bet_state.is_up = 1;
        accts.arena_state.up_count += 1;
        accts.arena_state.up_amount = accts.arena_state.up_amount.checked_add(bet_amount).unwrap();
    };
    if accts.user_state.is_ref_inited == 0 {
        accts.user_state.is_ref_inited = 1;
        accts.user_state.referrer = ref_key;
    }

    token::transfer(accts.bet_context(), bet_amount)?;

    accts.eight_box_state.bet_amount = accts
        .eight_box_state
        .bet_amount
        .checked_add(bet_amount)
        .unwrap();
    accts.user_hour_state.bet_amount = accts
        .user_hour_state
        .bet_amount
        .checked_add(bet_amount)
        .unwrap();
    accts.user_day_state.bet_amount = accts
        .user_day_state
        .bet_amount
        .checked_add(bet_amount)
        .unwrap();
    accts.user_week_state.bet_amount = accts
        .user_week_state
        .bet_amount
        .checked_add(bet_amount)
        .unwrap();
    Ok(())
}
