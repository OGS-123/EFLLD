import { DeleveragePlan, ExecutionStep, LeveragePlan } from '../types/enso';
import { ENSO_CORE_CONTRACTS } from '../data/tokensAndMarkets';

export interface FormattedBundleAction {
  protocol: string;
  action: string;
  args: Record<string, unknown>;
}

export interface EnsoBundlePayload {
  chainId: number;
  fromAddress: string;
  receiver: string;
  routingStrategy: 'router' | 'delegate';
  actions: FormattedBundleAction[];
}

export function buildLeverageExecutionSteps(plan: LeveragePlan): ExecutionStep[] {
  const isEthCollateral = plan.collateralToken.symbol === 'WETH' || plan.collateralToken.symbol === 'ETH';
  const steps: ExecutionStep[] = [];

  let stepNum = 1;

  if (isEthCollateral) {
    steps.push({
      id: 'step-wrap',
      number: stepNum++,
      title: 'Wrap Native ETH to WETH',
      contract: plan.collateralToken.address,
      method: 'deposit()',
      actionType: 'wrap',
      description: `Wrap ${plan.initialCapitalAmount.toFixed(4)} ETH into ERC-20 WETH to enable smart contract deposit.`,
      inputs: {
        amount: `${plan.initialCapitalAmount.toFixed(4)} ETH`,
        recipient: 'Enso Smart Wallet / Router',
      },
      expectedOutput: `${plan.initialCapitalAmount.toFixed(4)} WETH`,
      isInsideCallback: false,
      status: 'idle',
    });
  } else {
    steps.push({
      id: 'step-transfer',
      number: stepNum++,
      title: `Transfer Initial Capital (${plan.collateralToken.symbol})`,
      contract: plan.collateralToken.address,
      method: 'transferFrom(owner, router, amount)',
      actionType: 'transfer',
      description: `Pull ${plan.initialCapitalAmount.toFixed(2)} ${plan.collateralToken.symbol} into Enso execution context.`,
      inputs: {
        token: plan.collateralToken.address,
        amount: `${plan.initialCapitalAmount.toFixed(2)} ${plan.collateralToken.symbol}`,
      },
      expectedOutput: 'Approved & transferred',
      isInsideCallback: false,
      status: 'idle',
    });
  }

  // Flashloan Step
  steps.push({
    id: 'step-flashloan',
    number: stepNum++,
    title: `Flashloan ${plan.debtToken.symbol} from ${plan.flashloanProvider.name}`,
    contract: plan.flashloanProvider.contractAddress,
    method: 'flashLoan(receiver, tokens, amounts, userData)',
    actionType: 'flashloan',
    description: `Borrow ${plan.flashloanAmount.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${plan.debtToken.symbol} with 0 upfront collateral (Fee: ${plan.flashloanProvider.feePercent}%).`,
    inputs: {
      token: plan.debtToken.address,
      amount: `${plan.flashloanAmount.toFixed(2)} ${plan.debtToken.symbol}`,
      provider: plan.flashloanProvider.id,
      adapter: plan.adapter,
    },
    expectedOutput: `Trigger callback with ${plan.flashloanAmount.toFixed(2)} ${plan.debtToken.symbol}`,
    isInsideCallback: false,
    status: 'idle',
  });

  // Callback Step 1: Swap
  const acquiredCollateral = plan.totalCollateralAmount - plan.initialCapitalAmount;
  const coreContracts = ENSO_CORE_CONTRACTS[plan.market.chainId] || ENSO_CORE_CONTRACTS[1];
  steps.push({
    id: 'step-swap',
    number: stepNum++,
    title: `Swap Flashloaned ${plan.debtToken.symbol} → ${plan.collateralToken.symbol}`,
    contract: coreContracts.router,
    method: 'route(tokenIn, tokenOut, amountIn, minAmountOut, receiver)',
    actionType: 'swap',
    description: `Swap ${plan.flashloanAmount.toFixed(2)} ${plan.debtToken.symbol} into ~${acquiredCollateral.toFixed(4)} ${plan.collateralToken.symbol} via Enso DEX Aggregator.`,
    inputs: {
      tokenIn: plan.debtToken.address,
      tokenOut: plan.collateralToken.address,
      amountIn: `${plan.flashloanAmount.toFixed(2)} ${plan.debtToken.symbol}`,
      slippage: `${plan.slippageTolerancePercent}%`,
    },
    expectedOutput: `+${acquiredCollateral.toFixed(4)} ${plan.collateralToken.symbol}`,
    isInsideCallback: true,
    status: 'idle',
  });

  // Callback Step 2: Deposit All Collateral
  steps.push({
    id: 'step-deposit',
    number: stepNum++,
    title: `Deposit Collateral to ${plan.market.name}`,
    contract: plan.market.protocol === 'morpho-blue' ? '0xBBBBBbbBBb9cC5e90e3b3Af64bdAF63C3799440d' : '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
    method: plan.market.protocol === 'morpho-blue' ? 'supply(marketParams, assets, shares, onBehalfOf, data)' : 'supply(asset, amount, onBehalfOf, referralCode)',
    actionType: 'deposit',
    description: `Supply full leveraged collateral (${plan.totalCollateralAmount.toFixed(4)} ${plan.collateralToken.symbol} = $${plan.totalCollateralUsd.toLocaleString()}) to unlock borrowing capacity.`,
    inputs: {
      market: plan.market.id,
      asset: plan.collateralToken.symbol,
      totalAmount: `${plan.totalCollateralAmount.toFixed(4)} ${plan.collateralToken.symbol}`,
    },
    expectedOutput: `Collateral position established at ${plan.market.lltv}% LLTV`,
    isInsideCallback: true,
    status: 'idle',
  });

  // Callback Step 3: Borrow
  steps.push({
    id: 'step-borrow',
    number: stepNum++,
    title: `Borrow ${plan.debtToken.symbol} Against Collateral`,
    contract: plan.market.protocol === 'morpho-blue' ? '0xBBBBBbbBBb9cC5e90e3b3Af64bdAF63C3799440d' : '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
    method: plan.market.protocol === 'morpho-blue' ? 'borrow(marketParams, assets, shares, onBehalfOf, receiver)' : 'borrow(asset, amount, interestRateMode, referralCode, onBehalfOf)',
    actionType: 'borrow',
    description: `Borrow exact flashloan repayment amount (${plan.totalDebtAmount.toFixed(2)} ${plan.debtToken.symbol}) against newly supplied collateral.`,
    inputs: {
      borrowToken: plan.debtToken.symbol,
      amount: `${plan.totalDebtAmount.toFixed(2)} ${plan.debtToken.symbol}`,
      healthFactorTarget: plan.healthFactor.toFixed(2),
    },
    expectedOutput: `${plan.totalDebtAmount.toFixed(2)} ${plan.debtToken.symbol} received in execution context`,
    isInsideCallback: true,
    status: 'idle',
  });

  // Callback Step 4: Repay Flashloan
  steps.push({
    id: 'step-repay',
    number: stepNum++,
    title: `Repay Flashloan to ${plan.flashloanProvider.name}`,
    contract: plan.flashloanProvider.contractAddress,
    method: 'transfer / auto-repay',
    actionType: 'repay',
    description: `Repay ${plan.flashloanAmount.toFixed(2)} ${plan.debtToken.symbol} ${plan.flashloanFee > 0 ? `+ ${plan.flashloanFee.toFixed(4)} fee` : '(0 fee)'}. Atomic loop finalized.`,
    inputs: {
      repayAmount: `${plan.totalDebtAmount.toFixed(2)} ${plan.debtToken.symbol}`,
      receiver: plan.flashloanProvider.contractAddress,
    },
    expectedOutput: 'Flashloan settled; position actively earning leveraged yield',
    isInsideCallback: true,
    status: 'idle',
  });

  return steps;
}

