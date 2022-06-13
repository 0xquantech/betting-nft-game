import {
  PublicKey,
  Keypair,
  LAMPORTS_PER_SOL,
  Connection,
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
} from "@solana/spl-token";
import { USDC_DECIMALS } from "./constants";
import { airdropSol, createAta, getAssocTokenAcct } from "./utils";
import * as keys from "./keys";

export class BettingAccounts {
  bettingMint: PublicKey;
  payerAndAuth: Keypair;
  escrowAta: PublicKey;
  globalStateKey: PublicKey;
  pythAccount: PublicKey;
  constructor() {
    this.payerAndAuth = Keypair.generate();
    this.pythAccount = new PublicKey("H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG");
  }
  async init(connection: Connection) {
    this.globalStateKey = await keys.getGlobalStateKey();
    await airdropSol(
      connection,
      this.payerAndAuth.publicKey,
      99999 * LAMPORTS_PER_SOL
    );
    this.bettingMint = await createMint(
      connection,
      this.payerAndAuth,
      this.payerAndAuth.publicKey,
      null,
      USDC_DECIMALS
    );
    this.escrowAta = getAssocTokenAcct(
      this.globalStateKey,
      this.bettingMint
    )[0];
  }
}
