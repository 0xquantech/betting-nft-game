import BN from "bn.js";
import {
  ONE_HOUR_MS,
  ONE_DAY_MS,
  ONE_WEEK_MS
} from './constants';

export const getPassedTime = (val: number): {hour: BN, day: BN, week: BN} => {
  return {
    hour: new BN(Math.floor(val / ONE_HOUR_MS)),
    day: new BN(Math.floor(val / ONE_DAY_MS)),
    week: new BN(Math.floor(val / ONE_WEEK_MS)),
  } 
}