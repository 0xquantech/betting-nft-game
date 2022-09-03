import * as anchor from "@project-serum/anchor";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
import {
  PublicKey,
  Connection, 
  clusterApiUrl,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
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

const connection = new Connection(clusterApiUrl("devnet"));
// 36gJMRpN2dTyYegNBtTa5RvndhWr7vPL91E7hV5zcQKA
const user = anchor.web3.Keypair.fromSecretKey(bs58.decode("3EFsWUQQuU32XaTrvhQGaYqUhWJiPayWA64CrU7f6cU7Jdbbm77tJE2y89DfByuFavp8X3jwAxuG4oxbDhYXcHJG"));
let provider = new anchor.AnchorProvider(connection, new NodeWallet(user), anchor.AnchorProvider.defaultOptions())
const program = new anchor.Program(IDL, Constants.PROGRAM_ID, provider);

const createFragments = async () => {
  const globalStateKey = await keys.getGlobalStateKey();
  const fragmentMintKeys: Array<PublicKey> = [];
  for (let i = 1; i <= 9; i ++) fragmentMintKeys.push(await keys.getFragmentMintKey(i));
  let transaction = new Transaction().add(await program.methods
    .createFragmentMints()
    .accounts({
      authority: user.publicKey,
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
    .signers([user])
    .transaction()
  );
  const txHash = await sendAndConfirmTransaction(connection, transaction, [user]);
  console.log("txHash =", txHash);
  return txHash;
}

createFragments();