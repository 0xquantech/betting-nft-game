use anchor_lang::{prelude::*, 
    solana_program::{
        pubkey,
        program::invoke_signed
    }
};

use crate::{constants::*, error::*, instructions::*, states::*, utils::*};
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount, Transfer, MintTo},
};
use mpl_token_metadata::{
    ID as MetadataProgramId,
};

#[warn(unused_doc_comments)]

#[derive(Accounts)]
#[instruction(box_id: u64)]
pub struct ClaimEightBox<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
      seeds = [GLOBAL_STATE_SEED],
      bump
    )]
    pub global_state: Box<Account<'info, GlobalState>>,

    #[account(
      mut,
      seeds = [EIGHT_BOX_STATE_SEED, user.key().as_ref(), &box_id.to_le_bytes()],
      bump
    )]
    pub eight_box_state: Box<Account<'info, EightBoxState>>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    #[account(address = MetadataProgramId)]
    /// CHECK:
    pub token_metadata_program: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> ClaimEightBox<'info> {
    fn validate(&self) -> Result<()> {
        require!(
            self.eight_box_state.bet_amount >= EIGHT_BOX_LIMIT_1,
            BettingError::UnableToClaim
        );
        require!(
            self.eight_box_state.is_claimed == 0,
            BettingError::AlreadyClaimed
        );
        Ok(())
    }
}

#[access_control(ctx.accounts.validate())]
pub fn handler<'a, 'b, 'c, 'info>(ctx: Context<'a, 'b, 'c, 'info, ClaimEightBox<'info>>, box_id: u64) -> Result<()> {
    let accts = ctx.accounts;
    let rem_accts = &mut ctx.remaining_accounts.iter();

    // nft reward if user is the top
    // remaining accounts
    // 1. bundleMinterKey
    // 2. mintKey
    // 3. accountKey
    // 4. metadataKey
    
    // if level 2
    if accts.eight_box_state.bet_amount >= EIGHT_BOX_LIMIT_2
     && accts.eight_box_state.bet_amount < EIGHT_BOX_LIMIT_3 {
        let bundle_minter = next_account_info(rem_accts)?;
        let current_time = Clock::get()?.unix_timestamp as u64;
        let bundle_id = 0;

        for i in 0..2 {
            let bundle_mint = next_account_info(rem_accts)?;
            let bundle_ata = next_account_info(rem_accts)?;
            let bundle_metadata = next_account_info(rem_accts)?;
            mint_bundle(
                bundle_mint.to_account_info(),
                bundle_ata.to_account_info(),
                bundle_metadata.to_account_info(),
                bundle_minter.to_account_info(),
                accts.user.to_account_info(),
                accts.token_metadata_program.to_account_info(),
                accts.token_program.to_account_info(),
                accts.system_program.to_account_info(),
                accts.rent.to_account_info(),
                accts.global_state.treasury,
                ctx.program_id,
                bundle_id
            )?;
        }
    } else {
        let mut bundle_id = 0;
        if accts.eight_box_state.bet_amount >= EIGHT_BOX_LIMIT_4 {
            // level 4
            bundle_id = 2;
        } else if accts.eight_box_state.bet_amount >= EIGHT_BOX_LIMIT_3 {
            // level 3
            bundle_id = 1;
        }
        let current_time = Clock::get()?.unix_timestamp as u64;
        let bundle_minter = next_account_info(rem_accts)?;
        let bundle_mint = next_account_info(rem_accts)?;
        let bundle_ata = next_account_info(rem_accts)?;
        let bundle_metadata = next_account_info(rem_accts)?;
        mint_bundle(
            bundle_mint.to_account_info(),
            bundle_ata.to_account_info(),
            bundle_metadata.to_account_info(),
            bundle_minter.to_account_info(),
            accts.user.to_account_info(),
            accts.token_metadata_program.to_account_info(),
            accts.token_program.to_account_info(),
            accts.system_program.to_account_info(),
            accts.rent.to_account_info(),
            accts.global_state.treasury,
            ctx.program_id,
            bundle_id
        )?;
    }

    accts.eight_box_state.is_claimed = 1;
    
    Ok(())
}
