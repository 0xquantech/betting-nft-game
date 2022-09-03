import * as anchor from "@project-serum/anchor";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
import {
  PublicKey,
  Keypair,
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

import bs58 from 'bs58';
import { IDL } from "../target/types/betting";
import * as Constants from "./constants";
import * as keys from "./keys";

const connection = new Connection(clusterApiUrl("devnet"));
// 36gJMRpN2dTyYegNBtTa5RvndhWr7vPL91E7hV5zcQKA
const admin = anchor.web3.Keypair.fromSecretKey(bs58.decode("3EFsWUQQuU32XaTrvhQGaYqUhWJiPayWA64CrU7f6cU7Jdbbm77tJE2y89DfByuFavp8X3jwAxuG4oxbDhYXcHJG"));
let provider = new anchor.AnchorProvider(connection, new NodeWallet(admin), anchor.AnchorProvider.defaultOptions())
const program = new anchor.Program(IDL, Constants.PROGRAM_ID, provider);

const init = async () => {
  
  const globalStateKey = await keys.getGlobalStateKey();
  const mint = new PublicKey(Constants.USDC_MINT);
  const feelMint = new PublicKey(Constants.FEEL_MINT);

  const escrowAta = await getAssociatedTokenAddress(mint, globalStateKey, true);

  const feelVaultAta = await getAssociatedTokenAddress(
    feelMint,
    globalStateKey,
    true
  );
  
  const txHash = await program.methods
    .initialize(admin.publicKey,
      new PublicKey(Constants.BTC_PYTH_ACCOUNT),
      new PublicKey(Constants.ETH_PYTH_ACCOUNT),
      new PublicKey(Constants.SOL_PYTH_ACCOUNT),
      new PublicKey(Constants.AVAX_PYTH_ACCOUNT),
      new PublicKey(Constants.ADA_PYTH_ACCOUNT)
    )
    .accounts({
      authority: admin.publicKey,
      globalState: globalStateKey,
      escrowAta,
      feelVaultAta,
      tokenMint: mint,
      rankMint: feelMint,
      treasury: new PublicKey(Constants.TREASURY),
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .signers([admin])
    .rpc();
  console.log(txHash);
}

init();