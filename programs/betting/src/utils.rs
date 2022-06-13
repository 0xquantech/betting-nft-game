use crate::{constants::*, error::*};
use anchor_lang::{prelude::*, solana_program::hash::hash};

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
