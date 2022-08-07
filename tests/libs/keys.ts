import { PublicKey } from "@solana/web3.js";
import { BN } from "bn.js";
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
  FRAGMENT_MINTER_SEED,
  NFT_MINTER_SEED,
  BUNDLE_MINTER_SEED,
  EIGHT_BOX_STATE_SEED,
  MetadataProgramId,
  NFT_BUILD_STATE_SEED
} from "./constants";
import { asyncGetPda } from "./utils";
import { getProgram } from "../program";

const program = getProgram();
export const getGlobalStateKey = async () => {
  const [globalStateKey] = await asyncGetPda(
    [Buffer.from(GLOBAL_STATE_SEED)],
    program.programId
  );
  return globalStateKey;
};

export const getUserStateKey = async (userKey: PublicKey) => {
  const [userStateKey] = await asyncGetPda(
    [Buffer.from(USER_STATE_SEED), userKey.toBuffer()],
    program.programId
  );
  return userStateKey;
};

export const getArenaStateKey = async (arenaId: number) => {
  let id = new BN(arenaId);

  const [arenaStateKey] = await asyncGetPda(
    [Buffer.from(ARENA_STATE_SEED), id.toArrayLike(Buffer, "le", 8)],
    program.programId
  );
  return arenaStateKey;
};

export const getUserBetStateKey = async (arenaId: number, userKey: PublicKey) => {
  let id = new BN(arenaId);
  const [userBetStateKey] = await asyncGetPda(
    [Buffer.from(USER_BET_SEED), userKey.toBuffer(), id.toArrayLike(Buffer, "le", 8)],
    program.programId
  );
  return userBetStateKey;
};

export const getUserHourStateKey = async (userKey: PublicKey, hour: BN) => {
  const [key] = await asyncGetPda(
    [Buffer.from(HOUR_STATE_SEED), userKey.toBuffer(), hour.toArrayLike(Buffer, "le", 8)],
    program.programId
  );
  return key;
};

export const getUserDayStateKey = async (userKey: PublicKey, day: BN) => {
  const [key] = await asyncGetPda(
    [Buffer.from(DAY_STATE_SEED), userKey.toBuffer(), day.toArrayLike(Buffer, "le", 8)],
    program.programId
  );
  return key;
};

export const getUserWeekStateKey = async (userKey: PublicKey, week: BN) => {
  const [key] = await asyncGetPda(
    [Buffer.from(WEEK_STATE_SEED), userKey.toBuffer(), week.toArrayLike(Buffer, "le", 8)],
    program.programId
  );
  return key;
};

export const getUserNftBuildStateKey = async (userKey: PublicKey) => {
  const [key] = await asyncGetPda(
    [Buffer.from(NFT_BUILD_STATE_SEED), userKey.toBuffer()],
    program.programId
  );
  return key;
};


export const getEightBoxStateKey = async (userKey: PublicKey, box_id: BN) => {
  const [key] = await asyncGetPda(
    [Buffer.from(EIGHT_BOX_STATE_SEED), userKey.toBuffer(), box_id.toArrayLike(Buffer, "le", 8)],
    program.programId
  );
  return key;
};


export const getHourResultKey = async (hour: BN) => {
  const [key] = await asyncGetPda(
    [Buffer.from(HOUR_RESULT_SEED), hour.toArrayLike(Buffer, "le", 8)],
    program.programId
  );
  return key;
};

export const getDayResultKey = async (day: BN) => {
  const [key] = await asyncGetPda(
    [Buffer.from(DAY_RESULT_SEED), new BN(day).toArrayLike(Buffer, "le", 8)],
    program.programId
  );
  return key;
};

export const getWeekResultKey = async (week: BN) => {
  const [key] = await asyncGetPda(
    [Buffer.from(WEEK_RESULT_SEED), new BN(week).toArrayLike(Buffer, "le", 8)],
    program.programId
  );
  return key;
};

export const getFragmentMintKey = async (fragment_no: number) => {
  const [key] = await asyncGetPda(
    [Buffer.from("FRAGMENT" + fragment_no)],
    program.programId
  );
  return key;
};


export const getFragmentMinterKey = async () => {
  const [key] = await asyncGetPda(
    [Buffer.from(FRAGMENT_MINTER_SEED)],
    program.programId
  );
  return key;
};

export const getBundleMinterKey = async () => {
  const [key] = await asyncGetPda(
    [Buffer.from(BUNDLE_MINTER_SEED)],
    program.programId
  );
  return key;
};

export const getNftMinterKey = async () => {
  const [key] = await asyncGetPda(
    [Buffer.from(NFT_MINTER_SEED)],
    program.programId
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
        new PublicKey(MetadataProgramId).toBuffer(),
        tokenMint.toBuffer(),
      ],
      new PublicKey(MetadataProgramId)
    )
  )[0];
}