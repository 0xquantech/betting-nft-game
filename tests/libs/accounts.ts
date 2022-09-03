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
  rankMint: PublicKey;
  payerAndAuth: Keypair;
  escrowAta: PublicKey;
  feelVaultAta: PublicKey;
  globalStateKey: PublicKey;
  
  constructor() {
    this.payerAndAuth = Keypair.generate();
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
    this.rankMint = await createMint(
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
    this.feelVaultAta= getAssocTokenAcct(
      this.globalStateKey,
      this.rankMint
    )[0];
  }
}
