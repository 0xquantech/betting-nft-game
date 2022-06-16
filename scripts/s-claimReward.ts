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
// 36gJMRpN2dTyYegNBtTa5RvndhWr7vPL91E7hV5zcQKA
const user = anchor.web3.Keypair.fromSecretKey(bs58.decode("3EFsWUQQuU32XaTrvhQGaYqUhWJiPayWA64CrU7f6cU7Jdbbm77tJE2y89DfByuFavp8X3jwAxuG4oxbDhYXcHJG"));
let provider = new anchor.Provider(connection, new NodeWallet(user), anchor.Provider.defaultOptions())
const program = new anchor.Program(IDL, Constants.PROGRAM_ID, provider);

const claimReward = async (
  arenaId: number,
) => 
{
  const mint = new PublicKey(Constants.USDC_MINT);
  const globalStateKey = await keys.getGlobalStateKey();
  const userAta = await getAssociatedTokenAddress(mint, user.publicKey);
  const escrowAta = await getAssociatedTokenAddress(mint, globalStateKey, true);

  const userStateKey = await keys.getUserStateKey(user.publicKey);
  const userStateAccInfo = await fetchUserState(program, userStateKey);
  
  if (!userStateAccInfo) throw Error("User State is not created");
  
  const refUserStateKey = await keys.getUserStateKey(userStateAccInfo.referrer);
  const preInstructions = [];
  if (!await fetchUserState(program, refUserStateKey)) {
    const createUserStateIx = await createUserStateInstruction(
      program, userStateAccInfo.referrer, user.publicKey, refUserStateKey
    );
    preInstructions.push(createUserStateIx);
  }
  const refUserVaultAta = await getAssociatedTokenAddress(mint, refUserStateKey, true);

  const txHash = await program.methods
    .claimReward(new BN(arenaId))
    .accounts({
      user: user.publicKey,
      globalState: await keys.getGlobalStateKey(),
      arenaState: await keys.getArenaStateKey(arenaId),
      userBetState: await keys.getUserBetStateKey(arenaId, user.publicKey),
      userState: userStateKey,
      userAta,
      escrowAta,

      refUserState: refUserStateKey,
      refUserVaultAta,

      tokenMint: mint,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .preInstructions(preInstructions)
    .rpc();
  console.log("txHash =", txHash);
  return txHash;
}

claimReward(1);