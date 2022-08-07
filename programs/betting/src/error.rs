use anchor_lang::prelude::*;

#[error_code]
pub enum BettingError {
    #[msg("You are not authorized to perform this action.")]
    Unauthorized,

    #[msg("You are not authorized to perform this action.")]
    NotAllowedAuthority,

    #[msg("Invalid Parameter")]
    InvalidParameter,

    #[msg("You are not winner.")]
    BetResultMisMatch,

    #[msg("You already claimed reward.")]
    AlreadyClaimed,

    #[msg("This Arena is finished")]
    FinishedArena,

    #[msg("This Arena is not finished")]
    ArenaNotFinished,

    #[msg("This Arena is not started")]
    ArenaNotStarted,

    #[msg("This Arena is not opened or already started")]
    ArenaNotOpened,

    #[msg("This Arena is not cancelled by admin")]
    ArenaNotCancelled,

    #[msg("Bet amount of one side is zero.")]
    ArenaFailed,

    #[msg("Incorrect Referrer")]
    ReferrerMisMatch,

    #[msg("Incorrect Referrer Hash")]
    InvalidReferrerHash,

    #[msg("Incorrect 8 Hour Box")]
    Incorrect8Hour,

    #[msg("Incorrect Hour")]
    IncorrectHour,

    #[msg("Incorrect Day")]
    IncorrectDay,

    #[msg("Incorrect Week")]
    IncorrectWeek,

    #[msg("Unable to claim because you are not winner")]
    UnableToClaim,

    #[msg("Reduce amount exceeds deposit amount")]
    ReduceAmountExceed,

    #[msg("Reduce is not accepted by client or freelancer")]
    ReduceNotAccepted,

    #[msg("Incorrect Metadata")]
    IncorrectMetadata,

    #[msg("Incorrect Mint")]
    IncorrectMint,

    #[msg("Token Account is empty")]
    EmptyAccount,

    #[msg("This fragment is already burnt")]
    FragmentAlreadyBurnt,
    
    #[msg("Not ready to build NFT")]
    NotReadyToBuildNFT,

    #[msg("This action is not expected.")]
    UnexpectedAction,
}