export function buildDeleverageExecutionSteps(plan: DeleveragePlan): ExecutionStep[] {
  const steps: ExecutionStep[] = [];
  let stepNum = 1;

  steps.push({
    id: 'del-step-flashloan',
    number: stepNum++,
    title: `Flashloan ${plan.debtToken.symbol} to Repay Debt`,
    contract: plan.flashloanProvider.contractAddress,
    method: 'flashLoan(receiver, tokens, amounts, userData)',
    actionType: 'flashloan',
    description: `Flashloan ${plan.debtToRepay.toFixed(2)} ${plan.debtToken.symbol} with 0 upfront capital to eliminate position debt.`,
    inputs: {
      amount: `${plan.debtToRepay.toFixed(2)} ${plan.debtToken.symbol}`,
      provider: plan.flashloanProvider.name,
    },
    expectedOutput: 'Flashloan funds available in callback',
    isInsideCallback: false,
    status: 'idle',
  });

  steps.push({
    id: 'del-step-repay-debt',
    number: stepNum++,
    title: `Repay Debt in ${plan.market.name}`,
    contract: plan.market.protocol === 'morpho-blue' ? '0xBBBBBbbBBb9cC5e90e3b3Af64bdAF63C3799440d' : '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
    method: 'repay(marketParams, assets, shares, onBehalfOf, data)',
    actionType: 'repay',
    description: `Pay off ${plan.debtToRepay.toFixed(2)} ${plan.debtToken.symbol} debt in the lending protocol, freeing collateral.`,
    inputs: {
      amount: `${plan.debtToRepay.toFixed(2)} ${plan.debtToken.symbol}`,
    },
    expectedOutput: 'Debt wiped / reduced; collateral unlocked for withdrawal',
    isInsideCallback: true,
    status: 'idle',
  });

  steps.push({
    id: 'del-step-withdraw-collateral',
    number: stepNum++,
    title: `Withdraw ${plan.collateralToken.symbol} Collateral`,
    contract: plan.market.protocol === 'morpho-blue' ? '0xBBBBBbbBBb9cC5e90e3b3Af64bdAF63C3799440d' : '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
    method: 'withdraw(marketParams, assets, shares, onBehalfOf, receiver)',
    actionType: 'deposit',
    description: `Withdraw ${plan.collateralToWithdraw.toFixed(4)} ${plan.collateralToken.symbol} from lending market into execution context.`,
    inputs: {
      amount: `${plan.collateralToWithdraw.toFixed(4)} ${plan.collateralToken.symbol}`,
    },
    expectedOutput: `+${plan.collateralToWithdraw.toFixed(4)} ${plan.collateralToken.symbol} available`,
    isInsideCallback: true,
    status: 'idle',
  });

  const delCoreContracts = ENSO_CORE_CONTRACTS[plan.market.chainId] || ENSO_CORE_CONTRACTS[1];
  steps.push({
    id: 'del-step-swap-repay-flash',
    number: stepNum++,
    title: `Swap Released ${plan.collateralToken.symbol} → ${plan.debtToken.symbol}`,
    contract: delCoreContracts.router,
    method: 'route(...)',
    actionType: 'swap',
    description: `Swap ${plan.collateralToSwap.toFixed(4)} ${plan.collateralToken.symbol} to get exact ${plan.debtToRepay.toFixed(2)} ${plan.debtToken.symbol} to settle the flashloan.`,
    inputs: {
      tokenIn: plan.collateralToken.symbol,
      tokenOut: plan.debtToken.symbol,
      amountToSwap: `${plan.collateralToSwap.toFixed(4)} ${plan.collateralToken.symbol}`,
    },
    expectedOutput: `${plan.debtToRepay.toFixed(2)} ${plan.debtToken.symbol} ready for flashloan repayment`,
    isInsideCallback: true,
    status: 'idle',
  });

  steps.push({
    id: 'del-step-payout',
    number: stepNum++,
    title: `Settle Flashloan & Return Pure Equity to Wallet`,
    contract: plan.flashloanProvider.contractAddress,
    method: 'transfer(user, netEquity)',
    actionType: 'transfer',
    description: `Flashloan repaid. Remaining net equity (${plan.netPayoutCollateral.toFixed(4)} ${plan.collateralToken.symbol} ≈ $${plan.netPayoutUsd.toLocaleString()}) sent directly to user's wallet!`,
    inputs: {
      recipient: 'User Wallet',
      payoutAmount: `${plan.netPayoutCollateral.toFixed(4)} ${plan.collateralToken.symbol}`,
    },
    expectedOutput: 'Position successfully unwound in 1 atomic tx with zero upfront capital',
    isInsideCallback: true,
    status: 'idle',
  });

  return steps;
}

