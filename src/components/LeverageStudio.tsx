import React from 'react';
import {
  FlashloanAdapterType,
  FlashloanProvider,
  LendingMarket,
  LeveragePlan,
  OfficialPreset,
  Token,
} from '../types/enso';
import { FLASHLOAN_PROVIDERS, LENDING_MARKETS, TOKENS } from '../data/tokensAndMarkets';
import { OFFICIAL_PRESETS } from '../data/officialPresets';
import { ArrowRight, Sliders, ShieldCheck, AlertTriangle, Play, Code2, Sparkles, CheckCircle2, Zap } from 'lucide-react';

interface LeverageStudioProps {
  plan: LeveragePlan;
  setPlanParams: (updater: (prev: LeveragePlan) => LeveragePlan) => void;
  onApplyPreset: (preset: OfficialPreset) => void;
  onOpenVisualizer: () => void;
  onOpenCode: () => void;
  onSimulate: () => void;
  onExecuteDirect: () => void;
  isExecutingDirect: boolean;
}

export const LeverageStudio: React.FC<LeverageStudioProps> = ({
  plan,
  setPlanParams,
  onApplyPreset,
  onOpenVisualizer,
  onOpenCode,
  onSimulate,
  onExecuteDirect,
  isExecutingDirect,
}) => {
  const currentPreset = OFFICIAL_PRESETS.find(
    (p) =>
      p.flashloanProvider === plan.flashloanProvider.id &&
      p.collateralSymbol === plan.collateralToken.symbol &&
      p.debtSymbol === plan.debtToken.symbol
  );

  const isHealthSafe = plan.healthFactor >= 1.4;
  const isHealthWarning = plan.healthFactor < 1.4 && plan.healthFactor >= 1.15;
  const isHealthDangerous = plan.healthFactor < 1.15;

  return (
    <div className="space-y-6">
      {/* Editorial Header & Presets Strip */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Flashloan Leverage Studio
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            Open atomic looping positions with 0 upfront flashloan fees powered by Enso Shortcuts & Adapters.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono">
          <span>Enso Route Aggregator</span>
          <span aria-hidden="true">·</span>
          <span>Weiroll VM V2</span>
          <span aria-hidden="true">·</span>
          <span>Atomic 1-Tx Execution</span>
        </div>
      </div>

      {/* Official Enso Examples Presets */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
            Official Enso Flashloan Templates
          </span>
          <span className="text-xs text-neutral-400">
            From enso-dapp-template & shortcuts-ui-examples
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {OFFICIAL_PRESETS.map((preset) => {
            const isSelected = currentPreset?.id === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => onApplyPreset(preset)}
                className={`text-left p-3.5 rounded-lg border transition-all relative ${
                  isSelected
                    ? 'bg-neutral-900 border-emerald-500 shadow-sm'
                    : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-bold text-white tracking-tight">
                    {preset.title}
                  </span>
                  {isSelected && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                </div>
                <div className="mt-1 text-[11px] text-neutral-400 line-clamp-1">
                  {preset.subtitle}
                </div>
                <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-neutral-400 font-mono">
                  <span>{preset.protocol}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-emerald-400">{preset.defaultLeverage}x default</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main 2-Column Split: Configurator & Real-time Live Position Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Configurator (7 Cols) */}
        <div className="lg:col-span-7 space-y-5 bg-neutral-900/40 p-5 rounded-xl border border-neutral-800">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-semibold text-white">Strategy Parameters</h2>
            </div>
            <span className="text-xs font-mono text-neutral-400">
              Protocol: {plan.market.protocol.toUpperCase()}
            </span>
          </div>

          {/* Market & Pair Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-neutral-300">
                Target Lending Market & Liquidation LTV
              </label>
              <span className="text-[11px] font-mono text-emerald-400">
                Chain ID: {plan.market.chainId}
              </span>
            </div>
            <select
              value={plan.market.id}
              onChange={(e) => {
                const selected = LENDING_MARKETS.find((m) => m.id === e.target.value);
                if (selected) {
                  setPlanParams((prev) => ({
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
                    {m.name} — LLTV: {m.lltv}% | Supply: {m.collateralSupplyApy}% | Borrow: {m.debtBorrowApy}%
                  </option>
                ))}
              </optgroup>
              <optgroup label="Ethereum Mainnet (Chain ID 1)">
                {LENDING_MARKETS.filter((m) => m.chainId === 1).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} — LLTV: {m.lltv}% | Supply: {m.collateralSupplyApy}% | Borrow: {m.debtBorrowApy}%
                  </option>
                ))}
              </optgroup>
              <optgroup label="Arbitrum One (Chain ID 42161)">
                {LENDING_MARKETS.filter((m) => m.chainId === 42161).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} — LLTV: {m.lltv}% | Supply: {m.collateralSupplyApy}% | Borrow: {m.debtBorrowApy}%
                  </option>
                ))}
              </optgroup>
              <optgroup label="Base (Chain ID 8453)">
                {LENDING_MARKETS.filter((m) => m.chainId === 8453).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} — LLTV: {m.lltv}% | Supply: {m.collateralSupplyApy}% | Borrow: {m.debtBorrowApy}%
                  </option>
                ))}
              </optgroup>
              <optgroup label="Optimism (Chain ID 10)">
                {LENDING_MARKETS.filter((m) => m.chainId === 10).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} — LLTV: {m.lltv}% | Supply: {m.collateralSupplyApy}% | Borrow: {m.debtBorrowApy}%
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Flashloan Provider & Adapter Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-300">
                Flashloan Source Protocol
              </label>
              <select
                value={plan.flashloanProvider.id}
                onChange={(e) => {
                  const p = FLASHLOAN_PROVIDERS.find((fp) => fp.id === e.target.value);
                  if (p) setPlanParams((prev) => ({ ...prev, flashloanProvider: p }));
                }}
                className="w-full px-3 py-2 text-xs bg-neutral-900 border border-neutral-800 rounded-lg text-white font-mono focus:outline-none focus:border-emerald-500"
              >
                {FLASHLOAN_PROVIDERS.map((fp) => (
                  <option key={fp.id} value={fp.id}>
                    {fp.name} ({fp.feePercent}% Fee)
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-neutral-400 block">
                {plan.flashloanProvider.description}
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-300">
                Enso Flashloan Adapter Contract
              </label>
              <select
                value={plan.adapter}
                onChange={(e) =>
                  setPlanParams((prev) => ({
                    ...prev,
                    adapter: e.target.value as FlashloanAdapterType,
                  }))
                }
                className="w-full px-3 py-2 text-xs bg-neutral-900 border border-neutral-800 rounded-lg text-white font-mono focus:outline-none focus:border-emerald-500"
              >
                <option value="EnsoRouterFlashloanAdapter">EnsoRouterFlashloanAdapter (Universal)</option>
                <option value="EnsoWalletFlashloanAdapter">EnsoWalletFlashloanAdapter (Smart Account)</option>
                <option value="EnsoSafeFlashloanAdapter">EnsoSafeFlashloanAdapter (Gnosis Safe)</option>
              </select>
              <span className="text-[11px] text-neutral-400 block">
                Official adapter contract from enso-shortcuts-contracts
              </span>
            </div>
          </div>

          {/* Initial Capital Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-neutral-300">
                Initial Capital ({plan.collateralToken.symbol})
              </label>
              <span className="text-xs text-neutral-400 font-mono tabular-nums">
                ≈ ${(plan.initialCapitalAmount * plan.collateralToken.priceUsd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  min="0.01"
                  step="0.1"
                  value={plan.initialCapitalAmount}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setPlanParams((prev) => ({ ...prev, initialCapitalAmount: val }));
                  }}
                  className="w-full px-3.5 py-2.5 text-base font-mono tabular-nums bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                />
                <span className="absolute right-3 top-3 text-xs font-mono text-neutral-400">
                  {plan.collateralToken.symbol}
                </span>
              </div>

              {/* Quick % chips */}
              <div className="flex items-center gap-1">
                {[0.5, 1.0, 2.5, 5.0].map((amt) => (
                  <button
                    key={amt}
                    onClick={() =>
                      setPlanParams((prev) => ({ ...prev, initialCapitalAmount: amt }))
                    }
                    className="px-2.5 py-2.5 text-xs font-mono bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-neutral-300 transition-colors"
                  >
                    {amt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Leverage Multiplier Slider */}
          <div className="space-y-2 pt-2 border-t border-neutral-800/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-neutral-200">
                  Target Leverage Multiplier
                </label>
                <span className="text-[11px] text-neutral-400">
                  (Max safe: {plan.market.maxLeverage}x)
                </span>
              </div>
              <div className="text-base font-bold font-mono text-emerald-400 tabular-nums">
                {plan.leverage.toFixed(2)}x
              </div>
            </div>

            <input
              type="range"
              min="1.1"
              max={plan.market.maxLeverage}
              step="0.05"
              value={plan.leverage}
              onChange={(e) => {
                const lev = parseFloat(e.target.value);
                setPlanParams((prev) => ({ ...prev, leverage: lev }));
              }}
              className="w-full accent-emerald-500 cursor-pointer"
            />

            <div className="flex justify-between text-[11px] font-mono text-neutral-400">
              <span>1.1x (Mild)</span>
              <span>2.5x (Optimal)</span>
              <span>4.0x (Aggressive)</span>
              <span>{plan.market.maxLeverage}x (Max)</span>
            </div>
          </div>

          {/* Slippage & Gas info */}
          <div className="pt-2 flex items-center justify-between text-xs text-neutral-400 border-t border-neutral-800">
            <div className="flex items-center gap-2">
              <span>Max Swap Slippage:</span>
              <button
                onClick={() =>
                  setPlanParams((prev) => ({
                    ...prev,
                    slippageTolerancePercent: prev.slippageTolerancePercent === 0.3 ? 0.5 : 0.3,
                  }))
                }
                className="font-mono text-neutral-200 hover:text-emerald-400 underline decoration-dotted"
              >
                {plan.slippageTolerancePercent}%
              </button>
            </div>
            <div className="font-mono tabular-nums">
              Est. Gas: ~{plan.estimatedGasUnits.toLocaleString()} units (~${plan.estimatedGasCostUsd.toFixed(2)})
            </div>
          </div>
        </div>

        {/* Right Column: Real-time Position & Risk Monitor (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-neutral-900/60 p-5 rounded-xl border border-neutral-800 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-sm font-semibold text-white">Position Preview</h3>
              <div className="flex items-center gap-1.5 text-xs font-mono">
                <span className="text-neutral-400">Net APY:</span>
                <span className={`font-bold tabular-nums ${plan.netApy >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {plan.netApy > 0 ? `+${plan.netApy.toFixed(2)}%` : `${plan.netApy.toFixed(2)}%`}
                </span>
              </div>
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-neutral-950/60 rounded-lg border border-neutral-800/80">
                <span className="text-neutral-400 block text-[11px]">Total Collateral</span>
                <span className="text-sm font-bold font-mono text-white tabular-nums block mt-0.5">
                  {plan.totalCollateralAmount.toFixed(4)} {plan.collateralToken.symbol}
                </span>
                <span className="text-[11px] font-mono text-neutral-400 tabular-nums">
                  ≈ ${plan.totalCollateralUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </span>
              </div>

              <div className="p-3 bg-neutral-950/60 rounded-lg border border-neutral-800/80">
                <span className="text-neutral-400 block text-[11px]">Flashloan & Debt</span>
                <span className="text-sm font-bold font-mono text-amber-300 tabular-nums block mt-0.5">
                  {plan.totalDebtAmount.toLocaleString('en-US', { maximumFractionDigits: 2 })} {plan.debtToken.symbol}
                </span>
                <span className="text-[11px] font-mono text-neutral-400 tabular-nums">
                  ≈ ${plan.totalDebtUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>

            {/* Health Factor & Risk Gauge */}
            <div className="p-3.5 bg-neutral-950/80 rounded-lg border border-neutral-800/80 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  {isHealthSafe && <ShieldCheck className="w-4 h-4 text-emerald-400" />}
                  {isHealthWarning && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                  {isHealthDangerous && <AlertTriangle className="w-4 h-4 text-rose-500" />}
                  <span className="font-medium text-neutral-200">Health Factor</span>
                </div>
                <span
                  className={`font-mono font-bold text-sm tabular-nums ${
                    isHealthSafe
                      ? 'text-emerald-400'
                      : isHealthWarning
                      ? 'text-amber-400'
                      : 'text-rose-500'
                  }`}
                >
                  {plan.healthFactor.toFixed(2)}
                </span>
              </div>

              {/* Visual Health Bar */}
              <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    isHealthSafe
                      ? 'bg-emerald-500'
                      : isHealthWarning
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{
                    width: `${Math.min(100, Math.max(10, ((plan.healthFactor - 1) / 1.5) * 100))}%`,
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] font-mono">
                <div>
                  <span className="text-neutral-400 block">Liquidation Price:</span>
                  <span className="text-white font-bold tabular-nums">
                    ${plan.liquidationPrice.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-400 block">Buffer to Liq:</span>
                  <span
                    className={`font-bold tabular-nums ${
                      plan.bufferToLiquidation > 20
                        ? 'text-emerald-400'
                        : plan.bufferToLiquidation > 10
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}
                  >
                    -{plan.bufferToLiquidation.toFixed(1)}% drop
                  </span>
                </div>
              </div>
            </div>

            {/* Loop Flow Summary Checklist */}
            <div className="space-y-1.5 text-xs text-neutral-400 border-t border-neutral-800 pt-3">
              <div className="text-[11px] uppercase tracking-wider font-semibold text-neutral-300 mb-1">
                Atomic Execution Sequence
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Flashloan {plan.flashloanAmount.toFixed(2)} {plan.debtToken.symbol} from {plan.flashloanProvider.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Swap to {plan.collateralToken.symbol} via Enso Route aggregator</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Deposit full {plan.totalCollateralAmount.toFixed(4)} {plan.collateralToken.symbol} into {plan.market.protocol.toUpperCase()}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Borrow {plan.totalDebtAmount.toFixed(2)} {plan.debtToken.symbol} & repay flashloan</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={onExecuteDirect}
                disabled={isExecutingDirect}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-neutral-950 rounded-xl transition-all shadow-md shadow-emerald-500/10 cursor-pointer disabled:opacity-50"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>{isExecutingDirect ? 'Submitting On-Chain...' : 'Direct Execute (On-Chain)'}</span>
              </button>

              <button
                onClick={onSimulate}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 rounded-lg transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current text-emerald-400" />
                <span>Simulate Fork Execution</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={onOpenVisualizer}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-neutral-300 transition-colors"
                >
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Inspect Call Tree</span>
                </button>

                <button
                  onClick={onOpenCode}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-neutral-300 transition-colors"
                >
                  <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Export Enso Code</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
