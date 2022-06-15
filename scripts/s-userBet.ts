import * as anchor from "@project-serum/anchor";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
import {
  PublicKey,
  Connection, 
  clusterApiUrl,
  SystemProgram,
  SYSVAR_RENT_PUBKEY
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
import { fetchUserState } from "./fetch";
import { createUserStateInstruction } from "./createUserState";

import crypto from 'crypto';
import { getHashArr } from "../tests/libs/utils";
const connection = new Connection(clusterApiUrl("devnet"));
// JAwNgkoSRMJzMndLtxBVSVp3ZPUfw1MEJ5GaAQ2gWcDT
const user = anchor.web3.Keypair.fromSecretKey(bs58.decode("4DvzFh5zMD5pyx46Yvw2X6biMyFfTASEr7k7FfgPaCYfvVfKZkfpciiaESuUmNGyf5PHUqJMmFw4wLEqXeqBT9GZ"));
let provider = new anchor.Provider(connection, new NodeWallet(user), anchor.Provider.defaultOptions())
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
  const userAta = await getAssociatedTokenAddress(mint, user.publicKey);
  const escrowAta = await getAssociatedTokenAddress(mint, globalStateKey, true);

  const userStateKey = await keys.getUserStateKey(user.publicKey);
  const preInstructions = [];
  if (!await fetchUserState(program, userStateKey)) {
    const createUserStateIx = await createUserStateInstruction(
      program, user.publicKey, user.publicKey, userStateKey
    );
    preInstructions.push(createUserStateIx);
  }

  const txHash = await program.methods
    .userBet(new BN(arenaId), amountInDecimal, isGoUp ? 1 : 0, referrerKey, hashArr)
    .accounts({
      user: user.publicKey,
      globalState: await keys.getGlobalStateKey(),
      arenaState: await keys.getArenaStateKey(arenaId),
      userBetState: await keys.getUserBetStateKey(arenaId, user.publicKey),
      userState: userStateKey,
      userAta,
      escrowAta,
      tokenMint: mint,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .preInstructions(preInstructions)
    .rpc();
  return txHash;
}
const main = async () => {
  const refKey = new PublicKey("36gJMRpN2dTyYegNBtTa5RvndhWr7vPL91E7hV5zcQKA");
  const hash_str = crypto.createHash('sha256').update(
    user.publicKey.toBase58() + 
    refKey.toBase58() + 
    'R3fareur'
  ).digest('hex');
  let hash_arr = getHashArr(hash_str);

  let txHash = await userBet(
    0, 100,
    0, 
    refKey,
    hash_arr
  );
  console.log("txHash =", txHash);
}
main();