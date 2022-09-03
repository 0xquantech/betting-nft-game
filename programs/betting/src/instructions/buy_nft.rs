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
pub struct BuyNft<'info> {
  #[account(mut)]
  pub user: Signer<'info>,

  #[account(
      seeds = [GLOBAL_STATE_SEED],
      bump
  )]
  pub global_state: Box<Account<'info, GlobalState>>,
  
  #[account(
      seeds = [NFT_MINTER_SEED],
      bump
  )]
  /// CHECK: safe
  pub nft_creator: AccountInfo<'info>,

  pub nft_mint: Box<Account<'info, Mint>>,

  #[account(mut)]
  /// CHECK: safe
  pub nft_metadata: AccountInfo<'info>,

  #[account(mut)]
  /// CHECK: safe
  pub nft_edition: AccountInfo<'info>,
  
  #[account(
    mut,
    associated_token::mint = nft_mint,
    associated_token::authority = user,
  )]
  pub user_nft_ata: Box<Account<'info, TokenAccount>>,
  
  #[account(
      mut,
      associated_token::mint = feel_mint,
      associated_token::authority = user,
  )]
  pub user_feel_ata: Box<Account<'info, TokenAccount>>,

  #[account(
      mut,
      associated_token::mint = feel_mint,
      associated_token::authority = global_state,
  )]
  pub feel_vault_ata: Box<Account<'info, TokenAccount>>,


  #[account(mut, address = global_state.rank_mint)]
  pub feel_mint: Account<'info, Mint>,

  #[account(address = MetadataProgramID)]
  /// CHECK:
  pub token_metadata_program: AccountInfo<'info>,
  pub token_program: Program<'info, Token>,
  pub system_program: Program<'info, System>,
  pub rent: Sysvar<'info, Rent>,
}

impl<'info> BuyNft<'info> {
  fn validate(&self) -> Result<()> {
      Ok(())
  }
  fn transfer_to_vault_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
      CpiContext::new(
          self.token_program.to_account_info(),
          Transfer {
              from: self.user_feel_ata.to_account_info(),
              to: self.feel_vault_ata.to_account_info(),
              authority: self.user.to_account_info(),
          },
      )
  }
  fn burn_feel_context(&self) -> CpiContext<'_, '_, '_, 'info, Burn<'info>> {
      CpiContext::new(
          self.token_program.to_account_info(),
          Burn {
              mint: self.feel_mint.to_account_info(),
              from: self.user_feel_ata.to_account_info(),
              authority: self.user.to_account_info(),
          },
      )
  }
}

#[access_control(ctx.accounts.validate())]
pub fn handler<'a, 'b, 'c, 'info>(
  ctx: Context<'a, 'b, 'c, 'info, BuyNft<'info>>
) -> Result<()> {
  let current_time = Clock::get()?.unix_timestamp as u64;
  let accts = ctx.accounts;
  let price = NFT_COST.checked_mul(10u64.pow(
      accts.feel_mint.decimals as u32
  )).unwrap();

  let burn_amount = price
      .checked_mul(BURNRATE_TOBUY_BUNDLE)
      .unwrap()
      .checked_div(100)
      .unwrap();
  let transfer_amount = price.checked_sub(burn_amount).unwrap();

  token::transfer(accts.transfer_to_vault_context(), transfer_amount);
  token::burn(accts.burn_feel_context(), burn_amount);
  
  mint_nft(
      accts.nft_mint.to_account_info(),
      accts.user_nft_ata.to_account_info(),
      accts.nft_metadata.to_account_info(),
      accts.nft_edition.to_account_info(),
      accts.nft_creator.to_account_info(),
      accts.user.to_account_info(),
      accts.token_metadata_program.to_account_info(),
      accts.token_program.to_account_info(),
      accts.system_program.to_account_info(),
      accts.rent.to_account_info(),
      accts.global_state.treasury,
      &crate::ID
  )?;

  Ok(())
}
