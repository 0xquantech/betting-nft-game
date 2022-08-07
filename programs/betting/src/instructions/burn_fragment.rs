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

#[warn(unused_doc_comments)]
#[derive(Accounts)]
pub struct BurnFragments<'info> {
  #[account(mut)]
  pub user: Signer<'info>,

  #[account(
      mut,
      seeds = [NFT_BUILD_STATE_SEED, user.key().as_ref()],
      bump
  )]
  pub nft_build_state: Box<Account<'info, NftBuildState>>,

  pub token_program: Program<'info, Token>,
}

impl<'info> BurnFragment<'info> {
  fn validate(&self) -> Result<()> {
    Ok(())
  }
}

#[access_control(ctx.accounts.validate())]
pub fn handler<'a, 'b, 'c, 'info>(
  ctx: Context<'a, 'b, 'c, 'info, BurnFragment<'info>>,
) -> Result<()> {
  
  let accts = ctx.accounts;

  let fragment_metadata_info: Metadata = Metadata::from_account_info(&accts.fragment_metadata)?;
  
  require!(fragment_metadata_info.mint.eq(&accts.fragment_mint.key()), BettingError::IncorrectMetadata);

  let fragment_name: String = fragment_metadata_info.data.name;
  let fragment_id = FRAGMENT_NAMES
      .iter()
      .position(|&name| name.to_string().eq(&fragment_name))
      .unwrap_or(0);

  let build_pos = 2u16.pow(fragment_id as u32);
  require!(accts.nft_build_state.build_state & build_pos == 0,
    BettingError::FragmentAlreadyBurnt
  );

  token::burn(
    CpiContext::new(
        accts.token_program.to_account_info(),
        Burn {
            mint: accts.fragment_mint.to_account_info(),
            from: accts.user_fragment_ata.to_account_info(),
            authority: accts.user.to_account_info(),
        },
    ),
    1,
  );

  accts.nft_build_state.build_state = 
    accts.nft_build_state.build_state | build_pos;
  Ok(())
}
