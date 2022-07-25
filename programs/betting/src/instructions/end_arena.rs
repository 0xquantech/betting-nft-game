use anchor_lang::prelude::*;

use crate::{constants::*, error::*, states::*};

use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount, Transfer},
};

use pyth_client;
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
        has_one = treasury,
        has_one = token_mint
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
        require!(
            self.arena_state.status == ArenaStatus::Started as u8,
            BettingError::ArenaNotStarted
        );
        Ok(())
    }
    // CHECK: when take fee
    fn to_treasury_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
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
        return Err(error!(BettingError::ArenaFailed));
    }
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

    // expected reward amount for winners
    let expected_reward = bet_total_amount.checked_sub(platform_fee as u64).unwrap();

    // total of winners bet amount
    let total_user_success_bet = if accts.arena_state.bet_result == 0 {
        accts.arena_state.down_amount
    } else {
        accts.arena_state.up_amount
    };

    // if winner ratio is < 1, basically betting is failed
    if expected_reward < total_user_success_bet {
        // total amount of failed bet
        let total_user_fail_bet = if accts.arena_state.bet_result == 1 {
            accts.arena_state.down_amount
        } else {
            accts.arena_state.up_amount
        };

        // send to treasury
        let signer_seeds = &[
            GLOBAL_STATE_SEED,
            &[*(ctx.bumps.get("global_state").unwrap())],
        ];
        token::transfer(
            accts.to_treasury_context().with_signer(&[signer_seeds]),
            total_user_fail_bet as u64,
        )?;

        accts.arena_state.status = ArenaStatus::EndRatioBelow as u8;
    } else {
        // Referral Fee = Fee for platform * referralFeeRate
        let ref_fee = platform_fee
            .checked_mul(accts.global_state.referral_fee_rate as u128)
            .unwrap()
            .checked_div(FEE_RATE_DENOMINATOR as u128)
            .unwrap();

        // real platform fee = platform_fee - referal fee
        let real_platform_fee = platform_fee.checked_sub(ref_fee).unwrap();

        let signer_seeds = &[
            GLOBAL_STATE_SEED,
            &[*(ctx.bumps.get("global_state").unwrap())],
        ];
        token::transfer(
            accts.to_treasury_context().with_signer(&[signer_seeds]),
            real_platform_fee as u64,
        )?;

        accts.arena_state.status = ArenaStatus::EndSuccess as u8;
    }

    Ok(())
}
