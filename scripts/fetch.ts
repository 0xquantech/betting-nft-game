import {
  PublicKey
} from "@solana/web3.js";
import { BN, IdlAccounts } from "@project-serum/anchor";
import { Betting } from "../target/types/betting";

export const fetchData = async (program: any, type: string, key: PublicKey) => {
  return await program.account[type].fetchNullable(key);
};

export const fetchGlobalState = async (
  program: any,
  key: PublicKey
): Promise<IdlAccounts<Betting>["globalState"] | null> => {
  return await fetchData(program, "globalState", key);
};

export const fetchArenaState = async (
  program: any,
  key: PublicKey
): Promise<IdlAccounts<Betting>["arenaState"] | null> => {
  return await fetchData(program, "arenaState", key);
};

export const fetchUserBetState = async (
  program: any,
  key: PublicKey
): Promise<IdlAccounts<Betting>["userBetState"] | null> => {
  return await fetchData(program, "userBetState", key);
};

export const fetchUserState = async (
  program: any,
  key: PublicKey
): Promise<IdlAccounts<Betting>["userState"] | null> => {
  return await fetchData(program, "userState", key);
};

