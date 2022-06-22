pub const GLOBAL_STATE_SEED: &[u8] = b"GLOBAL_STATE_SEED";
pub const USER_STATE_SEED: &[u8] = b"USER_STATE_SEED";
pub const ARENA_STATE_SEED: &[u8] = b"ARENA_STATE_SEED";
pub const USER_BET_SEED: &[u8] = b"USER_BET_SEED";

pub const HOUR_STATE_SEED: &[u8] = b"HOUR_STATE_SEED";
pub const DAY_STATE_SEED: &[u8] = b"DAY_STATE_SEED";
pub const WEEK_STATE_SEED: &[u8] = b"WEEK_STATE_SEED";

pub const HOUR_RESULT_SEED: &[u8] = b"HOUR_RESULT_SEED";
pub const DAY_RESULT_SEED: &[u8] = b"DAY_RESULT_SEED";
pub const WEEK_RESULT_SEED: &[u8] = b"WEEK_RESULT_SEED";

pub const FEE_RATE_DENOMINATOR: u64 = 10000;
pub const INITIAL_PLATFORM_FEE_RATE: u64 = 1000; // 10%
pub const INITIAL_REF_FEE_RATE: u64 = 1000; // 10%

// in seconds
pub const ONE_HOUR: u64 = 60 * 60;
pub const ONE_DAY: u64 = ONE_HOUR * 24;
pub const ONE_WEEK: u64 = ONE_DAY * 7;

pub enum ArenaStatus {
    Opened,
    Started,
    EndSuccess,
    EndFail
}
