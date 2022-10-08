import * as anchor from "@project-serum/anchor";
import { Betting } from "../target/types/betting";

const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);
const program = anchor.workspace.Betting as anchor.Program<Betting>;

export const getProgram = () => {
  return program;
};