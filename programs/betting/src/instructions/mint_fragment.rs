use anchor_lang::prelude::*;

use crate::{constants::*, error::*, instructions::*, states::*, utils::*};
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, MintTo, Token, TokenAccount, Transfer},
};
use mpl_token_metadata::ID as MetadataProgramId;

#[warn(unused_doc_comments)]
#[derive(Accounts)]
pub struct MintFragment<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
      seeds = [GLOBAL_STATE_SEED],
      bump,
    )]
    pub global_state: Box<Account<'info, GlobalState>>,

    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(init_if_needed, payer = user, associated_token::mint = mint, associated_token::authority = user)]
    pub user_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> MintFragment<'info> {
    fn validate(&self) -> Result<()> {
        Ok(())
    }
}

#[access_control(ctx.accounts.validate())]
pub fn handler<'a, 'b, 'c, 'info>(
    ctx: Context<'a, 'b, 'c, 'info, MintFragment<'info>>,
    fragment_no: u8
) -> Result<()> {
    let accts = ctx.accounts;
    let rem_accts = &mut ctx.remaining_accounts.iter();

    mint_fragment(
        accts.user.to_account_info(),
        accts.mint.to_account_info(),
        accts.user_ata.to_account_info(),
        accts.global_state.to_account_info(),
        *ctx.bumps.get("global_state").unwrap(),
        accts.token_program.to_account_info(),
        accts.associated_token_program.to_account_info(),
        accts.system_program.to_account_info(),
        accts.rent.to_account_info(),
        ctx.program_id,
        fragment_no,
    )?;

    Ok(())
}
