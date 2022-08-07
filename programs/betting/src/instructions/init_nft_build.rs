use anchor_lang::{
  prelude::*,
  solana_program::{program::invoke_signed, pubkey},
};

use crate::{constants::*, error::*, instructions::*, states::*, utils::*};
use std::mem::size_of;

#[warn(unused_doc_comments)]
#[derive(Accounts)]
pub struct InitNftBuild<'info> {
  #[account(mut)]
  pub user: Signer<'info>,

  #[account(
      init,
      seeds = [NFT_BUILD_STATE_SEED, user.key().as_ref()],
      bump,
      payer = user,
      space = 8 + size_of::<NftBuildState>()
  )]
  pub nft_build_state: Box<Account<'info, NftBuildState>>,
  
  pub system_program: Program<'info, System>,
  pub rent: Sysvar<'info, Rent>
}

impl<'info> InitNftBuild<'info> {
  fn validate(&self) -> Result<()> {
    Ok(())
  }
}

#[access_control(ctx.accounts.validate())]
pub fn handler<'a, 'b, 'c, 'info>(
  ctx: Context<'a, 'b, 'c, 'info, InitNftBuild<'info>>,
) -> Result<()> {
  ctx.accounts.nft_build_state.user = ctx.accounts.user.key();
  Ok(())
}