export function generateEnsoTypeScriptSnippet(plan: LeveragePlan): string {
  const isMorpho = plan.market.protocol === 'morpho-blue';
  const isAave = plan.market.protocol === 'aave-v3';
  const isAlchemix = plan.market.protocol === 'alchemix-v3';

  return `/**
 * Enso Shortcuts Leverage Loop
 * Generated for: ${plan.market.name}
 * Flashloan Provider: ${plan.flashloanProvider.name} (${plan.flashloanProvider.id})
 * Adapter: ${plan.adapter}
 * 
 * Flow:
 * Initial ${plan.initialCapitalAmount} ${plan.collateralToken.symbol} 
 *  → Flashloan ${plan.flashloanAmount.toFixed(2)} ${plan.debtToken.symbol}
 *  → Swap ${plan.debtToken.symbol} to ${plan.collateralToken.symbol}
 *  → Deposit ${plan.totalCollateralAmount.toFixed(4)} ${plan.collateralToken.symbol}
 *  → Borrow ${plan.totalDebtAmount.toFixed(2)} ${plan.debtToken.symbol}
 *  → Repay Flashloan
 */

import { EnsoClient, BundleAction } from '@ensofinance/sdk';
import { parseUnits, parseEther } from 'viem';

export async function executeLeverageLoop() {
  const enso = new EnsoClient({
    apiKey: process.env.ENSO_API_KEY || 'public',
  });

  const userAddress = '0xYourWalletAddress';
  const collateralToken = '${plan.collateralToken.address}'; // ${plan.collateralToken.symbol}
  const debtToken = '${plan.debtToken.address}'; // ${plan.debtToken.symbol}

  // Amounts in base units
  const initialCapital = parseUnits('${plan.initialCapitalAmount}', ${plan.collateralToken.decimals});
  const flashloanAmount = parseUnits('${plan.flashloanAmount.toFixed(plan.debtToken.decimals > 6 ? 6 : plan.debtToken.decimals)}', ${plan.debtToken.decimals});

  // Construct atomic Enso Bundle
  const bundle = await enso.getBundleAction({
    chainId: ${plan.market.chainId},
    fromAddress: userAddress,
    receiver: userAddress,
    routingStrategy: '${plan.adapter === 'EnsoRouterFlashloanAdapter' ? 'router' : 'delegate'}',
    actions: [
      {
        protocol: '${plan.flashloanProvider.id}',
        action: 'flashloan',
        args: {
          flashloanToken: debtToken,
          flashloanAmount: flashloanAmount.toString(),
          tokenOut: collateralToken,
          primaryAddress: '${plan.flashloanProvider.contractAddress}',
          callback: [
            // 1. Swap flashloaned ${plan.debtToken.symbol} to ${plan.collateralToken.symbol}
            {
              protocol: 'enso',
              action: 'route',
              args: {
                tokenIn: debtToken,
                tokenOut: collateralToken,
                amountIn: flashloanAmount.toString(),
                slippage: '${Math.round(plan.slippageTolerancePercent * 100)}', // ${plan.slippageTolerancePercent}% in bps
              },
            },
            // 2. Deposit total collateral into ${isMorpho ? 'Morpho Market' : isAave ? 'Aave V3' : 'Alchemix V3'}
            {
              protocol: '${plan.market.protocol === 'morpho-blue' ? 'morpho-markets-v1' : plan.market.protocol}',
              action: 'deposit',
              args: {
                tokenIn: collateralToken,
                primaryAddress: '${plan.market.marketId || plan.market.id}',
                amountIn: {
                  // Dynamically references output of swap + initial capital
                  useOutputOfCallAt: 0,
                },
              },
            },
            // 3. Borrow ${plan.debtToken.symbol} to repay flashloan
            {
              protocol: '${plan.market.protocol === 'morpho-blue' ? 'morpho-markets-v1' : plan.market.protocol}',
              action: 'borrow',
              args: {
                tokenOut: debtToken,
                primaryAddress: '${plan.market.marketId || plan.market.id}',
                amountOut: flashloanAmount.toString(),
                receiver: userAddress,
              },
            },
            // 4. Repay flashloan provider
            {
              protocol: '${plan.flashloanProvider.id}',
              action: 'repay',
              args: {
                tokenIn: debtToken,
                amountIn: flashloanAmount.toString(),
                primaryAddress: '${plan.flashloanProvider.contractAddress}',
              },
            },
          ],
        },
      },
    ],
  });

  console.log('Enso Bundle Route Calldata:', bundle.tx);
  // Send transaction with ethers / viem:
  // await walletClient.sendTransaction({ to: bundle.tx.to, data: bundle.tx.data, value: bundle.tx.value });
  return bundle;
}
`;
}

