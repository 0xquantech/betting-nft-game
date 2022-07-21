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
  openArena,
  endHour, endDay, endWeek, claimHourRankReward, claimDayRankReward, claimWeekRankReward, claimRefReward, cancelArena, returnBet
} from "./libs/instructions";
import { delay } from "./libs/utils";
import { mintTo } from "@solana/spl-token";

chaiUse(chaiAsPromised);

describe("betting", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Betting as Program<Betting>;
  const bettingAccounts = new BettingAccounts();

  const admin = new User();
  const userA = new User();
  const userB = new User();
  const userC = new User();
  const userD = new User();
  const remainingUsers: Array<User> = [];

  const arenaId = 1;
  const cancelledArenaId = 2;

  it("setup", async () => {
    await bettingAccounts.init(provider.connection);
    await admin.init(provider.connection, bettingAccounts);
    await userA.init(provider.connection, bettingAccounts);
    await userB.init(provider.connection, bettingAccounts);
    await userC.init(provider.connection, bettingAccounts);
    await userD.init(provider.connection, bettingAccounts);

    for (let i = 0; i < 1; i ++) {
      let user = new User();
      await user.init(provider.connection, bettingAccounts);
      remainingUsers.push(user);
    }
  });

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await initializeProgram(bettingAccounts, admin);

    await mintTo(
      provider.connection,
      admin.keypair,
      bettingAccounts.rankMint,
      bettingAccounts.feelVaultAta,
      bettingAccounts.payerAndAuth,
      100_000_000_000_000
    );
  });

  it("Open Arena", async () => {
    const tx = await openArena(bettingAccounts, admin, arenaId);
  })

  it("UserA Bet to Up, 2500 USDC", async () => {
    const tx = await userBet(bettingAccounts, userA, userD.publicKey, arenaId, 2500, true /** up */);
  });

  it("UserB Bet to Up, 2000 USDC", async () => {
    const tx = await userBet(bettingAccounts, userB, userD.publicKey, arenaId, 2000, true /** up */);
  });
  
  it("FAIL: UserB double bet", async () => {
    await expect(
        userBet(bettingAccounts, userB, userD.publicKey, arenaId, 2000, true /** up */)
    ).is.rejected;
  });

  it("UserC Bet to Down, 1500 USDC", async () => {
    const tx = await userBet(bettingAccounts, userC, userD.publicKey, arenaId, 1500, false /** down */);
  });

  it("Remaining users Bet to random with random amount", async () => {
    for (let i = 0; i < remainingUsers.length; i ++) {
      await userBet(bettingAccounts,
        remainingUsers[i],
        userD.publicKey,
        arenaId,
        Math.random() * 2000,
        Math.random() > 0.5 ? true : false
      );
    }
  });

  it("Start Arena", async () => {
    const tx = await startArena(bettingAccounts, admin, arenaId);
  });

  it("End Arena", async () => {
    const tx = await endArena(bettingAccounts, admin, arenaId);
  });

  it("FAIL: UserD Bet to Down, 1500 USDC", async () => {
    await expect(
      userBet(bettingAccounts, userD, admin.publicKey, arenaId, 1500, false /** down */)
    ).is.rejected;
  });

  it("UserA claim Reward", async () => {
    const tx = await claimReward(bettingAccounts, userA, userD, arenaId);
  })

  it("UserC claim Reward", async () => {
    const tx = await claimReward(bettingAccounts, userC, userD, arenaId);
  })
  
  it("End Hour", async () => {
    await endHour(bettingAccounts, admin);
  });

  it("End Day", async () => {
    await endDay(bettingAccounts, admin);
  });

  it("End Week", async () => {
    await endWeek(bettingAccounts, admin);
  });

  it("Claim hour rank reward", async () => {
    await claimHourRankReward(bettingAccounts, userA);
  });

  it("Claim day rank reward", async () => {
    await claimDayRankReward(bettingAccounts, userA);
  });

  it("Claim week rank reward", async () => {
    await claimWeekRankReward(bettingAccounts, userA);
  });

  it("Claim Ref reward", async () => {
    await claimRefReward(bettingAccounts, userD);
  })

  it("Open Arena", async () => {
    const tx = await openArena(bettingAccounts, admin, cancelledArenaId);
  })

  it("UserA Bet to Up, 1000 USDC", async () => {
    const tx = await userBet(bettingAccounts, userA, userD.publicKey, cancelledArenaId, 1000, true /** up */);
  });

  it("UserB Bet to Up, 2000 USDC", async () => {
    const tx = await userBet(bettingAccounts, userB, userD.publicKey, cancelledArenaId, 2000, true /** up */);
  });

  it("Start Arena", async () => {
    const tx = await startArena(bettingAccounts, admin, cancelledArenaId);
  });

  it("Cancel Arena", async () => {
    const tx = await cancelArena(bettingAccounts, admin, cancelledArenaId);
  });

  it("FAIL: UserA claim Reward: can't claim in cancelled arena", async () => {
    await expect(
      claimReward(bettingAccounts, userA, userD, cancelledArenaId)
    ).is.rejected;
  });
  
  it("Return Bet", async () => {
    const tx = await returnBet(bettingAccounts, admin, cancelledArenaId);
  });

});
