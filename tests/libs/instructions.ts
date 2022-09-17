import {
  PublicKey,
  AccountMeta,
  Keypair,
  Signer,
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
  createInitializeMintInstruction,
  createInitializeAccountInstruction,
  createAssociatedTokenAccountInstruction,
  MINT_SIZE
} from "@solana/spl-token";

import { Metadata } from '@metaplex-foundation/mpl-token-metadata'
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
import { delay, sendOrSimulateTransaction, getHashArr, getAssocTokenAcct, getPassedHours, getPassedDays, getPassedWeeks, getEightBoxId, getTransactionSize, getAcctInfo } from "./utils";

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
    .initialize(
      admin.publicKey,
      new PublicKey(Constants.BTC_PYTH_ACCOUNT),
      new PublicKey(Constants.ETH_PYTH_ACCOUNT),
      new PublicKey(Constants.SOL_PYTH_ACCOUNT),
      new PublicKey(Constants.AVAX_PYTH_ACCOUNT),
      new PublicKey(Constants.ADA_PYTH_ACCOUNT),
    )
    .accounts({
      authority: admin.publicKey,
      globalState: globalStateKey,
      escrowAta: accts.escrowAta,
      feelVaultAta,
      tokenMint: accts.bettingMint,
      rankMint: accts.rankMint,
      treasury: new PublicKey(Constants.TREASURY),
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


export const createFragmentMints = async (accts: BettingAccounts, admin: User) => {
  const globalStateKey = await keys.getGlobalStateKey();
  const fragmentMintKeys: Array<PublicKey> = [];
  for (let i = 1; i <= 9; i ++) fragmentMintKeys.push(await keys.getFragmentMintKey(i));
  let transaction = new Transaction().add(await program.methods
    .createFragmentMints()
    .accounts({
      authority: admin.publicKey,
      globalState: globalStateKey,
      fragment1Mint: fragmentMintKeys[0],
      fragment2Mint: fragmentMintKeys[1],
      fragment3Mint: fragmentMintKeys[2],
      fragment4Mint: fragmentMintKeys[3],
      fragment5Mint: fragmentMintKeys[4],
      fragment6Mint: fragmentMintKeys[5],
      fragment7Mint: fragmentMintKeys[6],
      fragment8Mint: fragmentMintKeys[7],
      fragment9Mint: fragmentMintKeys[8],
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .signers([admin.keypair])
    .transaction()
  );
  transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  transaction.feePayer = admin.publicKey;
  let val = getTransactionSize(transaction);
  console.log("createFragmentMints txSize =", val);
  sendAndConfirmTransaction(connection, transaction, [admin.keypair]);
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
      solPythAccount: new PublicKey(Constants.SOL_PYTH_ACCOUNT),
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
      solPythAccount: new PublicKey(Constants.SOL_PYTH_ACCOUNT)
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
      solPythAccount: new PublicKey(Constants.SOL_PYTH_ACCOUNT),
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
  let eight_box_id = getEightBoxId(dateNow);

  let hourStateKey = await keys.getUserHourStateKey(user.publicKey, hour);
  let dayStateKey = await keys.getUserDayStateKey(user.publicKey, day);
  let weekStateKey = await keys.getUserWeekStateKey(user.publicKey, week);
  let eightBoxStateKey = await keys.getEightBoxStateKey(user.publicKey, eight_box_id);

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
  if (!(await fetchEightBoxState(eightBoxStateKey))) {
    transaction.add(await program.methods
      .initEightBoxState(user.publicKey, eight_box_id)
      .accounts({
        payer: user.publicKey,
        eightBoxState: eightBoxStateKey,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY
      })
      .instruction()
    )
  }
  transaction.add(await program.methods
    .userBet(
      new BN(arenaId), amountInDecimal, 
      hour, day, week, eight_box_id, 
      betSide ? 1 : 0, refKey, hash_arr
    ).accounts({
      user: user.publicKey,
      globalState: await keys.getGlobalStateKey(),
      arenaState: await keys.getArenaStateKey(arenaId),
      userState: user.userStateKey,
      userBetState: await keys.getUserBetStateKey(arenaId, user.publicKey),
      userHourState: hourStateKey,
      userDayState: dayStateKey,
      userWeekState: weekStateKey,
      eightBoxState: eightBoxStateKey,
      
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
      userState: user.userStateKey,

      userAta: user.bettingMintAta,
      escrowAta: accts.escrowAta,
      
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
  let hourResultKey = await keys.getHourResultKey(hour);

  let rank = await program.methods
    .getHourRank()
    .accounts({
      userHourState: hourStateKey,
      hourResult: hourResultKey,
    }).view();
  console.log("rank =", rank);

  let remainingAccounts: AccountMeta[] = [];
  let transaction = new Transaction();

  let instructions: TransactionInstruction[] = [];
  let signers: Signer[] = [];
  if (rank == 1) {    
    await prepareMintBundle(user, remainingAccounts, instructions, signers, 1);
    transaction.add(...instructions);
  }

  transaction.add(await program.methods
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
      tokenMetadataProgram: new PublicKey(Constants.MetadataProgramId),
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .remainingAccounts([...remainingAccounts])
    .signers([user.keypair])
    .instruction());

  await sendOrSimulateTransaction(
    transaction,
    [user.keypair, ...signers],
    connection,
    false
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
  let dayResultKey = await keys.getDayResultKey(day);

  let rank = await program.methods
    .getDayRank()
    .accounts({
      userDayState: dayStateKey,
      dayResult: dayResultKey,
    }).view();
  console.log("rank =", rank);
  
  let remainingAccounts: AccountMeta[] = [];
  let transaction = new Transaction();
  
  let instructions: TransactionInstruction[] = [];
  let signers: Signer[] = [];
  if (rank == 1) {    
    await prepareMintBundle(user, remainingAccounts, instructions, signers, 1);
    transaction.add(...instructions);
  }

  transaction.add(await program.methods
    .claimDayRankReward(day)
    .accounts({
      user: user.publicKey,
      globalState: globalStateKey,
      feelVaultAta,
      userDayState: dayStateKey,
      dayResult: dayResultKey,
      userFeelAta,
      rankMint: accts.rankMint,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      tokenMetadataProgram: new PublicKey(Constants.MetadataProgramId),
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .remainingAccounts([...remainingAccounts])
    .signers([user.keypair])
    .instruction()
  );
  await sendOrSimulateTransaction(
    transaction,
    [user.keypair, ...signers],
    connection,
    false
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
  let weekResultKey = await keys.getWeekResultKey(week);

  let rank = await program.methods
    .getWeekRank()
    .accounts({
      userWeekState: weekStateKey,
      weekResult: weekResultKey,
    }).view();
  console.log("rank =", rank);

  let transaction = new Transaction();
  let remainingAccounts: AccountMeta[] = [];
  let signers = [];
  let instructions = [];
  if (rank == 1) {
    await prepareMintNft(user, remainingAccounts, instructions, signers);
  } else if (rank == 2 || rank == 3) {
    await prepareMintBundle(user, remainingAccounts, instructions, signers);
  }
  transaction.add(...instructions);

  transaction.add(await program.methods
    .claimWeekRankReward(week)
    .accounts({
      user: user.publicKey,
      globalState: globalStateKey,
      feelVaultAta,
      userWeekState: weekStateKey,
      weekResult: weekResultKey,
      userFeelAta,
      rankMint: accts.rankMint,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      tokenMetadataProgram: new PublicKey(Constants.MetadataProgramId),
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .remainingAccounts([...remainingAccounts])
    .signers([user.keypair])
    .instruction()
  );  
  await sendOrSimulateTransaction(
    transaction,
    [user.keypair, ...signers],
    connection,
    false
  );
};



export const claimEightBoxReward = async (
  accts: BettingAccounts, 
  user: User,
  prize_id: number
) => {
  const globalStateKey = await keys.getGlobalStateKey();
  let eight_box_id = getEightBoxId(Date.now());
  const boxStateKey = await keys.getEightBoxStateKey(user.publicKey, eight_box_id)

  let remainingAccounts: AccountMeta[] = [];
  let instructions = [];
  let signers = [];
  let transaction = new Transaction();
  // prize_id starts from 0
  await prepareMintBundle(user, remainingAccounts, instructions, signers, 1);
  transaction.add(...instructions);
  transaction.add(await program.methods
    .claimEightBox(eight_box_id, prize_id)
    .accounts({
      user: user.publicKey,
      globalState: globalStateKey,
      eightBoxState: boxStateKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      tokenMetadataProgram: new PublicKey(Constants.MetadataProgramId),
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .remainingAccounts([...remainingAccounts])
    .signers([user.keypair])
    .instruction());

  await sendOrSimulateTransaction(
    transaction,
    [user.keypair, ...signers],
    connection,
    false
  );
};

export const burnFragments = async (
  accts: BettingAccounts, 
  user: User,
) => {
  const globalStateKey = await keys.getGlobalStateKey();
  const nftBuildStateKey = await keys.getUserNftBuildStateKey(user.publicKey);

  let transaction = new Transaction();

  let remainingAccounts: AccountMeta[] = [];

  for (let i = 1; i <= 9; i ++) {
    let mint = await keys.getFragmentMintKey(i);
    let fragmentAta = await getAssociatedTokenAddress(
      mint,
      user.publicKey
    );
    remainingAccounts.push({ isSigner: false, isWritable: true, pubkey: mint } as AccountMeta);
    remainingAccounts.push({ isSigner: false, isWritable: true, pubkey: fragmentAta } as AccountMeta);
  }

  transaction.add(await program.methods
    .burnFragments()
    .accounts({
      user: user.publicKey,
     // globalState: globalStateKey,
      nftBuildState: nftBuildStateKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY
    })
    .remainingAccounts([...remainingAccounts])
    .signers([user.keypair])
    .instruction()
  );
  
  await sendOrSimulateTransaction(
    transaction,
    [user.keypair],
    connection,
    false
  );
};

export const initNftBuildState = async (
  accts: BettingAccounts, 
  user: User
) => {
  const nftBuildStateKey = await keys.getUserNftBuildStateKey(user.publicKey);

  let transaction = new Transaction();
  transaction.add(await program.methods
    .initNftBuild()
    .accounts({
      user: user.publicKey,
     // globalState: globalStateKey,
      nftBuildState: nftBuildStateKey,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY
    })
    .signers([user.keypair])
    .instruction()
  );
  
  await sendOrSimulateTransaction(
    transaction,
    [user.keypair],
    connection,
    false
  );
};

export const buyBundle = async (accts: BettingAccounts, user: User, bundleId: number) => {
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
  console.log("feelAmount = ", (await connection.getTokenAccountBalance(userFeelAta)).value.uiAmount);
  
  let signers = [];
  let instructions = [];
  let remainingAccounts: AccountMeta[] = [];
  let bundleData = await prepareMintBundle(user, remainingAccounts, instructions, signers);

  const feelTreasuryAta = await getAssociatedTokenAddress(accts.rankMint, 
    new PublicKey(Constants.TREASURY));
  if (!(await connection.getAccountInfo(feelTreasuryAta))) {
    instructions.push(
      createAssociatedTokenAccountInstruction(
        user.publicKey,
        feelTreasuryAta,
        new PublicKey(Constants.TREASURY),
        accts.rankMint
      )
    )
  }


  let transaction = new Transaction();
  transaction.add(...instructions);
  transaction.add(await program.methods
    .buyBundle(bundleId)
    .accounts({
      user: user.publicKey,
      globalState: globalStateKey,
      treasury: new PublicKey(Constants.TREASURY),
      bundleCreator: remainingAccounts[0].pubkey,
      bundleMint: remainingAccounts[1].pubkey,
      userBundleAta: remainingAccounts[2].pubkey,
      bundleMetadata: remainingAccounts[3].pubkey,
      bundleEdition: remainingAccounts[4].pubkey,
      feelTreasuryAta,
      userFeelAta,
      feelMint: accts.rankMint,
      tokenMetadataProgram: new PublicKey(Constants.MetadataProgramId),
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .signers([user.keypair])
    .instruction()
  );
  await sendOrSimulateTransaction(
    transaction,
    [user.keypair, ...signers],
    connection,
    false
  );
  return remainingAccounts[1].pubkey;
};


export const buyNft = async (accts: BettingAccounts, user: User) => {
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
  console.log("feelAmount = ", (await connection.getTokenAccountBalance(userFeelAta)).value.uiAmount);
  
  let signers = [];
  let instructions = [];
  let remainingAccounts: AccountMeta[] = [];
  await prepareMintNft(user, remainingAccounts, instructions, signers);
  const feelTreasuryAta = await getAssociatedTokenAddress(accts.rankMint, 
    new PublicKey(Constants.TREASURY));
  if (!(await connection.getAccountInfo(feelTreasuryAta))) {
    instructions.push(
      createAssociatedTokenAccountInstruction(
        user.publicKey,
        feelTreasuryAta,
        new PublicKey(Constants.TREASURY),
        accts.rankMint
      )
    )
  }
  let transaction = new Transaction();
  transaction.add(...instructions);
  transaction.add(await program.methods
    .buyNft()
    .accounts({
      user: user.publicKey,
      globalState: globalStateKey,
      treasury: new PublicKey(Constants.TREASURY),
      nftCreator: remainingAccounts[0].pubkey,
      nftMint: remainingAccounts[1].pubkey,
      userNftAta: remainingAccounts[2].pubkey,
      nftMetadata: remainingAccounts[3].pubkey,
      nftEdition: remainingAccounts[4].pubkey,
      feelTreasuryAta,
      userFeelAta,
      feelMint: accts.rankMint,
      tokenMetadataProgram: new PublicKey(Constants.MetadataProgramId),
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .signers([user.keypair])
    .instruction()
  );
  await sendOrSimulateTransaction(
    transaction,
    [user.keypair, ...signers],
    connection,
    false
  );
  return remainingAccounts[1].pubkey;
};

export const mintFragment = async (
  accts: BettingAccounts, 
  admin: User,
  fragmentNo: number
) => {
  const globalStateKey = await keys.getGlobalStateKey();
  let transaction = new Transaction();
  
  let mintKey = await keys.getFragmentMintKey(fragmentNo);
  let ataKey = await getAssociatedTokenAddress(mintKey, admin.publicKey);
  transaction.add(await program.methods
    .mintFragment(fragmentNo)
    .accounts({
      authority: admin.publicKey,
      globalState: globalStateKey,
      mint: mintKey,
      userAta: ataKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .signers([admin.keypair])
    .instruction()
  );  
  await sendOrSimulateTransaction(
    transaction,
    [admin.keypair],
    connection,
    false
  );
};

export const openBundle = async (
  accts: BettingAccounts, 
  user: User,
  bundleMint: PublicKey
) => {
  const globalStateKey = await keys.getGlobalStateKey();
  let transaction = new Transaction();
  let remainingAccounts: AccountMeta[] = [];

  await prepareMintFragment(user, remainingAccounts);

  let bundleMinterKey = await keys.getBundleMinterKey();
  let bundleMetaKey = await keys.getMetadataKey(bundleMint);
  let metadata_info = Metadata.fromAccountInfo(await connection.getAccountInfo(bundleMetaKey))[0];
  let bundle_id = parseInt(metadata_info.data.name.slice(7, 8));

 console.log("bundleId =", bundle_id);
 console.log("metadata_info.data.name =", metadata_info.data.name);
  
  let userBundleAta = await getAssociatedTokenAddress(
    bundleMint,
    user.publicKey
  );
  transaction.add(await program.methods
    .openBundle()
    .accounts({
      user: user.publicKey,
      globalState: globalStateKey,
      userBundleAta,
      bundleMint,
      bundleMetadata: bundleMetaKey,

      btcPythAccount: new PublicKey(Constants.BTC_PYTH_ACCOUNT),
      ethPythAccount: new PublicKey(Constants.ETH_PYTH_ACCOUNT),
      solPythAccount: new PublicKey(Constants.SOL_PYTH_ACCOUNT),
      avaxPythAccount: new PublicKey(Constants.AVAX_PYTH_ACCOUNT),
      adaPythAccount: new PublicKey(Constants.ADA_PYTH_ACCOUNT),

      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .remainingAccounts([...remainingAccounts])
    .signers([user.keypair])
    .instruction()
  );  

  await sendOrSimulateTransaction(
    transaction,
    [user.keypair],
    connection,
    false
  );
};

export const buildNFT = async (
  accts: BettingAccounts, 
  user: User,
) => {
  const globalStateKey = await keys.getGlobalStateKey();

  let transaction = new Transaction();
  let instructions = [];
  let signers = [];
  let tempRemainingAccounts: AccountMeta[] = [];
  await prepareMintNft(user, tempRemainingAccounts, instructions, signers);
  transaction.add(...instructions);
  transaction.add(await program.methods
    .buildNft()
    .accounts({
      user: user.publicKey,
      globalState: globalStateKey,
      nftBuildState: await keys.getUserNftBuildStateKey(user.publicKey),
      nftCreator: tempRemainingAccounts[0].pubkey,
      nftMint: tempRemainingAccounts[1].pubkey,
      userNftAta: tempRemainingAccounts[2].pubkey,
      nftMetadata: tempRemainingAccounts[3].pubkey,
      edition: tempRemainingAccounts[4].pubkey,
      tokenProgram: TOKEN_PROGRAM_ID,
      tokenMetadataProgram: new PublicKey(Constants.MetadataProgramId),
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .signers([user.keypair])
    .instruction()
  );  
  await sendOrSimulateTransaction(
    transaction,
    [user.keypair, ...signers],
    connection,
    false
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

export const fetchEightBoxState = async (
  key: PublicKey
): Promise<IdlAccounts<Betting>["eightBoxState"] | null> => {
  return await fetchData("eightBoxState", key);
};

export const prepareMintFragment = async (
  wallet: any,
  remainingAccounts: AccountMeta[],
) => {
  for (let i = 1; i <= 9; i ++) {
    let mint = await keys.getFragmentMintKey(i);
    let fragmentAta = await getAssociatedTokenAddress(
      mint,
      wallet.publicKey
    );
    remainingAccounts.push({ isSigner: false, isWritable: true, pubkey: mint } as AccountMeta);
    remainingAccounts.push({ isSigner: false, isWritable: true, pubkey: fragmentAta } as AccountMeta);
  }
}


export const prepareMintNft = async (
  wallet: any,
  remainingAccounts: AccountMeta[],
  instructions: TransactionInstruction[],
  signers: Signer[],
  count: number = 1
) => {
  let nftMinterKey = await keys.getNftMinterKey();
  remainingAccounts.push({ isSigner: false, isWritable: true, pubkey: nftMinterKey });

  for (let i = 0; i < count; i ++) {
    let newNftMint = Keypair.generate();
    signers.push(newNftMint);

    instructions.push(SystemProgram.createAccount({
      fromPubkey: wallet.publicKey,
      newAccountPubkey: newNftMint.publicKey,
      space: MINT_SIZE,
      lamports: await connection.getMinimumBalanceForRentExemption(MINT_SIZE),
      programId: TOKEN_PROGRAM_ID,
    }));

    instructions.push(createInitializeMintInstruction(
      newNftMint.publicKey,
      0,
      nftMinterKey,
      null
    ));
    remainingAccounts.push({ isSigner: false, isWritable: true, pubkey: newNftMint.publicKey } as AccountMeta);

    let associatedAcc = await getAssociatedTokenAddress(
      newNftMint.publicKey,
      wallet.publicKey
    );
    instructions.push(
      createAssociatedTokenAccountInstruction(
        wallet.publicKey,
        associatedAcc,
        wallet.publicKey,
        newNftMint.publicKey
      )
    )
    remainingAccounts.push({ isSigner: false, isWritable: true, pubkey: associatedAcc });

    let metadataKey = await keys.getMetadataKey(newNftMint.publicKey);
    remainingAccounts.push({ isSigner: false, isWritable: true, pubkey: metadataKey });

    
    let editionKey = await keys.getEditionKey(newNftMint.publicKey);
    remainingAccounts.push({ isSigner: false, isWritable: true, pubkey: editionKey });
  }
}

export const prepareMintBundle = async (
  wallet: any,
  remainingAccounts: AccountMeta[],
  instructions: TransactionInstruction[],
  signers: Signer[],
  count: number = 1
) => {
  let nftMinterKey = await keys.getBundleMinterKey();
  remainingAccounts.push({ isSigner: false, isWritable: true, pubkey: nftMinterKey });

  for (let i = 0; i < count; i ++) {
    let newNftMint = Keypair.generate();
    signers.push(newNftMint);

    instructions.push(SystemProgram.createAccount({
      fromPubkey: wallet.publicKey,
      newAccountPubkey: newNftMint.publicKey,
      space: MINT_SIZE,
      lamports: await connection.getMinimumBalanceForRentExemption(MINT_SIZE),
      programId: TOKEN_PROGRAM_ID,
    }));

    instructions.push(createInitializeMintInstruction(
      newNftMint.publicKey,
      0,
      nftMinterKey,
      null
    ));
    remainingAccounts.push({ isSigner: false, isWritable: true, pubkey: newNftMint.publicKey } as AccountMeta);

    let associatedAcc = await getAssociatedTokenAddress(
      newNftMint.publicKey,
      wallet.publicKey
    );
    instructions.push(
      createAssociatedTokenAccountInstruction(
        wallet.publicKey,
        associatedAcc,
        wallet.publicKey,
        newNftMint.publicKey
      )
    )
    remainingAccounts.push({ isSigner: false, isWritable: true, pubkey: associatedAcc });

    let metadataKey = await keys.getMetadataKey(newNftMint.publicKey);
    remainingAccounts.push({ isSigner: false, isWritable: true, pubkey: metadataKey });
    
    let editionKey = await keys.getEditionKey(newNftMint.publicKey);
    remainingAccounts.push({ isSigner: false, isWritable: true, pubkey: editionKey });
  }
}