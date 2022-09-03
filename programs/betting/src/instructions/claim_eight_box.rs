use anchor_lang::{
    prelude::*,
    solana_program::{program::invoke_signed, pubkey},
};

use crate::{constants::*, error::*, instructions::*, states::*, utils::*};
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, MintTo, Token, TokenAccount, Transfer},
};
use mpl_token_metadata::ID as MetadataProgramId;

#[warn(unused_doc_comments)]
#[derive(Accounts)]
#[instruction(box_id: u64)]
pub struct ClaimEightBox<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
      seeds = [GLOBAL_STATE_SEED],
      bump
    )]
    pub global_state: Box<Account<'info, GlobalState>>,

    #[account(
      mut,
      seeds = [EIGHT_BOX_STATE_SEED, user.key().as_ref(), &box_id.to_le_bytes()],
      bump
    )]
    pub eight_box_state: Box<Account<'info, EightBoxState>>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    #[account(address = MetadataProgramId)]
    /// CHECK:
    pub token_metadata_program: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> ClaimEightBox<'info> {
    fn validate(&self, prize_id: u8) -> Result<()> {
        // prize_id will be 0, 1, 2, 3
        require!(prize_id <= 3, BettingError::InvalidParameter);
        // is able to claim prize?
        require!(
            self.eight_box_state.bet_amount >= EIGHT_BOX_LIMITS[prize_id as usize],
            BettingError::UnableToClaim
        );
        // is already claimed?
        // 2.pow(prize_id) = 1, 2, 4, 8
        let prize_exp = 2u8.pow(prize_id as u32);
        require!(
            self.eight_box_state.claimed_status & prize_exp == 0,
            BettingError::AlreadyClaimed
        );
        Ok(())
    }
}

#[access_control(ctx.accounts.validate(prize_id))]
pub fn handler<'a, 'b, 'c, 'info>(
    ctx: Context<'a, 'b, 'c, 'info, ClaimEightBox<'info>>,
    box_id: u64,
    prize_id: u8,
) -> Result<()> {
    let accts = ctx.accounts;
    let rem_accts = &mut ctx.remaining_accounts.iter();

    let mut bundle_id = 0;
    if prize_id == 0 {
      bundle_id = 0;
    } else if prize_id == 1 {
      bundle_id = 3;
    } else if prize_id == 2 {
      bundle_id = 4;
    } else if prize_id == 3 {
      bundle_id = 5;
    }

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
        bundle_id,
    )?;

    accts.eight_box_state.claimed_status =
        accts.eight_box_state.claimed_status | 2u8.pow(prize_id as u32);

    Ok(())
}
