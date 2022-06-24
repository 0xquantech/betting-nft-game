import { Connection, clusterApiUrl } from "@solana/web3.js";
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

export const ONE_HOUR_MS = 1000 * 60 * 60;
export const ONE_DAY_MS = ONE_HOUR_MS * 24;
export const ONE_WEEK_MS = ONE_DAY_MS * 7;

export const ONE_HOUR_SEC = 60 * 60;
export const ONE_DAY_SEC = ONE_HOUR_SEC * 24;
export const ONE_WEEK_SEC = ONE_DAY_SEC * 7;

export const USDC_DECIMALS = 6;

export const DEVNET_MODE = true;
export const TREASURY = "5de42qodN5hDg2yYWVzFcHsVzv2dNGLt29QymSeY1Pzn";
export const PROGRAM_ID = "CkjLXWUbYttpTxDXvSxy3gwzA7PUfxs2W25F7kR7zE2j";
export const USDC_MINT = DEVNET_MODE ? "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr":
                                      "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
export const SOL_PYTH_ACCOUNT = DEVNET_MODE ? "J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix" :
        "H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG";

export const FEEL_MINT = "8ZnsPYjzPH9i6Emyo3x7ESb6zvxzQPGfVVnANAzQVBNK";