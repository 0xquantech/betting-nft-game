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
pub struct BurnFragment<'info> {
  #[account(mut)]
  pub user: Signer<'info>,

  #[account(
      seeds = [GLOBAL_STATE_SEED],
      bump
  )]
  pub global_state: Box<Account<'info, GlobalState>>,

  #[account(
      mut,
      seeds = [NFT_BUILD_STATE_SEED],
      bump
  )]
  pub nft_build_state: Box<Account<'info, NftBuildState>>,
  
  pub fragment_mint: Box<Account<'info, Mint>>,

  /// CHECK:
  pub fragment_metadata: AccountInfo<'info>,
  
  #[account(
    mut,
    associated_token::mint = fragment_mint,
    associated_token::authority = user,
  )]
  pub user_fragment_ata: Box<Account<'info, TokenAccount>>,

  pub token_program: Program<'info, Token>,
}

impl<'info> BurnFragment<'info> {
  fn validate(&self) -> Result<()> {
   
    let (fragment_creator_key, _) = Pubkey::find_program_address(
      &[FRAGMENT_MINTER_SEED],
      &crate::ID
    );

    validate_nft_account_infos(
      self.fragment_mint.to_account_info(),
      self.fragment_metadata.to_account_info(),
      self.fragment_ata.to_account_info(),
      fragment_creator_key
    )?;
    Ok(())
  }
}

#[access_control(ctx.accounts.validate())]
pub fn handler<'a, 'b, 'c, 'info>(
  ctx: Context<'a, 'b, 'c, 'info, BurnFragment<'info>>,
) -> Result<()> {
  
  let accts = ctx.accounts;

  let fragment_metadata_info: Metadata = Metadata::from_account_info(&accts.fragment_metadata)?;
  let fragment_name: String = fragment_metadata_info.data.name;
  let fragment_id = FRAGMENT_NAMES
      .iter()
      .position(|&name| name.to_string().eq(&fragment_name))
      .unwrap_or(0);

  let build_pos = 2u16.pow(fragment_id);
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
