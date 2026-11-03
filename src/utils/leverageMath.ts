import { DeleveragePlan, FlashloanAdapterType, FlashloanProvider, LendingMarket, LeveragePlan, Token } from '../types/enso';

export function calculateLeveragePlan(params: {
  initialCapitalAmount: number;
  collateralToken: Token;
  debtToken: Token;
  leverage: number;
  flashloanProvider: FlashloanProvider;
  adapter: FlashloanAdapterType;
  market: LendingMarket;
  slippageTolerancePercent?: number;
}): LeveragePlan {
  const {
    initialCapitalAmount,
    collateralToken,
    debtToken,
    leverage,
    flashloanProvider,
    adapter,
    market,
    slippageTolerancePercent = 0.3,
  } = params;

  const initialCapitalUsd = initialCapitalAmount * collateralToken.priceUsd;
  
  // Total collateral target after looping
  const totalCollateralAmount = initialCapitalAmount * leverage;
  const totalCollateralUsd = totalCollateralAmount * collateralToken.priceUsd;

  // Additional collateral acquired via flashloan swap
  const additionalCollateralAmount = totalCollateralAmount - initialCapitalAmount;
  const additionalCollateralUsd = additionalCollateralAmount * collateralToken.priceUsd;

  // Flashloan debt needed (in debtToken units)
  const slippageMultiplier = 1 + slippageTolerancePercent / 100;
  const rawFlashloanUsd = additionalCollateralUsd * slippageMultiplier;
  const flashloanAmount = rawFlashloanUsd / debtToken.priceUsd;
  const flashloanAmountUsd = flashloanAmount * debtToken.priceUsd;

  // Flashloan fee (e.g., 0% for Morpho / Balancer, 0.05% for Aave)
  const flashloanFee = flashloanAmount * (flashloanProvider.feePercent / 100);

  // Total debt borrowed from market to repay flashloan + fee
  const totalDebtAmount = flashloanAmount + flashloanFee;
  const totalDebtUsd = totalDebtAmount * debtToken.priceUsd;

  // Current LTV = Debt / Collateral
  const ltv = totalCollateralUsd > 0 ? (totalDebtUsd / totalCollateralUsd) * 100 : 0;

  // Health Factor = (Total Collateral USD * LLTV) / Total Debt USD
  const liquidationThresholdDecimal = market.lltv / 100;
  const healthFactor = totalDebtUsd > 0
    ? (totalCollateralUsd * liquidationThresholdDecimal) / totalDebtUsd
    : 99.0;

  // Liquidation Price of Collateral (in terms of debt token)
  // Price at which: CollateralAmount * Price * LLTV = Total Debt USD
  const liquidationPrice = (totalCollateralAmount > 0 && liquidationThresholdDecimal > 0)
    ? totalDebtUsd / (totalCollateralAmount * liquidationThresholdDecimal)
    : 0;

  // % drop in collateral price before liquidation occurs
  const currentPrice = collateralToken.priceUsd;
  const bufferToLiquidation = currentPrice > 0 && liquidationPrice > 0
    ? Math.max(0, ((currentPrice - liquidationPrice) / currentPrice) * 100)
    : 100;

  // Net APY = (Collateral Supply APY * Leverage) - (Debt Borrow APY * (Leverage - 1))
  const netApy = (market.collateralSupplyApy * leverage) - (market.debtBorrowApy * (leverage - 1));

  // Gas estimation based on protocol steps (atomic bundle = ~280k - 380k gas)
  const baseGas = adapter === 'EnsoWalletFlashloanAdapter' ? 240000 : 310000;
  const protocolGas = market.protocol === 'morpho-blue' ? 65000 : 95000;
  const estimatedGasUnits = baseGas + protocolGas;
  
  // Chain-specific gas calculation
  let estimatedGasCostUsd = (estimatedGasUnits * 18 * 1e-9) * 2650;
  if (market.chainId === 137) {
    // Polygon PoS uses POL (~$0.38) with ~35 gwei
    estimatedGasCostUsd = (estimatedGasUnits * 35 * 1e-9) * 0.38;
  } else if (market.chainId === 42161) {
    estimatedGasCostUsd = (estimatedGasUnits * 0.1 * 1e-9) * 2650;
  } else if (market.chainId === 8453) {
    estimatedGasCostUsd = (estimatedGasUnits * 0.05 * 1e-9) * 2650;
  } else if (market.chainId === 10) {
    estimatedGasCostUsd = (estimatedGasUnits * 0.04 * 1e-9) * 2650;
  }

  return {
    initialCapitalAmount,
    initialCapitalUsd,
    collateralToken,
    debtToken,
    leverage,
    flashloanProvider,
    adapter,
    market,
    flashloanAmount,
    flashloanAmountUsd,
    flashloanFee,
    totalCollateralAmount,
    totalCollateralUsd,
    totalDebtAmount,
    totalDebtUsd,
    ltv,
    liquidationPrice,
    healthFactor,
    bufferToLiquidation,
    netApy,
    estimatedGasUnits,
    estimatedGasCostUsd,
    slippageTolerancePercent,
  };
}

