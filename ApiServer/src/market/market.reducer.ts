import { transferAction, mintAction, burnAction } from "./market.actions";
import { getType } from "typesafe-actions";
import { BigNumber, bigNumberify } from "@panterazar/ethers/utils";
import { ethers } from "@panterazar/ethers";

const calculateNetCost = (transactionsState, action): BigNumber => {
  const transactions = [
    ...transactionsState,
    {txType: action.type, ...action.payload}
  ];
  const mints = transactions.filter(tx => tx.txType === 'MINT'
    && tx.userAddress === action.payload.userAddress);

  return mints.length > 0 ? mints.reduce((prev, current) => {
    return prev.add((current.collateralAmount.mul(ethers.utils.parseEther('1'))).div(current.amountMinted))
  }, bigNumberify(0)).div(bigNumberify(mints.length)) : bigNumberify(0);
}

export interface MarketState {
  lastBlockUpdated: number,
  totalMinted: BigNumber,
  netCost: {
    [s: string]: BigNumber 
  },
  balances: {
    [s: string]: BigNumber 
  },
  transactions: Array<{
    txType: string,
    userAddress: string,
    amount: BigNumber,
    daiValue: BigNumber,
    blockNumber: number,
    txHash: string,
  }>,
}

export const initialState: MarketState = {
  lastBlockUpdated: 0,
  totalMinted: bigNumberify(0),
  netCost: {},
  balances: {},
  transactions: [],
}


export function MarketReducer(state: MarketState = initialState, action) {
  switch (action.type) {
    case getType(transferAction):
      return {
        ...state,
        lastBlockUpdated: action.payload.blockNumber,
        balances: {
          ...state.balances,
          [action.payload.fromAddress]: state.balances[action.payload.fromAddress].sub(action.payload.amount),
          [action.payload.toAddress]: state.balances[action.payload.toAddress].add(action.payload.amount)
        },
        transactions: [
          ...state.transactions,
          {txType: action.type, ...action.payload}
        ]
      }
    case getType(mintAction):
      return {
        ...state,
        lastBlockUpdated: action.payload.blockNumber,
        totalMinted: state.totalMinted.add(action.payload.amountMinted),
        netCost: {
          ...state.netCost,
          [action.payload.userAddress]: calculateNetCost(state.transactions, action)
        },
        balances: {
          ...state.balances,
          [action.payload.userAddress]: state.balances && (state.balances[action.payload.userAddress]) ? 
            state.balances[action.payload.userAddress].add(action.payload.amountMinted) : 
            action.payload.amountMinted
        },
        transactions: [
          ...state.transactions,
          {txType: action.type, ...action.payload}
        ]
      }
    case getType(burnAction):
      return {
        ...state,
        lastBlockUpdated: action.payload.blockNumber,
        totalMinted: state.totalMinted.sub(action.payload.amountBurnt),
        balances: {
          ...state.balances,
          [action.payload.userAddress]: (state.balances[action.payload.userAddress]) ? 
            state.balances[action.payload.userAddress].sub(action.payload.amountBurnt) :
            action.payload.amountBurnt
        },
        transactions: [
          ...state.transactions,
          {txType: action.type, ...action.payload}
        ]
      }
    default:
      return state;
  }
}