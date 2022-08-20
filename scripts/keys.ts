import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import {
  GLOBAL_STATE_SEED,
  USER_STATE_SEED,
  ARENA_STATE_SEED,
  USER_BET_SEED,
  HOUR_STATE_SEED,
  DAY_STATE_SEED,
  WEEK_STATE_SEED,
  HOUR_RESULT_SEED,
  DAY_RESULT_SEED,
  WEEK_RESULT_SEED,
  BUNDLE_MINTER_SEED,
  NFT_BUILD_STATE_SEED,
  EIGHT_BOX_STATE_SEED,
  NFT_MINTER_SEED,
  METADATA_PROGRAM_ID,
  PROGRAM_ID
} from "./constants";

export const getGlobalStateKey = async () => {
  const [globalStateKey] = await PublicKey.findProgramAddress(
    [Buffer.from(GLOBAL_STATE_SEED)],
    PROGRAM_ID
  );
  return globalStateKey;
};

export const getUserStateKey = async (userKey: PublicKey) => {
  const [userStateKey] = await PublicKey.findProgramAddress(
    [Buffer.from(USER_STATE_SEED), userKey.toBuffer()],
    PROGRAM_ID
  );
  return userStateKey;
};

export const getArenaStateKey = async (arenaId: number) => {
  let id = new BN(arenaId);
  const [arenaStateKey] = await PublicKey.findProgramAddress(
    [Buffer.from(ARENA_STATE_SEED), id.toArrayLike(Buffer, "le", 8)],
    PROGRAM_ID
  );
  return arenaStateKey;
};

export const getUserBetStateKey = async (arenaId: number, userKey: PublicKey) => {
  let id = new BN(arenaId);
  const [userBetStateKey] = await PublicKey.findProgramAddress(
    [Buffer.from(USER_BET_SEED), userKey.toBuffer(), id.toArrayLike(Buffer, "le", 8)],
    PROGRAM_ID
  );
  return userBetStateKey;
};


export const getUserHourStateKey = async (userKey: PublicKey, hour: BN) => {
  const [key] = await PublicKey.findProgramAddress(
    [Buffer.from(HOUR_STATE_SEED), userKey.toBuffer(), hour.toArrayLike(Buffer, "le", 8)],
    PROGRAM_ID
  );
  return key;
};

export const getUserDayStateKey = async (userKey: PublicKey, day: BN) => {
  const [key] = await PublicKey.findProgramAddress(
    [Buffer.from(DAY_STATE_SEED), userKey.toBuffer(), day.toArrayLike(Buffer, "le", 8)],
    PROGRAM_ID
  );
  return key;
};

export const getUserWeekStateKey = async (userKey: PublicKey, week: BN) => {
  const [key] = await PublicKey.findProgramAddress(
    [Buffer.from(WEEK_STATE_SEED), userKey.toBuffer(), week.toArrayLike(Buffer, "le", 8)],
    PROGRAM_ID
  );
  return key;
};


export const getUserNftBuildStateKey = async (userKey: PublicKey) => {
  const [key] = await PublicKey.findProgramAddress(
    [Buffer.from(NFT_BUILD_STATE_SEED), userKey.toBuffer()],
    PROGRAM_ID
  );
  return key;
};


export const getEightBoxStateKey = async (userKey: PublicKey, box_id: BN) => {
  const [key] = await PublicKey.findProgramAddress(
    [Buffer.from(EIGHT_BOX_STATE_SEED), userKey.toBuffer(), box_id.toArrayLike(Buffer, "le", 8)],
    PROGRAM_ID
  );
  return key;
};

export const getHourResultKey = async (hour: BN) => {
  const [key] = await PublicKey.findProgramAddress(
    [Buffer.from(HOUR_RESULT_SEED), hour.toArrayLike(Buffer, "le", 8)],
    PROGRAM_ID
  );
  return key;
};

export const getDayResultKey = async (day: BN) => {
  const [key] = await PublicKey.findProgramAddress(
    [Buffer.from(DAY_RESULT_SEED), new BN(day).toArrayLike(Buffer, "le", 8)],
    PROGRAM_ID
  );
  return key;
};

export const getWeekResultKey = async (week: BN) => {
  const [key] = await PublicKey.findProgramAddress(
    [Buffer.from(WEEK_RESULT_SEED), new BN(week).toArrayLike(Buffer, "le", 8)],
    PROGRAM_ID
  );
  return key;
};


export const getFragmentMintKey = async (fragment_no: number) => {
  const [key] = await PublicKey.findProgramAddress(
    [Buffer.from("FRAGMENT" + fragment_no)],
    PROGRAM_ID
  );
  return key;
};


export const getBundleMinterKey = async () => {
  const [key] = await PublicKey.findProgramAddress(
    [Buffer.from(BUNDLE_MINTER_SEED)],
    PROGRAM_ID
  );
  return key;
};

export const getNftMinterKey = async () => {
  const [key] = await PublicKey.findProgramAddress(
    [Buffer.from(NFT_MINTER_SEED)],
    PROGRAM_ID
  );
  return key;
};

export async function getMetadataKey(
  tokenMint: PublicKey
): Promise<PublicKey> {
  return (
    await PublicKey.findProgramAddress(
      [
        Buffer.from("metadata"),
        new PublicKey(METADATA_PROGRAM_ID).toBuffer(),
        tokenMint.toBuffer(),
      ],
      new PublicKey(METADATA_PROGRAM_ID)
    )
  )[0];
}

export async function getEditionKey(
  tokenMint: PublicKey
): Promise<PublicKey> {
  return (await PublicKey.findProgramAddress(
    [
      Buffer.from("metadata"),
      new PublicKey(METADATA_PROGRAM_ID).toBuffer(),
      new PublicKey(tokenMint).toBuffer(),
      Buffer.from("edition"),
    ],
    new PublicKey(METADATA_PROGRAM_ID)
  ))[0];
}