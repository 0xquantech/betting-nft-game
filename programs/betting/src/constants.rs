pub const GLOBAL_STATE_SEED: &[u8] = b"GLOBAL_STATE_SEED";
pub const USER_STATE_SEED: &[u8] = b"USER_STATE_SEED";
pub const ARENA_STATE_SEED: &[u8] = b"ARENA_STATE_SEED";
pub const USER_BET_SEED: &[u8] = b"USER_BET_SEED";

pub const FEE_RATE_DENOMINATOR: u64 = 10000;
pub const INITIAL_PLATFORM_FEE_RATE: u64 = 1000; // 10%
pub const INITIAL_REF_FEE_RATE: u64 = 1000; // 10%

pub enum ArenaStatus {
    Opened,
    Started,
    EndSuccess,
    EndFail
}
