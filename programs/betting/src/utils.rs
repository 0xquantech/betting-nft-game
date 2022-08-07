use crate::{constants::*, error::*};
use anchor_lang::{
    prelude::*,
    solana_program::{hash::hash, program::invoke_signed, pubkey},
};
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, MintTo, Token, TokenAccount, Transfer},
};
use mpl_token_metadata::{
    instruction::create_metadata_accounts_v2, 
    state::{ 
        Creator,
        Metadata,
        TokenMetadataAccount
    },
    ID as MetadataProgramID,
};

pub fn assert_ref_hash(
    user_pk: Pubkey,
    ref_key: Pubkey,
    expected_hash_key: [u8; 32],
) -> Result<()> {
    let pk_str = user_pk.to_string();
    let ref_key_str = ref_key.to_string();
    let hash_str = pk_str.clone() + ref_key_str.as_str() + "R3fareur";
    let ref_hash = hash(&hash_str.as_bytes());
    if ref_hash.to_bytes() != expected_hash_key {
        return Err(BettingError::InvalidReferrerHash.into());
    }
    Ok(())
}

pub fn fragment_seed(
    fragment_id: u8
) -> String {
    format!("{}{}", "FRAGMENT", fragment_id)
}

pub fn mint_fragment<'a>(
    mint: AccountInfo<'a>,
    to: AccountInfo<'a>,
    mint_auth: AccountInfo<'a>,
    bump: u8,
    token_program: AccountInfo<'a>,
    program_id: &Pubkey,
    fragment_no: u8
) -> Result<()> {
    // verify mint_key
    let (mint_key, _) = Pubkey::find_program_address(&[fragment_seed(fragment_no).as_str().as_ref()], program_id);
    require!(mint_key.eq(&mint.key()), BettingError::IncorrectMint);
    let signer_seeds = &[GLOBAL_STATE_SEED, &[bump]];
    token::mint_to(
        CpiContext::new(
            token_program.to_account_info(),
            MintTo {
                to: to.to_account_info(),
                mint: mint.to_account_info(),
                authority: mint_auth.to_account_info(),
            },
        )
        .with_signer(&[signer_seeds]),
        1,
    )?;
    Ok(())
}

pub fn mint_nft<'a>(
    mint: AccountInfo<'a>,
    to: AccountInfo<'a>,
    metadata: AccountInfo<'a>,
    collection_minter: AccountInfo<'a>,
    user: AccountInfo<'a>,
    token_metadata_program: AccountInfo<'a>,
    token_program: AccountInfo<'a>,
    system_program: AccountInfo<'a>,
    rent: AccountInfo<'a>,
    treaury_key: Pubkey,
    program_id: &Pubkey,
) -> Result<()> {
    let (_, bump) = Pubkey::find_program_address(&[NFT_MINTER_SEED.as_ref()], program_id);
    let signer_seeds = &[NFT_MINTER_SEED, &[bump]];
    token::mint_to(
        CpiContext::new(
            token_program.to_account_info(),
            MintTo {
                to: to.to_account_info(),
                mint: mint.to_account_info(),
                authority: collection_minter.to_account_info(),
            },
        )
        .with_signer(&[signer_seeds]),
        1,
    )?;

    let account_info = vec![
        metadata.clone(),
        mint.clone(),
        collection_minter.clone(),
        user.clone(),
        token_metadata_program.clone(),
        token_program.clone(),
        system_program.clone(),
        rent.clone(),
    ];
    msg!("Account Info Assigned");
    let creators = vec![
        Creator {
            address: collection_minter.key(),
            verified: true,
            share: 0,
        },
        Creator {
            address: treaury_key,
            verified: false,
            share: 100,
        },
    ];

    invoke_signed(
        &create_metadata_accounts_v2(
            token_metadata_program.key(),
            metadata.key(),
            mint.key(),
            collection_minter.key(),
            user.key(),
            collection_minter.key(),
            NFT_NAME.to_string(),
            NFT_SYMBOL.to_string(),
            NFT_URI.to_string(),
            Some(creators),
            1000u16,
            false,
            false,
            None,
            None,
        ),
        account_info.as_slice(),
        &[signer_seeds],
    )?;

    Ok(())
}

pub fn mint_bundle<'a>(
    mint: AccountInfo<'a>,
    to: AccountInfo<'a>,
    metadata: AccountInfo<'a>,
    collection_minter: AccountInfo<'a>,
    user: AccountInfo<'a>,
    token_metadata_program: AccountInfo<'a>,
    token_program: AccountInfo<'a>,
    system_program: AccountInfo<'a>,
    rent: AccountInfo<'a>,
    treaury_key: Pubkey,
    program_id: &Pubkey,
    bundle_id: usize,
) -> Result<()> {
    let (_, bump) = Pubkey::find_program_address(&[BUNDLE_MINTER_SEED.as_ref()], program_id);
    let signer_seeds = &[BUNDLE_MINTER_SEED, &[bump]];
    token::mint_to(
        CpiContext::new(
            token_program.to_account_info(),
            MintTo {
                to: to.to_account_info(),
                mint: mint.to_account_info(),
                authority: collection_minter.to_account_info(),
            },
        )
        .with_signer(&[signer_seeds]),
        1,
    )?;

    let account_info = vec![
        metadata.clone(),
        mint.clone(),
        collection_minter.clone(),
        user.clone(),
        token_metadata_program.clone(),
        token_program.clone(),
        system_program.clone(),
        rent.clone(),
    ];
    msg!("Account Info Assigned");
    let creators = vec![
        Creator {
            address: collection_minter.key(),
            verified: true,
            share: 0,
        },
        Creator {
            address: treaury_key,
            verified: false,
            share: 100,
        },
    ];

    invoke_signed(
        &create_metadata_accounts_v2(
            token_metadata_program.key(),
            metadata.key(),
            mint.key(),
            collection_minter.key(),
            user.key(),
            collection_minter.key(),
            BUNDLE_NAMES[bundle_id].to_string(),
            BUNDLE_SYMBOL.to_string(),
            BUNDLE_URIS[bundle_id].to_string(),
            Some(creators),
            1000u16,
            false,
            false,
            None,
            None,
        ),
        account_info.as_slice(),
        &[signer_seeds],
    )?;

    Ok(())
}

pub fn validate_nft_account_infos<'a>(
    mint: AccountInfo<'a>,
    metadata: AccountInfo<'a>,
    nft_ata: AccountInfo<'a>,
    verfied_creator: Pubkey
) -> Result<()> {
    // Verify Metadata Account Key
    let (metadata_key, _) = Pubkey::find_program_address(
        &[
            b"metadata".as_ref(),
            MetadataProgramID.as_ref(),
            mint.key().as_ref(),
        ],
        &MetadataProgramID,
    );
    require_keys_eq!(
        metadata_key,
        metadata.key(),
        BettingError::IncorrectMetadata
    );
    // Metadata of NFT
    let metadata_info: Metadata = Metadata::from_account_info(&metadata)?;
    // Check mint key in metadata
    require_keys_eq!(
        metadata_info.mint,
        mint.key(),
        BettingError::IncorrectMetadata
    );

    // check verified creator in creators list
    let creators = metadata_info.data.creators.unwrap();
    let verified_creator = creators.iter().find(|&c| c.verified == true);
    if verified_creator.is_none() {
        return Err(error!(BettingError::IncorrectMetadata));
    }

    require_keys_eq!(
        verified_creator.unwrap().address,
        verfied_creator,
        BettingError::IncorrectMetadata
    );

    Ok(())
}