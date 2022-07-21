// anchor/solana
import {
  web3,
  Provider,
  utils,
  workspace,
  Program,
  getProvider,
  Wallet,
} from "@project-serum/anchor";
import {
  Connection,
  PublicKey,
  Signer,
  TokenAmount,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import BN from 'bn.js';
import {
  ONE_HOUR_MS, 
  ONE_DAY_MS,
  ONE_WEEK_MS
} from "./constants";

export const airdropSol = async (
  connection: Connection,
  target: web3.PublicKey,
  lamps: number
): Promise<string> => {
  const sig: string = await connection.requestAirdrop(target, lamps);
  await connection.confirmTransaction(sig);
  return sig;
};

export const delay = async (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const sendOrSimulateTransaction = async (tx: Transaction, singers: Signer[], connection: Connection, isSimulate: boolean = false) => {
  if (isSimulate) {
    const result = await connection.simulateTransaction(tx, singers);
    console.log("simulate result =", result);
  }
  await sendAndConfirmTransaction(connection, tx, singers);
}
/**
 * Returns the same value as Token.getAssociatedTokenAddress()
 * but this function does this synchronously
 * and also returns a bump if needed
 *
 * @param ownerPubKey PublicKey
 * @param mintPubKey PublicKey
 * @returns [PublicKey, number]
 */
export const getAssocTokenAcct = (
  ownerPubKey: PublicKey,
  mintPubKey: PublicKey
): [PublicKey, number] => {
  const seeds: Buffer[] = [
    ownerPubKey.toBuffer(),
    TOKEN_PROGRAM_ID.toBuffer(),
    mintPubKey.toBuffer(),
  ];
  const programId: PublicKey = ASSOCIATED_TOKEN_PROGRAM_ID;
  return utils.publicKey.findProgramAddressSync(seeds, programId);
};

export const getAcctInfo = async (
  provider: Provider,
  acctPubKey: PublicKey
): Promise<web3.AccountInfo<Buffer>> => {
  const accountInfo: web3.AccountInfo<Buffer> =
    await provider.connection.getAccountInfo(acctPubKey);
  return accountInfo;
};

export const getAcctBalance = async (
  acctPubKey: PublicKey,
  provider: Provider = getProvider()
): Promise<TokenAmount> => {
  return (await provider.connection.getTokenAccountBalance(acctPubKey)).value;
};

export const getPda = (seeds: Buffer[], programId: PublicKey) => {
  return utils.publicKey.findProgramAddressSync(seeds, programId);
};

export const asyncGetPda = async (
  seeds: Buffer[],
  programId: PublicKey
): Promise<[PublicKey, number]> => {
  const [pubKey, bump] = await PublicKey.findProgramAddress(seeds, programId);
  return [pubKey, bump];
};

export const getSolBalance = async (
  pubKey: PublicKey,
  provider: Provider = getProvider()
) => {
  return await provider.connection.getBalance(pubKey);
};

export const createAta = async (
  connection: Connection,
  payer: Signer,
  mint: PublicKey,
  owner: PublicKey,
  curveOff: boolean = false
): Promise<PublicKey> => {
  const ataKey = await getAssociatedTokenAddress(mint, owner, curveOff);
  let ix = createAssociatedTokenAccountInstruction(
    payer.publicKey,
    ataKey,
    owner,
    mint
  );
  await sendAndConfirmTransaction(connection, new Transaction().add(ix), [
    payer,
  ]);
  return ataKey;
};

export const getHashArr = (hashStr: string) => {
  let arrHash = [];
  if (hashStr.length !== 64) {
    for(let i = 0; i < 32; i ++) arrHash[i] = 0;
    return arrHash;
  }
  for (let i = 0; i < hashStr.length; i += 2) {
    arrHash.push(parseInt('0x' + hashStr.slice(i, i + 2)));
  }
  return arrHash;
}
export const getEightBoxId = (val: number): BN => {
  return new BN(Math.floor(val / (ONE_HOUR_MS * 8)));
}
export const getPassedHours = (val: number): BN => {
  return new BN(Math.floor(val / ONE_HOUR_MS));
}

export const getPassedDays = (val: number): BN => {
  return new BN(Math.floor(val / ONE_DAY_MS));
}

export const getPassedWeeks = (val: number): BN => {
  return new BN(Math.floor(val / ONE_WEEK_MS));
}