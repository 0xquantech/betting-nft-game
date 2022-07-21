use crate::{constants::*, error::*};
use anchor_lang::{prelude::*, 
    solana_program::{
        hash::hash,
        pubkey,
        program::invoke_signed
    }
};
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount, Transfer, MintTo},
};
use mpl_token_metadata::{
    instruction::{create_metadata_accounts_v2},
    ID as MetadataProgramId,
    state::Creator
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

pub fn mint_fragment<'a>(
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
    fragment_id: usize
) -> Result<()> {
    let (_, bump) = Pubkey::find_program_address(&[FRAGMENT_MINTER_SEED.as_ref()], program_id);
    let signer_seeds = &[
        FRAGMENT_MINTER_SEED,
        &[bump],
    ];
    token::mint_to(        
        CpiContext::new(
            token_program.to_account_info(),
            MintTo {
                to: to.to_account_info(),
                mint: mint.to_account_info(),
                authority: collection_minter.to_account_info(),
            },
        ).with_signer(&[signer_seeds]),
    1)?;

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
    let creators = 
    
    vec![Creator {
        address: collection_minter.key(),
        verified: true,
        share: 0,
    },
    Creator {
        address: treaury_key,
        verified: false,
        share: 100,
    }];

    invoke_signed(
        &create_metadata_accounts_v2(
            token_metadata_program.key(),
            metadata.key(),
            mint.key(),
            collection_minter.key(),
            user.key(),
            collection_minter.key(),
            FRAGMENT_NAMES[fragment_id].to_string(),
            FRAGMENT_SYMBOL.to_string(),
            FRAGMENT_URIS[fragment_id].to_string(),
            Some(creators),
            1000u16,
            false,
            false,
            None,
            None,
        ),
        account_info.as_slice(),
        &[signer_seeds]
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
    program_id: &Pubkey
) -> Result<()> {
    let (_, bump) = Pubkey::find_program_address(&[NFT_MINTER_SEED.as_ref()], program_id);
    let signer_seeds = &[
        NFT_MINTER_SEED,
        &[bump],
    ];
    token::mint_to(        
        CpiContext::new(
            token_program.to_account_info(),
            MintTo {
                to: to.to_account_info(),
                mint: mint.to_account_info(),
                authority: collection_minter.to_account_info(),
            },
        ).with_signer(&[signer_seeds]),
    1)?;

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
    let creators = 
    
    vec![Creator {
        address: collection_minter.key(),
        verified: true,
        share: 0,
    },
    Creator {
        address: treaury_key,
        verified: false,
        share: 100,
    }];

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
        &[signer_seeds]
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
    bundle_id: usize
) -> Result<()> {
    let (_, bump) = Pubkey::find_program_address(&[FRAGMENT_MINTER_SEED.as_ref()], program_id);
    let signer_seeds = &[
        FRAGMENT_MINTER_SEED,
        &[bump],
    ];
    token::mint_to(        
        CpiContext::new(
            token_program.to_account_info(),
            MintTo {
                to: to.to_account_info(),
                mint: mint.to_account_info(),
                authority: collection_minter.to_account_info(),
            },
        ).with_signer(&[signer_seeds]),
    1)?;

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
    let creators = 
    
    vec![Creator {
        address: collection_minter.key(),
        verified: true,
        share: 0,
    },
    Creator {
        address: treaury_key,
        verified: false,
        share: 100,
    }];

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
        &[signer_seeds]
    )?;

    Ok(())
}