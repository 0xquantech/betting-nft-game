import {
  PublicKey,
  Keypair,
  Transaction,
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
import { delay, sendOrSimulateTransaction, getHashArr, getAssocTokenAcct, getPassedHours, getPassedDays, getPassedWeeks } from "./utils";

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

export const openArena = async (accts: BettingAccounts, admin: User, arenaId: number) => {
  await sendOrSimulateTransaction(await program.methods
    .openArena(new BN(arenaId))
    .accounts({
      authority: admin.publicKey,
      globalState: await keys.getGlobalStateKey(),
      arenaState: await keys.getArenaStateKey(arenaId),
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
  const treasuryAta = await getAssociatedTokenAddress(accts.bettingMint, 
    new PublicKey(Constants.TREASURY));
  await sendOrSimulateTransaction(await program.methods
    .endArena(new BN(arenaId))
    .accounts({
      authority: admin.publicKey,
      globalState: await keys.getGlobalStateKey(),
      arenaState: await keys.getArenaStateKey(arenaId),
      pythAccount: accts.pythAccount,
      treasury: Constants.TREASURY,
      treasuryAta,
      escrowAta: accts.escrowAta,
      tokenMint: accts.bettingMint,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
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
  refKey: PublicKey,
  arenaId: number,
  betAmount: number,
  betSide: boolean
) => {
  const amountInDecimal = new BN(betAmount).mul(
    new BN(Math.pow(10, Constants.USDC_DECIMALS))
  );
  const hash_str = crypto.createHash('sha256').update(
    user.publicKey.toBase58() + 
    refKey.toBase58() + 
    'R3fareur'
  ).digest('hex');
  let hash_arr = getHashArr(hash_str);

  const transaction = new Transaction();
  let userStateAcc = await program.account.userState.fetchNullable(
    user.userStateKey
  );
  if (userStateAcc === null) {
    transaction.add(
      await createUserStateInstruction(
        user,
        user.publicKey,
        user.userStateKey
      )
    );
  }
  
  let dateNow = Date.now();
  let hour = getPassedHours(dateNow);
  let day = getPassedDays(dateNow);
  let week = getPassedWeeks(dateNow);

  let hourStateKey = await keys.getUserHourStateKey(user.publicKey, hour);
  let dayStateKey = await keys.getUserDayStateKey(user.publicKey, day);
  let weekStateKey = await keys.getUserWeekStateKey(user.publicKey, week);
  if (!(await fetchHourState(hourStateKey))) {
    transaction.add(program.methods
      .initHourState(user.publicKey, hour)
      .accounts({
        payer: user.publicKey,
        userHourState: hourStateKey,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY
      })
      .instruction()
    )
  }
  if (!(await fetchDayState(dayStateKey))) {
    transaction.add(program.methods
      .initDayState(user.publicKey, day)
      .accounts({
        payer: user.publicKey,
        userDayState: dayStateKey,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY
      })
      .instruction()
    )
  }
  if (!(await fetchWeekState(weekStateKey))) {
    transaction.add(program.methods
      .initWeekState(user.publicKey, week)
      .accounts({
        payer: user.publicKey,
        userWeekState: weekStateKey,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY
      })
      .instruction()
    )
  }
  transaction.add(await program.methods
    .userBet(new BN(arenaId), amountInDecimal, hour, day, week, betSide ? 1 : 0, refKey, hash_arr)
    .accounts({
      user: user.publicKey,
      globalState: await keys.getGlobalStateKey(),
      arenaState: await keys.getArenaStateKey(arenaId),
      userState: user.userStateKey,
      userBetState: await keys.getUserBetStateKey(arenaId, user.publicKey),
      userHourState: hourStateKey,
      userDayState: dayStateKey,
      userWeekState: weekStateKey,
      userAta: user.bettingMintAta,
      escrowAta: accts.escrowAta,
      tokenMint: accts.bettingMint,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    }));
  await sendOrSimulateTransaction(
    transaction,
    [user.keypair],
    connection
  );
};
export const createUserStateInstruction = async (
  payer: User,
  userKey: PublicKey,
  userStateKey: PublicKey
) => {
  return await program.methods
    .initUserState(userKey)
    .accounts({
      payer: payer.publicKey,
      userState: userStateKey,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .instruction();
};
export const claimReward = async (
  accts: BettingAccounts, 
  user: User, 
  refUser: User,
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
  
  const refUserVaultAta = getAssocTokenAcct(
    refUser.userStateKey,
    accts.bettingMint,
  )[0];

  const instructions: TransactionInstruction[] = [];
  let refUserStateAcc = await program.account.userState.fetchNullable(
    refUser.userStateKey
  );
  if (refUserStateAcc === null) {
    instructions.push(
      await createUserStateInstruction(
        user,
        refUser.publicKey,
        refUser.userStateKey
      )
    );
  }

  await sendOrSimulateTransaction(await program.methods
    .claimReward(new BN(arenaId))
    .accounts({
      user: user.publicKey,
      globalState: await keys.getGlobalStateKey(),
      arenaState: await keys.getArenaStateKey(arenaId),
      userBetState: await keys.getUserBetStateKey(arenaId, user.publicKey),
      userAta: user.bettingMintAta,
      escrowAta: accts.escrowAta,
      userState: user.userStateKey,
      refUserState: refUser.userStateKey,
      refUserVaultAta,
      tokenMint: accts.bettingMint,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .signers([user.keypair])
    .preInstructions(instructions)
    .transaction(),
    [user.keypair],
    connection,
    true
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

export const fetchHourState = async (
  key: PublicKey
): Promise<IdlAccounts<Betting>["hourState"] | null> => {
  return await fetchData("hourState", key);
};

export const fetchDayState = async (
  key: PublicKey
): Promise<IdlAccounts<Betting>["dayState"] | null> => {
  return await fetchData("hourState", key);
};

export const fetchWeekState = async (
  key: PublicKey
): Promise<IdlAccounts<Betting>["weekState"] | null> => {
  return await fetchData("hourState", key);
};


