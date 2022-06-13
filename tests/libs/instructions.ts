import {
  PublicKey,
  Keypair,
  TransactionInstruction,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from "@solana/spl-token";

import crypto from 'crypto';
import * as anchor from "@project-serum/anchor";
import { BN, IdlAccounts } from "@project-serum/anchor";
import { Betting } from "../../target/types/betting";
import * as Constants from "./constants";
import * as keys from "./keys";
import { User } from "./user";
import { BettingAccounts } from "./accounts";
import { assert } from "chai";
import { delay, sendOrSimulateTransaction } from "./utils";

const program = anchor.workspace.Betting as anchor.Program<Betting>;
const connection = program.provider.connection;

export const initializeProgram = async (accts: BettingAccounts, admin: User) => {
  await sendOrSimulateTransaction(await program.methods
    .initialize(admin.publicKey)
    .accounts({
      authority: admin.publicKey,
      globalState: await keys.getGlobalStateKey(),
      escrowAta: accts.escrowAta,
      tokenMint: accts.bettingMint,
      treasury: new PublicKey(Constants.TREASURY),
      pythAccount: accts.pythAccount,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .signers([admin.keypair])
    .transaction(),
    [admin.keypair],
    connection
  );
};
export const startArena = async (accts: BettingAccounts, admin: User, arenaId: number) => {
  await sendOrSimulateTransaction(await program.methods
    .startArena(new BN(arenaId))
    .accounts({
      authority: admin.publicKey,
      globalState: await keys.getGlobalStateKey(),
      arenaState: await keys.getArenaStateKey(arenaId),
      pythAccount: accts.pythAccount,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .signers([admin.keypair])
    .transaction(),
    [admin.keypair],
    connection,
    true
  );
};

export const endArena = async (accts: BettingAccounts, admin: User, arenaId: number) => {
  
  await sendOrSimulateTransaction(await program.methods
    .endArena(new BN(arenaId))
    .accounts({
      authority: admin.publicKey,
      globalState: await keys.getGlobalStateKey(),
      arenaState: await keys.getArenaStateKey(arenaId),
      pythAccount: accts.pythAccount,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .signers([admin.keypair])
    .transaction(),
    [admin.keypair],
    connection,
    true
  );
};

export const userBet = async (
  accts: BettingAccounts, 
  user: User, 
  arenaId: number,
  betAmount: number,
  betSide: boolean
) => {
  const amountInDecimal = new BN(betAmount).mul(
    new BN(Math.pow(10, Constants.USDC_DECIMALS))
  );
  await sendOrSimulateTransaction(await program.methods
    .userBet(new BN(arenaId), amountInDecimal, betSide ? 1 : 0)
    .accounts({
      user: user.publicKey,
      globalState: await keys.getGlobalStateKey(),
      arenaState: await keys.getArenaStateKey(arenaId),
      userBetState: await keys.getUserBetStateKey(arenaId, user.publicKey),
      userAta: user.bettingMintAta,
      escrowAta: accts.escrowAta,
      tokenMint: accts.bettingMint,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .signers([user.keypair])
    .transaction(),
    [user.keypair],
    connection
  );
};

export const claimReward = async (
  accts: BettingAccounts, 
  user: User, 
  arenaId: number
) => {
  const prevEscrowAmount = (await program.provider.connection.getTokenAccountBalance(
    accts.escrowAta
  )).value.uiAmount;
  const prevUserAmount = (await program.provider.connection.getTokenAccountBalance(
    user.bettingMintAta
  )).value.uiAmount;
  
  console.log("prevEscrowAmount =", prevEscrowAmount);
  console.log("prevUserAmount =", prevUserAmount);

  await sendOrSimulateTransaction(await program.methods
    .claimReward(new BN(arenaId))
    .accounts({
      user: user.publicKey,
      globalState: await keys.getGlobalStateKey(),
      arenaState: await keys.getArenaStateKey(arenaId),
      userBetState: await keys.getUserBetStateKey(arenaId, user.publicKey),
      userAta: user.bettingMintAta,
      escrowAta: accts.escrowAta,
      tokenMint: accts.bettingMint,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .signers([user.keypair])
    .transaction(),
    [user.keypair],
    connection
  );

  const postEscrowAmount = (await program.provider.connection.getTokenAccountBalance(
    accts.escrowAta
  )).value.uiAmount;
  const postUserAmount = (await program.provider.connection.getTokenAccountBalance(
    user.bettingMintAta
  )).value.uiAmount;

  console.log("postEscrowAmount =", postEscrowAmount);
  console.log("postUserAmount =", postUserAmount);

  console.log("userAmount +", postUserAmount - prevUserAmount);
};


export const fetchData = async (type: string, key: PublicKey) => {
  return await program.account[type].fetchNullable(key);
};

export const fetchGlobalState = async (
  key: PublicKey
): Promise<IdlAccounts<Betting>["globalState"] | null> => {
  return await fetchData("globalState", key);
};

export const fetchArenaState = async (
  key: PublicKey
): Promise<IdlAccounts<Betting>["arenaState"] | null> => {
  return await fetchData("arenaState", key);
};

export const fetchUserBetState = async (
  key: PublicKey
): Promise<IdlAccounts<Betting>["userBetState"] | null> => {
  return await fetchData("userBetState", key);
};
