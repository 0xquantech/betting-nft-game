pub const GLOBAL_STATE_SEED: &[u8] = b"GLOBAL_STATE_SEED";
pub const USER_STATE_SEED: &[u8] = b"USER_STATE_SEED";
pub const ARENA_STATE_SEED: &[u8] = b"ARENA_STATE_SEED";
pub const USER_BET_SEED: &[u8] = b"USER_BET_SEED";

pub const EIGHT_BOX_STATE_SEED: &[u8] = b"EIGHT_BOX_STATE_SEED";
pub const HOUR_STATE_SEED: &[u8] = b"HOUR_STATE_SEED";
pub const DAY_STATE_SEED: &[u8] = b"DAY_STATE_SEED";
pub const WEEK_STATE_SEED: &[u8] = b"WEEK_STATE_SEED";

pub const HOUR_RESULT_SEED: &[u8] = b"HOUR_RESULT_SEED";
pub const DAY_RESULT_SEED: &[u8] = b"DAY_RESULT_SEED";
pub const WEEK_RESULT_SEED: &[u8] = b"WEEK_RESULT_SEED";

pub const FRAGMENT_MINTER_SEED: &[u8] = b"FRAGMENT_MINTER_SEED";
pub const NFT_MINTER_SEED: &[u8] = b"NFT_MINTER_SEED";
pub const BUNDLE_MINTER_SEED: &[u8] = b"BUNDLE_MINTER_SEED";

pub const NFT_BUILD_STATE_SEED: &[u8] = b"NFT_BUILD_STATE_SEED";

pub const FEE_RATE_DENOMINATOR: u64 = 10000;
pub const INITIAL_PLATFORM_FEE_RATE: u64 = 1000; // 10%
pub const INITIAL_REF_FEE_RATE: u64 = 1000; // 10%

// in seconds
pub const ONE_HOUR: u64 = 60 * 60;
pub const ONE_DAY: u64 = ONE_HOUR * 24;
pub const ONE_WEEK: u64 = ONE_DAY * 7;
pub const EIGHT_HOUR: u64 = ONE_HOUR * 8;

pub const FRAGMENT_URIS: [&str; 9] = [
    "https://arweave.net/qcZGaJh-HVDnxs5GumIcrPjyXQV3Thgd24jBzCIswR0",
    "https://arweave.net/qcZGaJh-HVDnxs5GumIcrPjyXQV3Thgd24jBzCIswR0",
    "https://arweave.net/qcZGaJh-HVDnxs5GumIcrPjyXQV3Thgd24jBzCIswR0",
    "https://arweave.net/qcZGaJh-HVDnxs5GumIcrPjyXQV3Thgd24jBzCIswR0",
    "https://arweave.net/qcZGaJh-HVDnxs5GumIcrPjyXQV3Thgd24jBzCIswR0",
    "https://arweave.net/qcZGaJh-HVDnxs5GumIcrPjyXQV3Thgd24jBzCIswR0",
    "https://arweave.net/qcZGaJh-HVDnxs5GumIcrPjyXQV3Thgd24jBzCIswR0",
    "https://arweave.net/qcZGaJh-HVDnxs5GumIcrPjyXQV3Thgd24jBzCIswR0",
    "https://arweave.net/qcZGaJh-HVDnxs5GumIcrPjyXQV3Thgd24jBzCIswR0",
];

pub const BUNDLE_URIS: [&str; 6] = [
    "https://arweave.net/qcZGaJh-HVDnxs5GumIcrPjyXQV3Thgd24jBzCIswR0",
    "https://arweave.net/qcZGaJh-HVDnxs5GumIcrPjyXQV3Thgd24jBzCIswR0",
    "https://arweave.net/qcZGaJh-HVDnxs5GumIcrPjyXQV3Thgd24jBzCIswR0",
    "https://arweave.net/qcZGaJh-HVDnxs5GumIcrPjyXQV3Thgd24jBzCIswR0",
    "https://arweave.net/qcZGaJh-HVDnxs5GumIcrPjyXQV3Thgd24jBzCIswR0",
    "https://arweave.net/qcZGaJh-HVDnxs5GumIcrPjyXQV3Thgd24jBzCIswR0",
];

pub const FRAGMENT_NAMES: [&str; 9] = [
    "FRAGMENT 1",
    "FRAGMENT 2",
    "FRAGMENT 3",
    "FRAGMENT 4",
    "FRAGMENT 5",
    "FRAGMENT 6",
    "FRAGMENT 7",
    "FRAGMENT 8",
    "FRAGMENT 9",
];

pub const BUNDLE_NAMES: [&str; 6] = [
    "BUNDLE 1", "BUNDLE 2", "BUNDLE 3", "BUNDLE 4", "BUNDLE 5", "BUNDLE 6",
];

pub const FRAGMENT_SYMBOL: &str = "FRG";
pub const BUNDLE_SYMBOL: &str = "BDL";

pub const NFT_SYMBOL: &str = "FEL";
pub const NFT_NAME: &str = "FEEL Main NFT";
pub const NFT_URI: &str = "https://arweave.net/qcZGaJh-HVDnxs5GumIcrPjyXQV3Thgd24jBzCIswR0";

pub enum ArenaStatus {
    Opened,
    Started,
    EndRatioBelow,
    EndSuccess,
    Cancelled,
}

pub const EIGHT_BOX_LIMITS: [u64; 4] = [20_000_000, 100_000_000, 400_000_000, 1000_000_000];
// pub const BUNDLE_REPARTITION_RATE: [u64][u64] = [
//     [20, 20, 20, 20, 4.8, 4.8, 4.8, 0.8]
// ]

pub const BUNDLE_FRAGMENT_RATE: [[u32; 9]; 6] = [
    [2250, 4500, 6750, 9000, 9330, 9660, 9900, 9950, 10000],
    [2250, 4500, 6750, 9000, 9330, 9660, 9900, 9950, 10000],
    [1500, 3000, 4500, 6000, 7300, 8600, 9900, 9950, 10000],
    [1500, 3000, 4500, 6000, 7300, 8600, 9900, 9950, 10000],
    [800, 1600, 2400, 3200, 5300, 7400, 9500, 9750, 10000],
    [800, 1600, 2400, 3200, 5300, 7400, 9500, 9750, 10000],
];
pub const RATE_DEVIDER: u64 = 10001;

pub const BUNDLE_REWARD_COUNT: [u8; 6] = [2, 5, 2, 5, 2, 5];

pub const BUNDLE_COST: [u64; 6] = [
  4000, 8000, 15000, 30000, 40000, 80000
];
pub const NFT_COST: u64 = 1500000;

pub const BURNRATE_TOBUY_BUNDLE: u64 = 20;