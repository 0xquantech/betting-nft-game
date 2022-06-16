use anchor_lang::prelude::*;

use crate::{constants::*, error::*, instructions::*, states::*, utils::*};

use anchor_spl::{
    associated_token::{self, AssociatedToken},
    token::{self, Mint, Token, TokenAccount, Transfer},
};

use pyth_client;

use std::mem::size_of;

#[derive(Accounts)]
#[instruction(arena_id: u64)]
pub struct EndArena<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        seeds = [GLOBAL_STATE_SEED],
        bump,
        has_one = authority,
        has_one = pyth_account,
        has_one = treasury
    )]
    pub global_state: Box<Account<'info, GlobalState>>,

    #[account(
        mut,
        seeds = [ARENA_STATE_SEED, &arena_id.to_le_bytes()],
        bump,
    )]
    pub arena_state: Box<Account<'info, ArenaState>>,

    /// CHECK:
    pub pyth_account: AccountInfo<'info>,

    /// CHECK:
    pub treasury: AccountInfo<'info>,

    #[account(
        init_if_needed,
        associated_token::mint = token_mint,
        associated_token::authority = treasury,
        payer = authority
    )]
    pub treasury_ata: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        associated_token::mint = token_mint,
        associated_token::authority = global_state,
        payer = authority
    )]
    pub escrow_ata: Account<'info, TokenAccount>,
    pub token_mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> EndArena<'info> {
    fn validate(&self) -> Result<()> {
        require!(self.arena_state.status == ArenaStatus::Started as u8, BettingError::ArenaNotStarted);
        Ok(())
    }
    // CHECK: when take fee
    fn take_fee_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.escrow_ata.to_account_info(),
                to: self.treasury_ata.to_account_info(),
                authority: self.global_state.to_account_info(),
            },
        )
    }
}

#[access_control(ctx.accounts.validate())]
pub fn handler(ctx: Context<EndArena>, arena_id: u64) -> Result<()> {
    let current_time = Clock::get()?.unix_timestamp as u64;

    let accts = ctx.accounts;
    let pyth_price_info = &accts.pyth_account;
    let pyth_price_data = &pyth_price_info.try_borrow_data()?;
    let pyth_price = pyth_client::cast::<pyth_client::Price>(pyth_price_data);

    accts.arena_state.final_price = pyth_price.agg.price as u64;
    accts.arena_state.end_timestamp = current_time;

    accts.arena_state.bet_result =
        if accts.arena_state.final_price >= accts.arena_state.locked_price {
            1
        } else {
            0
        };

    if accts.arena_state.up_amount == 0 || accts.arena_state.down_amount == 0 {
        accts.arena_state.status = ArenaStatus::EndFail as u8;
    } else {
        accts.arena_state.status = ArenaStatus::EndSuccess as u8;
        msg!("locked price = {:?}", accts.arena_state.locked_price);
        msg!("final price = {:?}", accts.arena_state.final_price);
        msg!("bet_result = {:?}", accts.arena_state.bet_result);

        let bet_total_amount = accts
            .arena_state
            .up_amount
            .checked_add(accts.arena_state.down_amount)
            .unwrap();
        let platform_fee = (bet_total_amount as u128)
            .checked_mul(accts.global_state.platform_fee_rate as u128)
            .unwrap()
            .checked_div(FEE_RATE_DENOMINATOR as u128)
            .unwrap();

        let signer_seeds = &[
            GLOBAL_STATE_SEED,
            &[*(ctx.bumps.get("global_state").unwrap())],
        ];
        token::transfer(
            accts.take_fee_context().with_signer(&[signer_seeds]),
            platform_fee as u64,
        )?;
    }
    Ok(())
}
