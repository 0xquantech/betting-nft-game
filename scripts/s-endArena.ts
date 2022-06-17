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
import { fetchGlobalState } from "./fetch";

const connection = new Connection(clusterApiUrl("devnet"));
// 36gJMRpN2dTyYegNBtTa5RvndhWr7vPL91E7hV5zcQKA
const admin = anchor.web3.Keypair.fromSecretKey(bs58.decode("3EFsWUQQuU32XaTrvhQGaYqUhWJiPayWA64CrU7f6cU7Jdbbm77tJE2y89DfByuFavp8X3jwAxuG4oxbDhYXcHJG"));
let provider = new anchor.Provider(connection, new NodeWallet(admin), anchor.Provider.defaultOptions())
const program = new anchor.Program(IDL, Constants.PROGRAM_ID, provider);

const endArena = async (arenaId: number) => {
  
  const globalStateKey = await keys.getGlobalStateKey();
  const mint = new PublicKey(Constants.USDC_MINT);
  const globalStateAccInfo = await fetchGlobalState(program, globalStateKey);
  if (!globalStateAccInfo)  throw Error("Global State is not created");
  
  const treasuryAta = await getAssociatedTokenAddress(mint, globalStateAccInfo.treasury, true);
  const escrowAta = await getAssociatedTokenAddress(mint, globalStateKey, true);
  const txHash = await program.methods
    .endArena(new BN(arenaId))
    .accounts({
      authority: admin.publicKey,
      globalState: await keys.getGlobalStateKey(),
      arenaState: await keys.getArenaStateKey(arenaId),
      pythAccount: Constants.SOL_PYTH_ACCOUNT,

      treasury: globalStateAccInfo.treasury,
      treasuryAta,
      escrowAta,
      tokenMint: mint,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,

      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .signers([admin])
    .rpc();
  
  console.log("txHash =", txHash);
}

endArena(0);