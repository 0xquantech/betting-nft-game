import * as anchor from "@project-serum/anchor";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
import {
  PublicKey,
  Connection, 
  Transaction,
  clusterApiUrl,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  sendAndConfirmTransaction
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID
} from "@solana/spl-token";
import BN from "bn.js";
import bs58 from 'bs58';
import { IDL } from "../target/types/betting";
import * as Constants from "./constants";
import * as keys from "./keys";
import { fetchDayState, fetchHourState, fetchUserState, fetchWeekState } from "./fetch";
import { createUserStateInstruction } from "./createUserState";

import crypto from 'crypto';
import { getHashArr } from "../tests/libs/utils";
import { getPassedTime } from "./utils";
const connection = new Connection(clusterApiUrl("devnet"));
// 36gJMRpN2dTyYegNBtTa5RvndhWr7vPL91E7hV5zcQKA
const wallet = anchor.web3.Keypair.fromSecretKey(bs58.decode("3EFsWUQQuU32XaTrvhQGaYqUhWJiPayWA64CrU7f6cU7Jdbbm77tJE2y89DfByuFavp8X3jwAxuG4oxbDhYXcHJG"));
let provider = new anchor.Provider(connection, new NodeWallet(wallet), anchor.Provider.defaultOptions())
const program = new anchor.Program(IDL, Constants.PROGRAM_ID, provider);

const userBet = async (
  arenaId: number,
  betAmount: number,
  isGoUp: number,
  refKey: PublicKey,
  hashArr: any
) => 
{
  const amountInDecimal = new anchor.BN(betAmount).mul(
    new anchor.BN(Math.pow(10, Constants.USDC_DECIMALS))
  );;
  const mint = new PublicKey(Constants.USDC_MINT);
  const referrerKey = new PublicKey(refKey);
  const globalStateKey = await keys.getGlobalStateKey();
  const userAta = await getAssociatedTokenAddress(mint, wallet.publicKey);
  const escrowAta = await getAssociatedTokenAddress(mint, globalStateKey, true);

  const userStateKey = await keys.getUserStateKey(wallet.publicKey);
  const preInstructions = [];
  const transaction = new Transaction()
  
  if (!await fetchUserState(program, userStateKey)) {
    await transaction.add(program.instruction.initUserState(
       wallet.publicKey,
     {
       accounts: {
         payer: wallet.publicKey,
         userState: userStateKey,
         systemProgram: SystemProgram.programId,
         rent: SYSVAR_RENT_PUBKEY,
       }
     }
     ));
   }
 
   let dateNow = Date.now();
   const { hour, day, week } = getPassedTime(dateNow);
 
   let hourStateKey = await keys.getUserHourStateKey(wallet.publicKey, hour);
   let dayStateKey = await keys.getUserDayStateKey(wallet.publicKey, day);
   let weekStateKey = await keys.getUserWeekStateKey(wallet.publicKey, week);
   
   if (!(await fetchHourState(program, hourStateKey))) {
     transaction.add(await program.methods
       .initHourState(wallet.publicKey, hour)
       .accounts({
         payer: wallet.publicKey,
         userHourState: hourStateKey,
         systemProgram: SystemProgram.programId,
         rent: SYSVAR_RENT_PUBKEY
       })
       .instruction()
     )
   }
   if (!(await fetchDayState(program, dayStateKey))) {
     transaction.add(await program.methods
       .initDayState(wallet.publicKey, day)
       .accounts({
         payer: wallet.publicKey,
         userDayState: dayStateKey,
         systemProgram: SystemProgram.programId,
         rent: SYSVAR_RENT_PUBKEY
       })
       .instruction()
     )
   }
   if (!(await fetchWeekState(program, weekStateKey))) {
     transaction.add(await program.methods
       .initWeekState(wallet.publicKey, week)
       .accounts({
         payer: wallet.publicKey,
         userWeekState: weekStateKey,
         systemProgram: SystemProgram.programId,
         rent: SYSVAR_RENT_PUBKEY
       })
       .instruction()
     )
   }
 
   transaction.add(
       await program.methods.userBet(
           new BN(arenaId),
           amountInDecimal, 
           hour,
           day,
           week,
           isGoUp ? 1 : 0, 
           referrerKey, 
           hashArr
         ).accounts({
             user: wallet.publicKey,
             globalState: await keys.getGlobalStateKey(),
             arenaState: await keys.getArenaStateKey(arenaId),
             userState: userStateKey,
             userBetState: await keys.getUserBetStateKey(arenaId, wallet.publicKey),
             userHourState: hourStateKey,
             userDayState: dayStateKey,
             userWeekState: weekStateKey,
             userAta,
             escrowAta,
             tokenMint: mint,
             tokenProgram: TOKEN_PROGRAM_ID,
             associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
             systemProgram: SystemProgram.programId,
             rent: SYSVAR_RENT_PUBKEY,
         }).instruction()
     );
   return await sendAndConfirmTransaction(connection, transaction, [wallet]);
}
const main = async (arenaId: number) => {
  const refKey = new PublicKey("36gJMRpN2dTyYegNBtTa5RvndhWr7vPL91E7hV5zcQKA");
  const hash_str = crypto.createHash('sha256').update(
    wallet.publicKey.toBase58() + 
    refKey.toBase58() + 
    'R3fareur'
  ).digest('hex');
  let hash_arr = getHashArr(hash_str);

  let txHash = await userBet(
    arenaId, 
    100,
    0, 
    refKey,
    hash_arr
  );
  console.log("txHash =", txHash);
}

main(0);