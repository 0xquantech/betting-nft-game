import * as anchor from "@project-serum/anchor";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
import {
  PublicKey,
  Connection, 
  clusterApiUrl,
  SystemProgram,
  SYSVAR_RENT_PUBKEY
} from "@solana/web3.js";
import BN from "bn.js";
import bs58 from 'bs58';
import { IDL } from "../target/types/betting";
import * as Constants from "./constants";
import * as keys from "./keys";

const connection = new Connection(clusterApiUrl("devnet"));
// 36gJMRpN2dTyYegNBtTa5RvndhWr7vPL91E7hV5zcQKA
const admin = anchor.web3.Keypair.fromSecretKey(bs58.decode("3EFsWUQQuU32XaTrvhQGaYqUhWJiPayWA64CrU7f6cU7Jdbbm77tJE2y89DfByuFavp8X3jwAxuG4oxbDhYXcHJG"));
let provider = new anchor.AnchorProvider(connection, new NodeWallet(admin), anchor.AnchorProvider.defaultOptions())
const program = new anchor.Program(IDL, Constants.PROGRAM_ID, provider);

const cancelArena = async (arenaId: number) => {
  const globalStateKey = await keys.getGlobalStateKey();
  let txHash = await program.methods
    .cancelArena(new BN(arenaId))
    .accounts({
      authority: admin.publicKey,
      globalState: globalStateKey,
      arenaState: await keys.getArenaStateKey(arenaId),
      pythAccount: Constants.SOL_PYTH_ACCOUNT,
    })
    .signers([admin])
    .rpc();

  console.log("txHash =", txHash);
}

cancelArena(0);