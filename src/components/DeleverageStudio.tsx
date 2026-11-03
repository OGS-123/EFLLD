import React, { useState } from 'react';
import { DeleveragePlan, FlashloanAdapterType, LendingMarket } from '../types/enso';
import { FLASHLOAN_PROVIDERS, LENDING_MARKETS } from '../data/tokensAndMarkets';
import { ArrowDownLeft, Shield, AlertCircle, Play, CheckCircle2, RotateCcw, Zap } from 'lucide-react';

interface DeleverageStudioProps {
  plan: DeleveragePlan;
  setDeleverageParams: (updater: (prev: DeleveragePlan) => DeleveragePlan) => void;
  onSimulateDeleverage: () => void;
  onOpenVisualizer: () => void;
  onExecuteDeleverageDirect: () => void;
  isExecutingDirect: boolean;
}

export const DeleverageStudio: React.FC<DeleverageStudioProps> = ({
  plan,
  setDeleverageParams,
  onSimulateDeleverage,
  onOpenVisualizer,
  onExecuteDeleverageDirect,
  isExecutingDirect,
}) => {
  // Preset positions for easy testing
  const samplePositions = [
    {
      title: 'Morpho Blue 3.2x WETH / USDC',
      marketId: 'morpho-weth-usdc-86',
      collateral: 3.2,
      debt: 5350,
      protocol: 'morpho-blue',
    },
    {
      title: 'Aave V3 Polygon · WETH / USDC',
      marketId: 'aave-polygon-weth-usdc',
      collateral: 2.5,
      debt: 4200,
      protocol: 'aave-v3',
    },
    {
      title: 'Aave V3 wstETH / ETH (eMode 5.0x)',
      marketId: 'aave-wsteth-eth-emode',
      collateral: 5.0,
      debt: 4.1,
      protocol: 'aave-v3',
    },
    {
      title: 'Alchemix V3 alUSD Yield Position',
      marketId: 'alchemix-alusd-morpho',
      collateral: 8000,
      debt: 5500,
      protocol: 'alchemix-v3',
    },
  ];

  const handleSelectSample = (sample: (typeof samplePositions)[0]) => {
    const market = LENDING_MARKETS.find((m) => m.id === sample.marketId) || LENDING_MARKETS[0];
    setDeleverageParams((prev) => ({
      ...prev,
      market,
      collateralToken: market.collateralToken,
      debtToken: market.debtToken,
      currentCollateralAmount: sample.collateral,
      currentDebtAmount: sample.debt,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Title banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Atomic Deleverage & Exit Engine
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            Unwind or de-risk leveraged debt positions in 1 atomic transaction with 0 upfront capital using Enso reverse flashloan bundles.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono">
          <span>Flashloan Collateral / Debt</span>
          <span aria-hidden="true">→</span>
          <span>Repay Market</span>
          <span aria-hidden="true">→</span>
          <span>Free Collateral</span>
          <span aria-hidden="true">→</span>
          <span>Swap & Payout</span>
        </div>
      </div>

      {/* Preset Positions quick picker */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
            Select Live or Sample Leveraged Position to Unwind
          </span>
          <span className="text-xs text-neutral-400">
            Or manually edit existing collateral and debt
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {samplePositions.map((sample, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectSample(sample)}
              className="text-left p-3.5 rounded-lg border border-neutral-800 bg-neutral-900/60 hover:bg-neutral-900 hover:border-neutral-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{sample.title}</span>
                <RotateCcw className="w-3.5 h-3.5 text-neutral-400" />
              </div>
              <div className="mt-2 text-xs font-mono text-neutral-300 flex items-center gap-2">
                <span>{sample.collateral} Collateral</span>
                <span aria-hidden="true">·</span>
                <span className="text-amber-300">{sample.debt} Debt</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Configurator (7 Cols) */}
        <div className="lg:col-span-7 space-y-5 bg-neutral-900/40 p-5 rounded-xl border border-neutral-800">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <h2 className="text-sm font-semibold text-white">Current Position Data</h2>
            <span className="text-xs font-mono text-neutral-400">
              Health Before: {plan.healthFactorBefore.toFixed(2)}
            </span>
          </div>

          {/* Market */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-300">
              Lending Protocol Market
            </label>
            <select
              value={plan.market.id}
              onChange={(e) => {
                const selected = LENDING_MARKETS.find((m) => m.id === e.target.value);
                if (selected) {
                  setDeleverageParams((prev) => ({
                    ...prev,
                    market: selected,
                    collateralToken: selected.collateralToken,
                    debtToken: selected.debtToken,
                  }));
                }
              }}
              className="w-full px-3.5 py-2.5 text-xs bg-neutral-900 border border-neutral-800 rounded-lg text-white font-mono focus:outline-none focus:border-emerald-500"
            >
              <optgroup label="Polygon PoS (Chain ID 137)">
                {LENDING_MARKETS.filter((m) => m.chainId === 137).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Ethereum Mainnet (Chain ID 1)">
                {LENDING_MARKETS.filter((m) => m.chainId === 1).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Arbitrum One (Chain ID 42161)">
                {LENDING_MARKETS.filter((m) => m.chainId === 42161).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Base (Chain ID 8453)">
                {LENDING_MARKETS.filter((m) => m.chainId === 8453).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Optimism (Chain ID 10)">
                {LENDING_MARKETS.filter((m) => m.chainId === 10).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Current Collateral and Current Debt Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-300">
                Current Locked Collateral ({plan.collateralToken.symbol})
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0.01"
                  value={plan.currentCollateralAmount}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setDeleverageParams((prev) => ({
                      ...prev,
                      currentCollateralAmount: val,
                    }));
                  }}
                  className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                />
                <span className="absolute right-3 top-2.5 text-xs font-mono text-neutral-400">
                  {plan.collateralToken.symbol}
                </span>
              </div>
              <span className="text-[11px] font-mono text-neutral-400">
                ≈ ${(plan.currentCollateralAmount * plan.collateralToken.priceUsd).toLocaleString()} USD
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-300">
                Current Outstanding Debt ({plan.debtToken.symbol})
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="10"
                  min="0"
                  value={plan.currentDebtAmount}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setDeleverageParams((prev) => ({
                      ...prev,
                      currentDebtAmount: val,
                    }));
                  }}
                  className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                />
                <span className="absolute right-3 top-2.5 text-xs font-mono text-neutral-400">
                  {plan.debtToken.symbol}
                </span>
              </div>
              <span className="text-[11px] font-mono text-neutral-400">
                ≈ ${(plan.currentDebtAmount * plan.debtToken.priceUsd).toLocaleString()} USD
              </span>
            </div>
          </div>

          {/* Unwind Target Selection */}
          <div className="space-y-3 pt-3 border-t border-neutral-800">
            <label className="text-xs font-semibold text-neutral-200">
              Deleverage Action Type
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() =>
                  setDeleverageParams((prev) => ({ ...prev, unwindType: 'full', targetLtvPercent: 0 }))
                }
                className={`p-3.5 text-left rounded-lg border transition-all ${
                  plan.unwindType === 'full'
                    ? 'bg-neutral-900 border-emerald-500 text-white'
                    : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Full Emergency Exit (100%)</span>
                  {plan.unwindType === 'full' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                </div>
                <p className="mt-1 text-[11px] text-neutral-400">
                  Repay 100% of debt, close position entirely, and transfer all net profit back to your wallet.
                </p>
              </button>

              <button
                onClick={() =>
                  setDeleverageParams((prev) => ({
                    ...prev,
                    unwindType: 'partial',
                    targetLtvPercent: 50,
                  }))
                }
                className={`p-3.5 text-left rounded-lg border transition-all ${
                  plan.unwindType === 'partial'
                    ? 'bg-neutral-900 border-emerald-500 text-white'
                    : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Partial De-Risk to Safe LTV</span>
                  {plan.unwindType === 'partial' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                </div>
                <p className="mt-1 text-[11px] text-neutral-400">
                  Reduce debt down to 50% LTV to prevent liquidation while keeping leveraged upside active.
                </p>
              </button>
            </div>
          </div>

          {/* Flashloan provider for deleverage */}
          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-medium text-neutral-300">
              Flashloan Provider for Deleverage
            </label>
            <select
              value={plan.flashloanProvider.id}
              onChange={(e) => {
                const p = FLASHLOAN_PROVIDERS.find((fp) => fp.id === e.target.value);
                if (p) setDeleverageParams((prev) => ({ ...prev, flashloanProvider: p }));
              }}
              className="w-full px-3 py-2 text-xs bg-neutral-900 border border-neutral-800 rounded-lg text-white font-mono focus:outline-none focus:border-emerald-500"
            >
              {FLASHLOAN_PROVIDERS.map((fp) => (
                <option key={fp.id} value={fp.id}>
                  {fp.name} ({fp.feePercent}% Fee)
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons in Left Panel */}
          <div className="pt-3 border-t border-neutral-800 space-y-2">
            <button
              onClick={onSimulateDeleverage}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white rounded-lg transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current text-emerald-400" />
              <span>Simulate Atomic Deleverage</span>
            </button>

            <button
              onClick={onExecuteDeleverageDirect}
              disabled={isExecutingDirect}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-neutral-950 rounded-xl transition-all shadow-md shadow-emerald-500/10 cursor-pointer disabled:opacity-50"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>{isExecutingDirect ? 'Submitting Deleverage...' : 'Direct Execute Deleverage (On-Chain)'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Execution Output & Net Payout (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-neutral-900/60 p-5 rounded-xl border border-neutral-800 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-sm font-semibold text-white">Net Equity Payout</h3>
              <span className="text-xs font-mono text-emerald-400">Zero Upfront Cash Needed</span>
            </div>

            {/* Net Payout Callout */}
            <div className="p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-xl space-y-1 text-center">
              <span className="text-xs font-medium text-emerald-300">
                Net Profit Returned to User Wallet
              </span>
              <div className="text-2xl font-bold font-mono text-white tabular-nums">
                +{plan.netPayoutCollateral.toFixed(4)} {plan.collateralToken.symbol}
              </div>
              <div className="text-xs font-mono text-emerald-400 tabular-nums">
                ≈ ${plan.netPayoutUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
              </div>
            </div>

            {/* Mathematical Breakdown */}
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1.5 border-b border-neutral-800/80">
                <span className="text-neutral-400">Flashloan Debt Repaid:</span>
                <span className="text-white tabular-nums">
                  -{plan.debtToRepay.toFixed(2)} {plan.debtToken.symbol}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-neutral-800/80">
                <span className="text-neutral-400">Collateral Released:</span>
                <span className="text-white tabular-nums">
                  {plan.collateralToWithdraw.toFixed(4)} {plan.collateralToken.symbol}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-neutral-800/80">
                <span className="text-neutral-400">Swapped to Repay Flashloan:</span>
                <span className="text-amber-300 tabular-nums">
                  -{plan.collateralToSwap.toFixed(4)} {plan.collateralToken.symbol}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-neutral-800/80">
                <span className="text-neutral-400">Health Factor Delta:</span>
                <span className="text-emerald-400 font-bold tabular-nums">
                  {plan.healthFactorBefore.toFixed(2)} → {plan.unwindType === 'full' ? 'SAFE (Closed)' : plan.healthFactorAfter.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Atomic Sequence */}
            <div className="space-y-1.5 text-xs text-neutral-400 border-t border-neutral-800 pt-3">
              <div className="text-[11px] uppercase tracking-wider font-semibold text-neutral-300 mb-1">
                Deleverage Callback Workflow
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>1. Flashloan {plan.debtToRepay.toFixed(2)} {plan.debtToken.symbol} from {plan.flashloanProvider.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>2. Repay debt on {plan.market.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>3. Withdraw unlocked {plan.collateralToken.symbol} collateral</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>4. Swap {plan.collateralToSwap.toFixed(4)} {plan.collateralToken.symbol} to repay flashloan</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>5. Transfer remaining {plan.netPayoutCollateral.toFixed(4)} {plan.collateralToken.symbol} profit to wallet</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={onSimulateDeleverage}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white rounded-lg transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current text-emerald-400" />
                <span>Simulate Atomic Deleverage</span>
              </button>

              <button
                onClick={onExecuteDeleverageDirect}
                disabled={isExecutingDirect}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-neutral-950 rounded-xl transition-all shadow-md shadow-emerald-500/10 cursor-pointer disabled:opacity-50"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>{isExecutingDirect ? 'Submitting Deleverage...' : 'Direct Execute Deleverage (On-Chain)'}</span>
              </button>

              <button
                onClick={onOpenVisualizer}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-neutral-300 transition-colors"
              >
                <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
                <span>Inspect Deleverage Call Tree</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
