use anchor_lang::{
  prelude::*,
  solana_program::{program::invoke_signed, pubkey},
};

use crate::{constants::*, error::*, instructions::*, states::*, utils::*};
use anchor_spl::{
  associated_token::AssociatedToken,
  token::{self, Burn, Mint, MintTo, Token, TokenAccount, Transfer},
};
use mpl_token_metadata::{
  state::{Metadata, TokenMetadataAccount},
  ID as MetadataProgramID,
};
use std::mem::size_of;

#[warn(unused_doc_comments)]
#[derive(Accounts)]
pub struct BurnFragments<'info> {
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

  pub token_program: Program<'info, Token>,
  pub system_program: Program<'info, System>,
  pub rent: Sysvar<'info, Rent>
}

impl<'info> BurnFragments<'info> {
  fn validate(&self) -> Result<()> {
    Ok(())
  }
}

#[access_control(ctx.accounts.validate())]
pub fn handler<'a, 'b, 'c, 'info>(
  ctx: Context<'a, 'b, 'c, 'info, BurnFragments<'info>>,
) -> Result<()> {
  
  let accts = ctx.accounts;
  let iter = &mut ctx.remaining_accounts.iter();
  for i in 1..=9 {

      let fragment_mint = next_account_info(iter)?;
      let fragment_ata = next_account_info(iter)?;
      let (mint_key, _) = Pubkey::find_program_address(&[fragment_seed(i).as_str().as_ref()], &crate::ID);
      require!(mint_key.eq(&fragment_mint.key()), BettingError::IncorrectMint);

      token::burn(
          CpiContext::new(
              accts.token_program.to_account_info(),
              Burn {
                  mint: fragment_mint.to_account_info(),
                  from: fragment_ata.to_account_info(),
                  authority: accts.user.to_account_info(),
              },
          ),
          1,
      );
  }

  Ok(())
}
