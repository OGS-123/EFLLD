export type ChainId = 1 | 42161 | 8453 | 10 | 137;

export interface ChainConfig {
  id: ChainId;
  name: string;
  shortName: string;
  icon: string;
  explorer: string;
  nativeCurrency: {
    symbol: string;
    decimals: number;
  };
}

export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  priceUsd: number;
  logo: string;
  chainId: ChainId;
}

export type FlashloanProtocol = 
  | 'morpho-markets-v1'
  | 'balancer-v3'
  | 'aave-v3'
  | 'uniswap-v3'
  | 'dolomite'
  | 'bend'
  | 'hyperlend'
  | 'kodiak';

export type FlashloanAdapterType = 
  | 'EnsoRouterFlashloanAdapter'
  | 'EnsoWalletFlashloanAdapter'
  | 'EnsoSafeFlashloanAdapter';

export interface FlashloanProvider {
  id: FlashloanProtocol;
  name: string;
  feePercent: number; // e.g. 0% for Morpho / Balancer, 0.05% for Aave
  description: string;
  icon: string;
  contractAddress: string;
  supportedChains: ChainId[];
}

export interface LendingMarket {
  id: string;
  name: string;
  protocol: 'morpho-blue' | 'aave-v3' | 'alchemix-v3' | 'dolomite';
  collateralToken: Token;
  debtToken: Token;
  collateralSupplyApy: number; // e.g. 3.2%
  debtBorrowApy: number; // e.g. 5.8%
  lltv: number; // Liquidation LTV (e.g. 86% for Morpho, 90% for Aave eMode)
  maxLeverage: number; // e.g. 5.5x
  marketId?: string; // For Morpho Blue 32-byte market ID
  chainId: ChainId;
  totalSuppliedUsd: number;
  totalBorrowedUsd: number;
}

export interface OfficialPreset {
  id: string;
  title: string;
  subtitle: string;
  fileName: string;
  githubUrl: string;
  protocol: string;
  flashloanProvider: FlashloanProtocol;
  collateralSymbol: string;
  debtSymbol: string;
  defaultLeverage: number;
  defaultCapital: number;
  description: string;
  tags: string[];
}

export interface LeveragePlan {
  initialCapitalAmount: number;
  initialCapitalUsd: number;
  collateralToken: Token;
  debtToken: Token;
  leverage: number; // e.g. 2.5
  flashloanProvider: FlashloanProvider;
  adapter: FlashloanAdapterType;
  market: LendingMarket;
  
  // Computed values
  flashloanAmount: number;
  flashloanAmountUsd: number;
  flashloanFee: number;
  totalCollateralAmount: number;
  totalCollateralUsd: number;
  totalDebtAmount: number;
  totalDebtUsd: number;
  ltv: number; // Current LTV
  liquidationPrice: number;
  healthFactor: number;
  bufferToLiquidation: number; // % drop until liquidation
  netApy: number;
  estimatedGasUnits: number;
  estimatedGasCostUsd: number;
  slippageTolerancePercent: number;
}

export interface DeleveragePlan {
  currentCollateralAmount: number;
  currentCollateralUsd: number;
  currentDebtAmount: number;
  currentDebtUsd: number;
  collateralToken: Token;
  debtToken: Token;
  market: LendingMarket;
  flashloanProvider: FlashloanProvider;
  adapter: FlashloanAdapterType;
  
  // Target
  unwindType: 'full' | 'partial';
  targetLtvPercent: number; // e.g. 50% or 0%
  
  // Computed
  debtToRepay: number;
  collateralToWithdraw: number;
  collateralToSwap: number;
  netPayoutCollateral: number;
  netPayoutUsd: number;
  healthFactorBefore: number;
  healthFactorAfter: number;
  estimatedGasUnits: number;
  estimatedGasCostUsd: number;
}

export interface ExecutionStep {
  id: string;
  number: number;
  title: string;
  contract: string;
  method: string;
  actionType: 'wrap' | 'flashloan' | 'swap' | 'deposit' | 'borrow' | 'repay' | 'transfer';
  description: string;
  inputs: Record<string, string>;
  expectedOutput: string;
  isInsideCallback: boolean;
  status: 'idle' | 'pending' | 'success' | 'failed';
}

export interface SimulationResult {
  txHash: string;
  blockNumber: number;
  gasUsed: number;
  gasCostEth: number;
  status: 'success' | 'reverted';
  logs: string[];
  balanceChanges: {
    token: string;
    before: string;
    after: string;
    delta: string;
  }[];
  positionState: {
    collateral: string;
    debt: string;
    healthFactor: number;
    ltv: number;
  };
}
