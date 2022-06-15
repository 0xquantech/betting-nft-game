import { PublicKey } from "@solana/web3.js";
import { BN } from "bn.js";
import {
  GLOBAL_STATE_SEED,
  USER_STATE_SEED,
  ARENA_STATE_SEED,
  USER_BET_SEED,
  PROGRAM_ID
} from "./constants";

export const getGlobalStateKey = async () => {
  const [globalStateKey] = await PublicKey.findProgramAddress(
    [Buffer.from(GLOBAL_STATE_SEED)],
    new PublicKey(PROGRAM_ID)
  );
  return globalStateKey;
};

export const getUserStateKey = async (userKey: PublicKey) => {
  const [userStateKey] = await PublicKey.findProgramAddress(
    [Buffer.from(USER_STATE_SEED), userKey.toBuffer()],
    new PublicKey(PROGRAM_ID)
  );
  return userStateKey;
};

export const getArenaStateKey = async (arenaId: number) => {
  let id = new BN(arenaId);

  const [arenaStateKey] = await PublicKey.findProgramAddress(
    [Buffer.from(ARENA_STATE_SEED), id.toArrayLike(Buffer, "le", 8)],
    new PublicKey(PROGRAM_ID)
  );
  return arenaStateKey;
};

export const getUserBetStateKey = async (arenaId: number, userKey: PublicKey) => {
  let id = new BN(arenaId);
  const [userBetStateKey] = await PublicKey.findProgramAddress(
    [Buffer.from(USER_BET_SEED), userKey.toBuffer(), id.toArrayLike(Buffer, "le", 8)],
    new PublicKey(PROGRAM_ID)
  );
  return userBetStateKey;
};
