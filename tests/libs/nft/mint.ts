import { web3 } from "@project-serum/anchor";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";

// for rest function
import {
  TOKEN_PROGRAM_ID,
  AccountLayout,
  MintLayout,
  createMint,
  createAccount,
  createAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";

let bs58 = require("bs58");
import BN from "bn.js";
import {
  Data,
  updateMetadata,
  Creator,
  createMetadata,
  createMasterEdition,
  getMetadata,
} from "./metadata";
import { User } from "../user";

export const mintNewNFT = async (
  connection: Connection,
  creator: Keypair,
  owner: User,
  potionLvl: number
): Promise<PublicKey> => {
  // Create new token mint
  const newMintKey = await createMint(
    connection,
    creator,
    creator.publicKey,
    null,
    0
  );
  const nftAccount = await createAssociatedTokenAccount(
    connection,
    owner.keypair,
    newMintKey,
    owner.publicKey
  );
  await mintTo(
    connection,
    owner.keypair,
    newMintKey,
    nftAccount,
    creator,
    1
  );

  let name = "Test NFT";
  switch (potionLvl) {
    case 0: name = "Primitive potion"; break;
    case 1: name = "Uncommon potion"; break;
    case 2: name = "Rare potion"; break;
    case 3: name = "Legendary potion"; break;
    default: break;
  }
  const metadataUrl = "https://metaverse-nft/testnft01";

  const creators = [
    new Creator({
      address: creator.publicKey.toBase58(),
      share: 37,
      verified: true,
    }),
    new Creator({
      address: "7diGCKfWSnqujiC9GvK3mpwsF5421644SbDEHKtSho1d",
      share: 60,
      verified: false,
    }),
    new Creator({
      address: "GC9Ln3MRWahCrgjdtRANZyF5vpVd9XWgJibJsuNUXWLB",
      share: 3,
      verified: false,
    }),
  ];

  let data = new Data({
    name: name,
    symbol: "POTION",
    uri: metadataUrl,
    creators,
    sellerFeeBasisPoints: 800,
  });

  let instructions: TransactionInstruction[] = [];

  await createMetadata(
    data,
    creator.publicKey.toBase58(),
    newMintKey.toBase58(),
    creator.publicKey.toBase58(),
    instructions,
    creator.publicKey.toBase58()
  );

  /*await createMasterEdition(
    new BN(1),
    newMintKey.toBase58(),
    creator.publicKey.toBase58(),
    creator.publicKey.toBase58(),
    creator.publicKey.toBase58(),
    instructions
  );*/
  const transaction = new Transaction();
  transaction.add(...instructions);
  let txHash = await sendAndConfirmTransaction(
    connection,
    transaction,
    [creator]
  );
  console.log("nft creation done");
  return newMintKey;
};
