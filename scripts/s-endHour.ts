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
import { getPassedHours } from "../tests/libs/utils";

const connection = new Connection(clusterApiUrl("devnet"));
// 36gJMRpN2dTyYegNBtTa5RvndhWr7vPL91E7hV5zcQKA
const admin = anchor.web3.Keypair.fromSecretKey(bs58.decode("3EFsWUQQuU32XaTrvhQGaYqUhWJiPayWA64CrU7f6cU7Jdbbm77tJE2y89DfByuFavp8X3jwAxuG4oxbDhYXcHJG"));
let provider = new anchor.AnchorProvider(connection, new NodeWallet(admin), anchor.AnchorProvider.defaultOptions())
const program = new anchor.Program(IDL, Constants.PROGRAM_ID, provider);

const endHour = async () => {
  let hour = getPassedHours(Date.now());
  let hour_sec = hour.mul(new BN(Constants.ONE_HOUR_SEC));
  let hourStateAccounts = await program.account.hourState.all([{
    memcmp: {
      offset: 40,
      bytes: bs58.encode(hour_sec.toArrayLike(Array, "le", 8))
    }
  }]);
  hourStateAccounts.sort((a, b) => b.account.betAmount.cmp(a.account.betAmount));
  //let hourStateAccounts = await program.account.hourState.all();
  console.log("hourStateAccounts =", hourStateAccounts.map(acc => acc.account.betAmount.toString()));
  let tiers = [];
  let tier_dist = [1, 2, 3, 5, 10];
  let distIdx = 0;
  let rewardPerTier = [428, 749, 535, 107, 42];
  let winners = 10;
  let winner_cnt = 0;

  if (hourStateAccounts.length > 0) {
    for (let acc of hourStateAccounts) {
      winner_cnt ++;
      if (winner_cnt == tier_dist[distIdx]) {
        distIdx ++;
        tiers.push(acc.account.betAmount);
      }
      if (winner_cnt == winners) break;
    }
    if (hourStateAccounts.length < winners) {
      while (distIdx ++ < tier_dist.length) {
        tiers.push(hourStateAccounts[hourStateAccounts.length - 1].account.betAmount);
      }
    }
  }
  console.log("tiers =", tiers.map(v => v.toString()));

  let txHash = await program.methods
    .endHour(hour, tiers.map((v) => new BN(v)), rewardPerTier.map(v => new BN(v * 10 ** Constants.FEEL_DECIMALS)))
    .accounts({
      authority: admin.publicKey,
      globalState: await keys.getGlobalStateKey(),
      hourResult: await keys.getHourResultKey(hour),
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .signers([admin])
    .rpc();
  
  console.log("txHash =", txHash);
}

endHour();