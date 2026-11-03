import { DeleveragePlan, ExecutionStep, LeveragePlan, SimulationResult } from '../types/enso';

export async function simulateBundleExecution(
  steps: ExecutionStep[],
  plan: LeveragePlan | DeleveragePlan,
  onStepProgress: (stepId: string, status: 'pending' | 'success' | 'failed') => void
): Promise<SimulationResult> {
  const isLeverage = 'leverage' in plan;
  const logs: string[] = [];

  logs.push(`[T+0ms] Initiating Enso Flashloan Bundle Simulation...`);
  logs.push(`[T+12ms] Connected to Enso Router at 0x10d1b02330a13E16cfB1201B4B6E70d24e12eE5e`);
  logs.push(`[T+34ms] Validating flashloan provider: ${plan.flashloanProvider.name} (Fee: ${plan.flashloanProvider.feePercent}%)`);

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    onStepProgress(step.id, 'pending');
    
    // Simulate real RPC step latency
    await new Promise((resolve) => setTimeout(resolve, 450));

    logs.push(`[Step ${step.number}] ${step.title}: Invoking ${step.method} on ${step.contract}`);
    logs.push(`  → Status: OK. Output: ${step.expectedOutput}`);
    
    onStepProgress(step.id, 'success');
  }

  logs.push(`[T+2450ms] All inner callback actions resolved without revert.`);
  logs.push(`[T+2510ms] Flashloan repayment verified. Invariants satisfied.`);

  const mockTxHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  const gasUsed = isLeverage ? (plan as LeveragePlan).estimatedGasUnits : (plan as DeleveragePlan).estimatedGasUnits;

  if (isLeverage) {
    const levPlan = plan as LeveragePlan;
    return {
      txHash: mockTxHash,
      blockNumber: 21849102,
      gasUsed,
      gasCostEth: (gasUsed * 18 * 1e-9),
      status: 'success',
      logs,
      balanceChanges: [
        {
          token: levPlan.collateralToken.symbol,
          before: `${levPlan.initialCapitalAmount.toFixed(4)} ${levPlan.collateralToken.symbol}`,
          after: `0.0000 ${levPlan.collateralToken.symbol} (Deposited)`,
          delta: `-${levPlan.initialCapitalAmount.toFixed(4)} (Supplied to vault)`,
        },
        {
          token: `${levPlan.market.protocol.toUpperCase()} Collateral`,
          before: `0.0000`,
          after: `${levPlan.totalCollateralAmount.toFixed(4)} ${levPlan.collateralToken.symbol}`,
          delta: `+${levPlan.totalCollateralAmount.toFixed(4)} ($${levPlan.totalCollateralUsd.toLocaleString()})`,
        },
        {
          token: `${levPlan.market.protocol.toUpperCase()} Debt`,
          before: `0.0000`,
          after: `${levPlan.totalDebtAmount.toFixed(2)} ${levPlan.debtToken.symbol}`,
          delta: `-${levPlan.totalDebtAmount.toFixed(2)} ($${levPlan.totalDebtUsd.toLocaleString()})`,
        },
      ],
      positionState: {
        collateral: `${levPlan.totalCollateralAmount.toFixed(4)} ${levPlan.collateralToken.symbol}`,
        debt: `${levPlan.totalDebtAmount.toFixed(2)} ${levPlan.debtToken.symbol}`,
        healthFactor: levPlan.healthFactor,
        ltv: levPlan.ltv,
      },
    };
  } else {
    const delPlan = plan as DeleveragePlan;
    return {
      txHash: mockTxHash,
      blockNumber: 21849105,
      gasUsed,
      gasCostEth: (gasUsed * 18 * 1e-9),
      status: 'success',
      logs,
      balanceChanges: [
        {
          token: `${delPlan.market.protocol.toUpperCase()} Debt`,
          before: `${delPlan.currentDebtAmount.toFixed(2)} ${delPlan.debtToken.symbol}`,
          after: `${(delPlan.currentDebtAmount - delPlan.debtToRepay).toFixed(2)} ${delPlan.debtToken.symbol}`,
          delta: `-${delPlan.debtToRepay.toFixed(2)} Repaid`,
        },
        {
          token: `${delPlan.market.protocol.toUpperCase()} Collateral`,
          before: `${delPlan.currentCollateralAmount.toFixed(4)} ${delPlan.collateralToken.symbol}`,
          after: `${(delPlan.currentCollateralAmount - delPlan.collateralToWithdraw).toFixed(4)} ${delPlan.collateralToken.symbol}`,
          delta: `-${delPlan.collateralToWithdraw.toFixed(4)} Unwound`,
        },
        {
          token: `Wallet ${delPlan.collateralToken.symbol}`,
          before: `0.0000`,
          after: `${delPlan.netPayoutCollateral.toFixed(4)} ${delPlan.collateralToken.symbol}`,
          delta: `+${delPlan.netPayoutCollateral.toFixed(4)} ($${delPlan.netPayoutUsd.toLocaleString()} Profit)`,
        },
      ],
      positionState: {
        collateral: `${(delPlan.currentCollateralAmount - delPlan.collateralToWithdraw).toFixed(4)} ${delPlan.collateralToken.symbol}`,
        debt: `${(delPlan.currentDebtAmount - delPlan.debtToRepay).toFixed(2)} ${delPlan.debtToken.symbol}`,
        healthFactor: delPlan.healthFactorAfter,
        ltv: delPlan.targetLtvPercent,
      },
    };
  }
}
