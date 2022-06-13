import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { expect, assert, use as chaiUse } from "chai";
import chaiAsPromised from "chai-as-promised";
import { Betting } from "../target/types/betting";
import { BettingAccounts } from "./libs/accounts";
import { User } from "./libs/user";

import {
  claimReward,
  endArena,
  initializeProgram, startArena, userBet,
} from "./libs/instructions";
import { delay } from "./libs/utils";

chaiUse(chaiAsPromised);

describe("betting", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.Provider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Betting as Program<Betting>;
  const bettingAccounts = new BettingAccounts();

  const admin = new User();
  const userA = new User();
  const userB = new User();
  const userC = new User();
  const userD = new User();

  const arenaId = 1;
  it("setup", async () => {
    await bettingAccounts.init(provider.connection);
    await admin.init(provider.connection, bettingAccounts);
    await userA.init(provider.connection, bettingAccounts);
    await userB.init(provider.connection, bettingAccounts);
    await userC.init(provider.connection, bettingAccounts);
    await userD.init(provider.connection, bettingAccounts);
  });

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await initializeProgram(bettingAccounts, admin);
  });

  it("Start Arena", async () => {
    const tx = await startArena(bettingAccounts, admin, arenaId);
  });

  it("UserA Bet to Up, 1000 USDC", async () => {
    const tx = await userBet(bettingAccounts, userA, arenaId, 1000, true /** up */);
  });

  it("UserB Bet to Up, 2000 USDC", async () => {
    const tx = await userBet(bettingAccounts, userB, arenaId, 2000, true /** up */);
  });
  
  it("FAIL: UserB double bet", async () => {
    const tx = await userBet(bettingAccounts, userB, arenaId, 2000, true /** up */);
  });

  it("UserC Bet to Down, 1500 USDC", async () => {
    const tx = await userBet(bettingAccounts, userC, arenaId, 1500, false /** up */);
  });

  it("End Arena", async () => {
    const tx = await endArena(bettingAccounts, admin, arenaId);
  });

  it("FAIL: UserD Bet to Down, 1500 USDC", async () => {
    const tx = await userBet(bettingAccounts, userD, arenaId, 1500, false /** up */);
  });

  it("UserA claim Reward", async () => {
    const tx = await claimReward(bettingAccounts, userA, arenaId);
  })

  it("UserC claim Reward", async () => {
    const tx = await claimReward(bettingAccounts, userC, arenaId);
  })
});
