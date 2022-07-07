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

import bs58 from 'bs58';
import crypto from 'crypto';
import * as anchor from "@project-serum/anchor";
import { IdlAccounts } from "@project-serum/anchor";
import BN from 'bn.js';
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
  const globalStateKey = await keys.getGlobalStateKey();
  const feelVaultAta = await getAssociatedTokenAddress(
    accts.rankMint,
    globalStateKey,
    true
  );
  await sendOrSimulateTransaction(await program.methods
    .initialize(admin.publicKey)
    .accounts({
      authority: admin.publicKey,
      globalState: globalStateKey,
      escrowAta: accts.escrowAta,
      feelVaultAta,
      tokenMint: accts.bettingMint,
      rankMint: accts.rankMint,
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
    connection
  );
};

export const cancelArena = async (accts: BettingAccounts, admin: User, arenaId: number) => {
  await sendOrSimulateTransaction(await program.methods
    .cancelArena(new BN(arenaId))
    .accounts({
      authority: admin.publicKey,
      globalState: await keys.getGlobalStateKey(),
      arenaState: await keys.getArenaStateKey(arenaId),
      pythAccount: accts.pythAccount
    })
    .signers([admin.keypair])
    .transaction(),
    [admin.keypair],
    connection
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
    connection
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
    transaction.add(await program.methods
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
    transaction.add(await program.methods
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
    transaction.add(await program.methods
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
    })
    .instruction());
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


export const claimRefReward = async (
  accts: BettingAccounts, 
  user: User
) => {
  const userVaultAta = getAssocTokenAcct(
    user.userStateKey,
    accts.bettingMint,
  )[0];

  const instructions: TransactionInstruction[] = [];

  await sendOrSimulateTransaction(await program.methods
    .claimReferralReward()
    .accounts({
      user: user.publicKey,
      globalState: await keys.getGlobalStateKey(),
      userAta: user.bettingMintAta,
      userState: user.userStateKey,
      userVaultAta,
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
    connection
  );
};

export const returnBet = async (
  accts: BettingAccounts, 
  user: User,
  arenaId: number,
) => {
  const userVaultAta = getAssocTokenAcct(
    user.userStateKey,
    accts.bettingMint,
  )[0];

  const instructions: TransactionInstruction[] = [];

  await sendOrSimulateTransaction(await program.methods
    .returnBet(new BN(arenaId))
    .accounts({
      user: user.publicKey,
      globalState: accts.globalStateKey,
      arenaState: await keys.getArenaStateKey(arenaId),
      userBetState: await keys.getUserBetStateKey(arenaId, user.publicKey),
      userAta: user.bettingMintAta,
      escrowAta: accts.escrowAta,
      tokenMint: accts.bettingMint,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .signers([user.keypair])
    .preInstructions(instructions)
    .transaction(),
    [user.keypair],
    connection
  );
};


export const endHour = async (accts: BettingAccounts, admin: User) => {
  let hour = getPassedHours(Date.now());
  let hour_sec = hour.mul(new BN(Constants.ONE_HOUR_SEC));
  let hourStateAccounts = await program.account.hourState.all([{
    memcmp: {
      offset: 40,
      bytes: bs58.encode(hour_sec.toArrayLike(Array, "le", 8))
    }
  }]);
  hourStateAccounts.sort((a, b) => b.account.betAmount.cmp(a.account.betAmount));
  //let hourStateAccounts = await program.account.hourState.all();
  console.log("hourStateAccounts =", hourStateAccounts.map(acc => acc.account.betAmount.toString()));
  let tiers = [];
  let tier_dist = [1, 2, 3, 5, 10];
  let distIdx = 0;
  let rewardPerTier = [428, 749, 535, 107, 42];
  let winners = 10;
  let winner_cnt = 0;

  if (hourStateAccounts.length > 0) {
    for (let acc of hourStateAccounts) {
      winner_cnt ++;
      if (winner_cnt == tier_dist[distIdx]) {
        distIdx ++;
        tiers.push(acc.account.betAmount);
      }
      if (winner_cnt == winners) break;
    }
    if (hourStateAccounts.length < winners) {
      while (distIdx ++ < tier_dist.length) {
        tiers.push(hourStateAccounts[hourStateAccounts.length - 1].account.betAmount);
      }
    }
  }
  console.log("tiers =", tiers.map(v => v.toString()));

  await sendOrSimulateTransaction(await program.methods
    .endHour(hour, tiers.map((v) => new BN(v)), rewardPerTier.map(v => new BN(v)))
    .accounts({
      authority: admin.publicKey,
      globalState: await keys.getGlobalStateKey(),
      hourResult: await keys.getHourResultKey(hour),
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .signers([admin.keypair])
    .transaction(),
    [admin.keypair],
    connection
  );
};


export const endDay = async (accts: BettingAccounts, admin: User) => {
  let day = getPassedDays(Date.now());
  let day_sec = day.mul(new BN(Constants.ONE_DAY_SEC));
  let dayStateAccounts = await program.account.dayState.all([{
    memcmp: {
      offset: 40,
      bytes: bs58.encode(day_sec.toArrayLike(Array, "le", 8))
    }
  }]);
  dayStateAccounts.sort((a, b) => b.account.betAmount.cmp(a.account.betAmount));
  console.log("dayStateAccounts =", dayStateAccounts.map(acc => acc.account.betAmount.toString()));
  let tiers = [];
  let tier_dist = [1, 2, 3, 5, 10, 25, 50];
  let distIdx = 0;
  let rewardPerTier = [10273, 15410, 10273, 2568, 1027, 171, 102];
  let winners = 50;
  let winner_cnt = 0;
  
  if (dayStateAccounts.length > 0) {
    for (let acc of dayStateAccounts) {
      winner_cnt ++;
      if (winner_cnt == tier_dist[distIdx]) {
        distIdx ++;
        tiers.push(acc.account.betAmount);
      }
      if (winner_cnt == winners) break;
    }
    if (dayStateAccounts.length < winners) {
      while (distIdx ++ < tier_dist.length) {
        tiers.push(dayStateAccounts[dayStateAccounts.length - 1].account.betAmount);
      }
    }
  }
  console.log("tiers =", tiers.map(v => v.toString()));

  await sendOrSimulateTransaction(await program.methods
    .endDay(day, tiers.map((v) => new BN(v)), rewardPerTier.map(v => new BN(v)))
    .accounts({
      authority: admin.publicKey,
      globalState: await keys.getGlobalStateKey(),
      dayResult: await keys.getDayResultKey(day),
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .signers([admin.keypair])
    .transaction(),
    [admin.keypair],
    connection
  );
};


export const endWeek = async (accts: BettingAccounts, admin: User) => {
  let week = getPassedWeeks(Date.now());
  let week_sec = week.mul(new BN(Constants.ONE_WEEK_SEC));
  let weekStateAccounts = await program.account.weekState.all([{
    memcmp: {
      offset: 40,
      bytes: bs58.encode(week_sec.toArrayLike(Array, "le", 8))
    }
  }]);

  //let weekStateAccounts = await program.account.weekState.all();

  weekStateAccounts.sort((a, b) => b.account.betAmount.cmp(a.account.betAmount));
  console.log("weekStateAccounts betAmount =", weekStateAccounts.map(acc => acc.account.betAmount.toString()));
  console.log("weekStateAccounts startTime =", weekStateAccounts.map(acc => acc.account.startTime.toString()));
  let tiers = [];
  let tier_dist = [1, 2, 3, 5, 10, 25, 50, 100, 250];
  let distIdx = 0;
  let rewardPerTier = [32363, 43150, 21575, 10787, 4315, 1438, 863, 431, 107];
  let winners = 250;
  let winner_cnt = 0;

  if (weekStateAccounts.length > 0) {
    for (let acc of weekStateAccounts) {
      winner_cnt ++;
      if (winner_cnt == tier_dist[distIdx]) {
        distIdx ++;
        tiers.push(acc.account.betAmount);
      }
      if (winner_cnt == winners) break;
    }
    if (weekStateAccounts.length < winners) {
      while (distIdx ++ < tier_dist.length) {
        tiers.push(weekStateAccounts[weekStateAccounts.length - 1].account.betAmount);
      }
    }
  }

  console.log("tiers =", tiers.map(v => v.toString()));

  await sendOrSimulateTransaction(await program.methods
    .endWeek(week, tiers.map((v) => new BN(v)), rewardPerTier.map(v => new BN(v)))
    .accounts({
      authority: admin.publicKey,
      globalState: await keys.getGlobalStateKey(),
      weekResult: await keys.getWeekResultKey(week),
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .signers([admin.keypair])
    .transaction(),
    [admin.keypair],
    connection
  );
};


export const claimHourRankReward = async (
  accts: BettingAccounts, 
  user: User,
) => {
  let hour = getPassedHours(Date.now());
  
  const globalStateKey = await keys.getGlobalStateKey();
  
  const feelVaultAta = await getAssociatedTokenAddress(
    accts.rankMint,
    globalStateKey,
    true
  );

  const userFeelAta = await getAssociatedTokenAddress(
    accts.rankMint,
    user.publicKey
  );
  
  let hourStateKey = await keys.getUserHourStateKey(user.publicKey, hour);
  await sendOrSimulateTransaction(await program.methods
    .claimHourRankReward(hour)
    .accounts({
      user: user.publicKey,
      globalState: globalStateKey,
      feelVaultAta,
      userHourState: hourStateKey,
      hourResult: await keys.getHourResultKey(hour),
      userFeelAta,
      rankMint: accts.rankMint,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .signers([user.keypair])
    .transaction(),
    [user.keypair],
    connection
  );
};


export const claimDayRankReward = async (
  accts: BettingAccounts, 
  user: User,
) => {
  let day = getPassedDays(Date.now());
  
  const globalStateKey = await keys.getGlobalStateKey();
  
  const feelVaultAta = await getAssociatedTokenAddress(
    accts.rankMint,
    globalStateKey,
    true
  );

  const userFeelAta = await getAssociatedTokenAddress(
    accts.rankMint,
    user.publicKey
  );
  
  let dayStateKey = await keys.getUserDayStateKey(user.publicKey, day);
  await sendOrSimulateTransaction(await program.methods
    .claimDayRankReward(day)
    .accounts({
      user: user.publicKey,
      globalState: globalStateKey,
      feelVaultAta,
      userDayState: dayStateKey,
      dayResult: await keys.getDayResultKey(day),
      userFeelAta,
      rankMint: accts.rankMint,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .signers([user.keypair])
    .transaction(),
    [user.keypair],
    connection
  );
};


export const claimWeekRankReward = async (
  accts: BettingAccounts, 
  user: User,
) => {
  let week = getPassedWeeks(Date.now());
  
  const globalStateKey = await keys.getGlobalStateKey();
  
  const feelVaultAta = await getAssociatedTokenAddress(
    accts.rankMint,
    globalStateKey,
    true
  );

  const userFeelAta = await getAssociatedTokenAddress(
    accts.rankMint,
    user.publicKey
  );
  
  let weekStateKey = await keys.getUserWeekStateKey(user.publicKey, week);
  await sendOrSimulateTransaction(await program.methods
    .claimWeekRankReward(week)
    .accounts({
      user: user.publicKey,
      globalState: globalStateKey,
      feelVaultAta,
      userWeekState: weekStateKey,
      weekResult: await keys.getWeekResultKey(week),
      userFeelAta,
      rankMint: accts.rankMint,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .signers([user.keypair])
    .transaction(),
    [user.keypair],
    connection
  );
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
  return await fetchData("dayState", key);
};

export const fetchWeekState = async (
  key: PublicKey
): Promise<IdlAccounts<Betting>["weekState"] | null> => {
  return await fetchData("weekState", key);
};


