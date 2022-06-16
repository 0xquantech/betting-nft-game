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

const connection = new Connection(clusterApiUrl("devnet"));
// JAwNgkoSRMJzMndLtxBVSVp3ZPUfw1MEJ5GaAQ2gWcDT
const admin = anchor.web3.Keypair.fromSecretKey(bs58.decode("4DvzFh5zMD5pyx46Yvw2X6biMyFfTASEr7k7FfgPaCYfvVfKZkfpciiaESuUmNGyf5PHUqJMmFw4wLEqXeqBT9GZ"));
let provider = new anchor.Provider(connection, new NodeWallet(admin), anchor.Provider.defaultOptions())
const program = new anchor.Program(IDL, Constants.PROGRAM_ID, provider);

const startArena = async (arenaId: number) => {
  
  const globalStateKey = await keys.getGlobalStateKey();
  const mint = new PublicKey(Constants.USDC_MINT);
  let txHash = await program.methods
    .startArena(new BN(arenaId))
    .accounts({
      authority: admin.publicKey,
      globalState: await keys.getGlobalStateKey(),
      arenaState: await keys.getArenaStateKey(arenaId),
      pythAccount: Constants.SOL_PYTH_ACCOUNT,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .signers([admin])
    .rpc();
  console.log("txHash =", txHash);
}

startArena(1);