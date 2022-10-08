import * as anchor from "@project-serum/anchor";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
import {
  PublicKey,
  Connection, 
  clusterApiUrl,
  SystemProgram,
  SYSVAR_RENT_PUBKEY
} from "@solana/web3.js";
import bs58 from 'bs58';
import { IDL } from "../target/types/betting";
import * as Constants from "./constants";
import * as keys from "./keys";

const connection = new Connection(clusterApiUrl("devnet"));
// 36gJMRpN2dTyYegNBtTa5RvndhWr7vPL91E7hV5zcQKA
const admin = anchor.web3.Keypair.fromSecretKey(bs58.decode("3EFsWUQQuU32XaTrvhQGaYqUhWJiPayWA64CrU7f6cU7Jdbbm77tJE2y89DfByuFavp8X3jwAxuG4oxbDhYXcHJG"));
let provider = new anchor.AnchorProvider(connection, new NodeWallet(admin), anchor.AnchorProvider.defaultOptions())
const program = new anchor.Program(IDL, Constants.PROGRAM_ID, provider);

const w3_closeArenaState = async (arenaId: number) => {
  let txHash = await program.methods.closeArenaState()
    .accounts({
      authority: admin.publicKey,
      globalState: await keys.getGlobalStateKey(),
      arenaState: await keys.getArenaStateKey(arenaId),
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .signers([admin])
    .rpc();
  console.log("txHash =", txHash);
}

w3_closeArenaState(0);