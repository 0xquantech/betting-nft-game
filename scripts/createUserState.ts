import * as anchor from '@project-serum/anchor'

import { Connection, PublicKey, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import {
  SystemProgram,
} from "@solana/web3.js";

export const createUserStateInstruction = async (
  program: any,
  userKey: PublicKey,
  payer: PublicKey,
  userStateKey: PublicKey
) => {
  return await program.methods
    .initUserState(userKey)
    .accounts({
      payer,
      userState: userStateKey,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .instruction();
};