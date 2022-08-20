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
import { getPassedHours, getPassedWeeks } from "../tests/libs/utils";

const connection = new Connection(clusterApiUrl("devnet"));
// 36gJMRpN2dTyYegNBtTa5RvndhWr7vPL91E7hV5zcQKA
const admin = anchor.web3.Keypair.fromSecretKey(bs58.decode("3EFsWUQQuU32XaTrvhQGaYqUhWJiPayWA64CrU7f6cU7Jdbbm77tJE2y89DfByuFavp8X3jwAxuG4oxbDhYXcHJG"));
let provider = new anchor.AnchorProvider(connection, new NodeWallet(admin), anchor.AnchorProvider.defaultOptions())
const program = new anchor.Program(IDL, Constants.PROGRAM_ID, provider);

const endWeek = async () => {
  let week = getPassedWeeks(Date.now());
  let week_sec = week.mul(new BN(Constants.ONE_WEEK_SEC));
  let weekStateAccounts = await program.account.weekState.all([{
    memcmp: {
      offset: 40,
      bytes: bs58.encode(week_sec.toArrayLike(Array, "le", 8))
    }
  }]);

  //let weekStateAccounts = await program.account.weekState.all();

  weekStateAccounts.sort((a, b) => b.account.betAmount.cmp(a.account.betAmount));
  console.log("weekStateAccounts betAmount =", weekStateAccounts.map(acc => acc.account.betAmount.toString()));
  console.log("weekStateAccounts startTime =", weekStateAccounts.map(acc => acc.account.startTime.toString()));
  let tiers = [];
  let tier_dist = [1, 2, 3, 5, 10, 25, 50, 100, 250];
  let distIdx = 0;
  let rewardPerTier = [32363, 43150, 21575, 10787, 4315, 1438, 863, 431, 107];
  let winners = 250;
  let winner_cnt = 0;

  if (weekStateAccounts.length > 0) {
    for (let acc of weekStateAccounts) {
      winner_cnt ++;
      if (winner_cnt == tier_dist[distIdx]) {
        distIdx ++;
        tiers.push(acc.account.betAmount);
      }
      if (winner_cnt == winners) break;
    }
    if (weekStateAccounts.length < winners) {
      while (distIdx ++ < tier_dist.length) {
        tiers.push(weekStateAccounts[weekStateAccounts.length - 1].account.betAmount);
      }
    }
  }

  console.log("tiers =", tiers.map(v => v.toString()));

  const txHash = await program.methods
    .endWeek(week, tiers.map((v) => new BN(v)), rewardPerTier.map(v => new BN(v * 10 ** Constants.FEEL_DECIMALS)))
    .accounts({
      authority: admin.publicKey,
      globalState: await keys.getGlobalStateKey(),
      weekResult: await keys.getWeekResultKey(week),
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .signers([admin])
    .rpc();
  console.log("txHash =", txHash);
}

endWeek();