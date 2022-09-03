import {
  PublicKey,
  Keypair,
  Transaction,
  Connection,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
import {
  // @ts-ignore
  createAssociatedTokenAccountInstruction,
  // @ts-ignore
  mintTo,
  createMint,
  createAccount,
  createAssociatedTokenAccount,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { USDC_DECIMALS } from "./constants";
import { BettingAccounts } from "./accounts";
import { airdropSol, createAta } from "./utils";
import * as keys from "./keys";

export class User {
  publicKey: PublicKey;
  keypair: Keypair;
  bettingMintAta: PublicKey;
  feelAta: PublicKey;
  userStateKey: PublicKey;
  userVaultAta: PublicKey;
  constructor() {
    this.keypair = Keypair.generate();
    this.publicKey = this.keypair.publicKey;
  }
  async init(connection: Connection, accts: BettingAccounts) {
    // sol airdrop to keypair
    await airdropSol(
      connection,
      this.keypair.publicKey,
      9 * LAMPORTS_PER_SOL
    );
    this.bettingMintAta = await createAssociatedTokenAccount(
      connection,
      this.keypair,
      accts.bettingMint,
      this.keypair.publicKey
    );
    await mintTo(
      connection,
      this.keypair,
      accts.bettingMint,
      this.bettingMintAta,
      accts.payerAndAuth,
      100_000_000_000
    );
    this.feelAta = await createAssociatedTokenAccount(
      connection,
      this.keypair,
      accts.rankMint,
      this.keypair.publicKey
    );
    await mintTo(
      connection,
      this.keypair,
      accts.rankMint,
      this.feelAta,
      accts.payerAndAuth,
      100_000_000_000_000
    );
    this.userStateKey = await keys.getUserStateKey(this.publicKey);
    this.userVaultAta = await createAta(
      connection,
      this.keypair,
      accts.bettingMint,
      this.userStateKey,
      true
    );
  }
}
