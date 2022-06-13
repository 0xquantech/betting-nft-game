use anchor_lang::prelude::*;

#[error_code]
pub enum BettingError {
    #[msg("You are not authorized to perform this action.")]
    Unauthorized,

    #[msg("You are not authorized to perform this action.")]
    NotAllowedAuthority,

    #[msg("You are not winner.")]
    BetResultMisMatch,

    #[msg("You already claimed reward.")]
    AlreadyClaimed,

    #[msg("This Arena is finished")]
    FinishedArena,

    #[msg("Incorrect Referrer")]
    ReferrerMisMatch,

    #[msg("Incorrect Referrer Hash")]
    InvalidReferrerHash,

    #[msg("Reduce amount exceeds deposit amount")]
    ReduceAmountExceed,

    #[msg("Reduce is not accepted by client or freelancer")]
    ReduceNotAccepted,

    #[msg("This action is not expected.")]
    UnexpectedAction,
}