export function calculateDeleveragePlan(params: {
  currentCollateralAmount: number;
  currentDebtAmount: number;
  collateralToken: Token;
  debtToken: Token;
  market: LendingMarket;
  flashloanProvider: FlashloanProvider;
  adapter: FlashloanAdapterType;
  unwindType: 'full' | 'partial';
  targetLtvPercent?: number;
}): DeleveragePlan {
  const {
    currentCollateralAmount,
    currentDebtAmount,
    collateralToken,
    debtToken,
    market,
    flashloanProvider,
    adapter,
    unwindType,
    targetLtvPercent = 50,
  } = params;

  const currentCollateralUsd = currentCollateralAmount * collateralToken.priceUsd;
  const currentDebtUsd = currentDebtAmount * debtToken.priceUsd;
  const lltvDecimal = market.lltv / 100;

  const healthFactorBefore = currentDebtUsd > 0
    ? (currentCollateralUsd * lltvDecimal) / currentDebtUsd
    : 99.0;

  let debtToRepay = 0;
  let collateralToWithdraw = 0;

  if (unwindType === 'full') {
    debtToRepay = currentDebtAmount;
    collateralToWithdraw = currentCollateralAmount;
  } else {
    // Partial unwind to reach target LTV
    // Target: (RemainingDebtUsd) / (RemainingCollateralUsd) = targetLtvDecimal
    const targetLtvDecimal = targetLtvPercent / 100;
    const debtRatio = Math.max(0, 1 - (targetLtvDecimal / (currentDebtUsd / currentCollateralUsd)));
    debtToRepay = currentDebtAmount * Math.min(0.9, Math.max(0.1, debtRatio));
    collateralToWithdraw = currentCollateralAmount * Math.min(0.9, Math.max(0.1, debtRatio));
  }

  // Value of collateral needed to swap to pay off the repaid debt + flashloan fee
  const debtRepaidUsd = debtToRepay * debtToken.priceUsd;
  const flashloanFeeUsd = debtRepaidUsd * (flashloanProvider.feePercent / 100);
  const totalDebtNeededUsd = (debtRepaidUsd + flashloanFeeUsd) * 1.003; // 0.3% swap buffer

  const collateralToSwap = totalDebtNeededUsd / collateralToken.priceUsd;
  const netPayoutCollateral = Math.max(0, collateralToWithdraw - collateralToSwap);
  const netPayoutUsd = netPayoutCollateral * collateralToken.priceUsd;

  // Remaining position state if partial
  const remainingCollateralUsd = (currentCollateralAmount - collateralToWithdraw) * collateralToken.priceUsd;
  const remainingDebtUsd = (currentDebtAmount - debtToRepay) * debtToken.priceUsd;
  const healthFactorAfter = remainingDebtUsd > 0
    ? (remainingCollateralUsd * lltvDecimal) / remainingDebtUsd
    : 99.0;

  const estimatedGasUnits = 295000;
  let estimatedGasCostUsd = (estimatedGasUnits * 18 * 1e-9) * 2650;
  if (market.chainId === 137) {
    estimatedGasCostUsd = (estimatedGasUnits * 35 * 1e-9) * 0.38;
  } else if (market.chainId === 42161) {
    estimatedGasCostUsd = (estimatedGasUnits * 0.1 * 1e-9) * 2650;
  } else if (market.chainId === 8453) {
    estimatedGasCostUsd = (estimatedGasUnits * 0.05 * 1e-9) * 2650;
  } else if (market.chainId === 10) {
    estimatedGasCostUsd = (estimatedGasUnits * 0.04 * 1e-9) * 2650;
  }

  return {
    currentCollateralAmount,
    currentCollateralUsd,
    currentDebtAmount,
    currentDebtUsd,
    collateralToken,
    debtToken,
    market,
    flashloanProvider,
    adapter,
    unwindType,
    targetLtvPercent,
    debtToRepay,
    collateralToWithdraw,
    collateralToSwap,
    netPayoutCollateral,
    netPayoutUsd,
    healthFactorBefore,
    healthFactorAfter,
    estimatedGasUnits,
    estimatedGasCostUsd,
  };
}