export function generateWeirollCommands(plan: LeveragePlan): string[] {
  const coreContracts = ENSO_CORE_CONTRACTS[plan.market.chainId] || ENSO_CORE_CONTRACTS[1];
  return [
    `// 1. Flashloan Adapter Initializer`,
    `CALL ${plan.flashloanProvider.contractAddress}.flashLoan(`,
    `  receiver: ${coreContracts.routerFlashloanAdapter},`,
    `  tokens: [${plan.debtToken.address}],`,
    `  amounts: [${plan.flashloanAmount.toFixed(2)} * 10^${plan.debtToken.decimals}],`,
    `  userData: WEIROLL_EXECUTION_BYTECODE`,
    `)`,
    `// Inside Weiroll VM callback:`,
    `COMMAND 0x01: DELEGATECALL EnsoRouter.swapExactTokensForTokens(tokenIn, tokenOut, flashAmount)`,
    `COMMAND 0x02: CALL ${plan.market.protocol}.supply(collateral, userOutputs[0] + initialBalance)`,
    `COMMAND 0x03: CALL ${plan.market.protocol}.borrow(debtToken, ${plan.totalDebtAmount.toFixed(2)})`,
    `COMMAND 0x04: CALL ${plan.debtToken.address}.transfer(${plan.flashloanProvider.contractAddress}, flashAmount + fee)`,
  ];
}
