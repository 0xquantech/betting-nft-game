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
pub struct OpenBundle<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        seeds = [GLOBAL_STATE_SEED],
        bump
    )]
    pub global_state: Box<Account<'info, GlobalState>>,

    #[account(
        seeds = [BUNDLE_MINTER_SEED],
        bump
    )]
    /// CHECK:
    pub bundle_creator: AccountInfo<'info>,

    #[account(
        mut,
        associated_token::mint = bundle_mint,
        associated_token::authority = user,
    )]
    pub user_bundle_ata: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub bundle_mint: Box<Account<'info, Mint>>,

    #[account(owner = MetadataProgramID)]
    /// CHECK:
    pub bundle_metadata: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    #[account(address = MetadataProgramID)]
    /// CHECK:
    pub token_metadata_program: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> OpenBundle<'info> {
    fn validate(&self) -> Result<()> {
        // Verify Metadata Account Key
        let (metadata_key, _) = Pubkey::find_program_address(
            &[
                b"metadata".as_ref(),
                MetadataProgramID.as_ref(),
                self.bundle_mint.key().as_ref(),
            ],
            &MetadataProgramID,
        );
        require_keys_eq!(
            metadata_key,
            self.bundle_metadata.key(),
            BettingError::IncorrectMetadata
        );
        // Metadata of NFT
        let bundle_meta: Metadata = Metadata::from_account_info(&self.bundle_metadata)?;
        // Check mint key in metadata
        require_keys_eq!(
            bundle_meta.mint,
            self.bundle_mint.key(),
            BettingError::IncorrectMetadata
        );
        // check amount
        require!(self.user_bundle_ata.amount == 1, BettingError::EmptyAccount);

        // check verified creator in creators list
        let creators = bundle_meta.data.creators.unwrap();
        let verified_creator = creators.iter().find(|&c| c.verified == true);
        if verified_creator.is_none() {
            return Err(error!(BettingError::IncorrectMetadata));
        }

        require_keys_eq!(
            verified_creator.unwrap().address,
            self.bundle_creator.key(),
            BettingError::IncorrectMetadata
        );
        Ok(())
    }
}

#[access_control(ctx.accounts.validate())]
pub fn handler<'a, 'b, 'c, 'info>(
    ctx: Context<'a, 'b, 'c, 'info, OpenBundle<'info>>,
) -> Result<()> {
    let current_time = Clock::get()?.unix_timestamp as u64;

    let accts = ctx.accounts;
    let rem_accts = &mut ctx.remaining_accounts.iter();

    let bundle_meta: Metadata = Metadata::from_account_info(&accts.bundle_metadata)?;
    let bundle_name: String = bundle_meta.data.name;
    let bundle_id = BUNDLE_NAMES
        .iter()
        .position(|&name| name.to_string().eq(&bundle_name))
        .unwrap_or(0);

    msg!("bundle id {}", bundle_id);
    let fragment_minter = next_account_info(rem_accts)?;
    for i in 0..BUNDLE_REWARD_COUNT[bundle_id] {
        let rand_val = current_time % 1001;
        let fragment_no = BUNDLE_FRAGMENT_RATE[bundle_id as usize]
            .iter()
            .position(|&rate| rand_val <= rate as u64)
            .unwrap_or(0);

        let iter = &mut ctx.remaining_accounts.iter();
        
        let mut fragment_mint = next_account_info(iter)?;
        let mut fragment_ata = next_account_info(iter)?;
        for i in 0..fragment_no {
            fragment_mint = next_account_info(iter)?;
            fragment_ata = next_account_info(iter)?;
        }

        mint_fragment(
            fragment_mint.to_account_info(),
            fragment_ata.to_account_info(),
            accts.global_state.to_account_info(),
            *ctx.bumps.get("global_state").unwrap(),
            accts.token_program.to_account_info(),
            ctx.program_id,
            fragment_no as u8 + 1,
        )?;
    }

    token::burn(
        CpiContext::new(
            accts.token_program.to_account_info(),
            Burn {
                mint: accts.bundle_mint.to_account_info(),
                from: accts.user_bundle_ata.to_account_info(),
                authority: accts.user.to_account_info(),
            },
        ),
        1,
    )?;
    
    Ok(())
}
