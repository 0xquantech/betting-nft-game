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
pub struct BuildNft<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        seeds = [GLOBAL_STATE_SEED],
        bump
    )]
    pub global_state: Box<Account<'info, GlobalState>>,

   /* #[account(
        mut,
        seeds = [NFT_BUILD_STATE_SEED],
        bump,
        close = user
    )]
    pub nft_build_state: Box<Account<'info, NftBuildState>>,
    */
    #[account(
        mut,
        seeds = [NFT_MINTER_SEED],
        bump
    )]
    /// CHECK: safe
    pub nft_creator: AccountInfo<'info>,

    #[account(mut)]
    pub nft_mint: Box<Account<'info, Mint>>,
  
    #[account(mut)]
    /// CHECK: safe
    pub nft_metadata: AccountInfo<'info>,
    
    #[account(
      mut,
      associated_token::mint = nft_mint,
      associated_token::authority = user,
    )]
    pub user_nft_ata: Box<Account<'info, TokenAccount>>,
    #[account(address = MetadataProgramID)]
    /// CHECK:
    pub token_metadata_program: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> BuildNft<'info> {
    fn validate(&self) -> Result<()> {
       /* require!(self.nft_build_state.build_state 
            & 0b111111111 == self.nft_build_state.build_state,
            BettingError::NotReadyToBuildNFT
        );*/
        Ok(())
    }
}

#[access_control(ctx.accounts.validate())]
pub fn handler<'a, 'b, 'c, 'info>(
    ctx: Context<'a, 'b, 'c, 'info, BuildNft<'info>>,
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
    
    mint_nft(
        accts.nft_mint.to_account_info(),
        accts.user_nft_ata.to_account_info(),
        accts.nft_metadata.to_account_info(),
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
