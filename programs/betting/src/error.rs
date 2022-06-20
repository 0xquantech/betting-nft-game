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

    #[msg("This Arena is not finished")]
    ArenaNotFinished,

    #[msg("This Arena is not started")]
    ArenaNotStarted,

    #[msg("This Arena is not opened or already started")]
    ArenaNotOpened,

    #[msg("Incorrect Referrer")]
    ReferrerMisMatch,

    #[msg("Incorrect Referrer Hash")]
    InvalidReferrerHash,

    #[msg("Incorrect Hour")]
    IncorrectHour,

    #[msg("Incorrect Day")]
    IncorrectDay,

    #[msg("Incorrect Week")]
    IncorrectWeek,

    #[msg("Reduce amount exceeds deposit amount")]
    ReduceAmountExceed,

    #[msg("Reduce is not accepted by client or freelancer")]
    ReduceNotAccepted,

    #[msg("This action is not expected.")]
    UnexpectedAction,
}
