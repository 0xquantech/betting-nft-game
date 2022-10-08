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
import { getEightBoxId } from "../tests/libs/utils";
import * as Constants from "./constants";
import * as keys from "./keys";

const connection = new Connection(clusterApiUrl("devnet"));
// 36gJMRpN2dTyYegNBtTa5RvndhWr7vPL91E7hV5zcQKA
const admin = anchor.web3.Keypair.fromSecretKey(bs58.decode("3EFsWUQQuU32XaTrvhQGaYqUhWJiPayWA64CrU7f6cU7Jdbbm77tJE2y89DfByuFavp8X3jwAxuG4oxbDhYXcHJG"));
let provider = new anchor.AnchorProvider(connection, new NodeWallet(admin), anchor.AnchorProvider.defaultOptions())
const program = new anchor.Program(IDL, Constants.PROGRAM_ID, provider);

const w3_closeEightBoxState = async (eightBoxStateKey: PublicKey) => {
  let txHash = await program.methods.closeEightBoxState()
    .accounts({
      authority: admin.publicKey,
      globalState: await keys.getGlobalStateKey(),
      eightBoxState: eightBoxStateKey,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .signers([admin])
    .rpc();
  console.log("txHash =", txHash);
}

const main = async () => {
  let eightBoxId = 0;
  let boxKey = await keys.getEightBoxStateKey(admin.publicKey, eightBoxId);
  await w3_closeEightBoxState(boxKey);
}

main();
