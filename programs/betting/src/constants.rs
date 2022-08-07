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
pub const BUNDLE_OPEN_FEE: [u64; 6] = [1250, 2500, 5000, 10000, 17500, 25000];
// pub const BUNDLE_REPARTITION_RATE: [u64][u64] = [
//     [20, 20, 20, 20, 4.8, 4.8, 4.8, 0.8]
// ]

pub const BUNDLE_FRAGMENT_RATE: [[u32; 9]; 6] = [
    [200, 400, 600, 800, 848, 896, 944, 992, 1000],
    [200, 400, 600, 800, 848, 896, 944, 992, 1000],
    [48, 96, 144, 192, 392, 592, 792, 992, 1000],
    [200, 400, 600, 800, 848, 896, 944, 992, 1000],
    [48, 96, 144, 192, 392, 592, 792, 992, 1000],
    [110, 220, 330, 440, 550, 660, 770, 880, 1000],
];

pub const BUNDLE_REWARD_COUNT: [u8; 6] = [1, 3, 3, 5, 5, 2];

pub const BUNDLE_COST: [u64; 6] = [
    1250, 2500, 5000, 10000, 17500, 25000
];
pub const BURNRATE_TOBUY_BUNDLE: u64 = 20;