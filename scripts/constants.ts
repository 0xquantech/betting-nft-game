import { PublicKey } from "@solana/web3.js";

export const GLOBAL_STATE_SEED = "GLOBAL_STATE_SEED";
export const USER_STATE_SEED = "USER_STATE_SEED";
export const ARENA_STATE_SEED = "ARENA_STATE_SEED";
export const USER_BET_SEED = "USER_BET_SEED";

export const HOUR_STATE_SEED = "HOUR_STATE_SEED";
export const DAY_STATE_SEED = "DAY_STATE_SEED";
export const WEEK_STATE_SEED = "WEEK_STATE_SEED";

export const HOUR_RESULT_SEED = "HOUR_RESULT_SEED";
export const DAY_RESULT_SEED = "DAY_RESULT_SEED";
export const WEEK_RESULT_SEED = "WEEK_RESULT_SEED";

export const FRAGMENT_MINTER_SEED = "FRAGMENT_MINTER_SEED";
export const NFT_MINTER_SEED = "NFT_MINTER_SEED";
export const BUNDLE_MINTER_SEED = "BUNDLE_MINTER_SEED";
export const NFT_BUILD_STATE_SEED = "NFT_BUILD_STATE_SEED";
export const EIGHT_BOX_STATE_SEED = "EIGHT_BOX_STATE_SEED";

export const ONE_HOUR_MS = 1000 * 60 * 60;
export const ONE_DAY_MS = ONE_HOUR_MS * 24;
export const ONE_WEEK_MS = ONE_DAY_MS * 7;

export const ONE_HOUR_SEC = 60 * 60;
export const ONE_DAY_SEC = ONE_HOUR_SEC * 24;
export const ONE_WEEK_SEC = ONE_DAY_SEC * 7;

export const USDC_DECIMALS = 6;
export const FEEL_DECIMALS = 6;

export const DEVNET_MODE = true;
export const TREASURY = "5de42qodN5hDg2yYWVzFcHsVzv2dNGLt29QymSeY1Pzn";

export const PROGRAM_ID = new PublicKey("F9cCsF2K73VcydesyJnk2GNA6igt82Roo4CQDkkk7dN");
export const METADATA_PROGRAM_ID = "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s";

export const USDC_MINT = DEVNET_MODE ? "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr":
                                      "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
                                      
export const SOL_PYTH_ACCOUNT = DEVNET_MODE ? "J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix" :
        "H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG";
export const BTC_PYTH_ACCOUNT = DEVNET_MODE ? "HovQMDrbAgAYPCmHVSrezcSmkMtXSSUsLDFANExrZh2J" :
        "GVXRSBjFk6e6J3NbVPXohDJetcTjaeeuykUpbQF8UoMU";
export const ETH_PYTH_ACCOUNT = DEVNET_MODE ? "EdVCmQ9FSPcVe5YySXDPCRmc8aDQLKJ9xvYBMZPie1Vw" :
        "JBu1AL4obBcCMqKBBxhpWCNUt136ijcuMZLFvTP7iWdB";
export const AVAX_PYTH_ACCOUNT = DEVNET_MODE ? "FVb5h1VmHPfVb1RfqZckchq18GxRv4iKt8T4eVTQAqdz" :
        "Ax9ujW5B9oqcv59N8m6f1BpTBq2rGeGaBcpKjC5UYsXU";
export const ADA_PYTH_ACCOUNT = DEVNET_MODE ? "8oGTURNmSQkrBS1AQ5NjB2p8qY34UVmMA9ojrw8vnHus" :
        "3pyn4svBbxJ9Wnn3RVeafyLWfzie6yC5eTig2S62v9SC";


export const FEEL_MINT = "CPwGEKnbHuYAaA2SanjCesAzqCnYnzF1yxY9BgYsLqid";