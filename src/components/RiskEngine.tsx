import React, { useState } from 'react';
import { LeveragePlan } from '../types/enso';
import { AlertTriangle, ShieldAlert, ShieldCheck, TrendingDown, ArrowRight } from 'lucide-react';

interface RiskEngineProps {
  plan: LeveragePlan;
  onNavigateToDeleverage: () => void;
}

export const RiskEngine: React.FC<RiskEngineProps> = ({ plan, onNavigateToDeleverage }) => {
  const [simulatedPriceDropPercent, setSimulatedPriceDropPercent] = useState<number>(0);

  const basePrice = plan.collateralToken.priceUsd;
  const stressedPrice = basePrice * (1 - simulatedPriceDropPercent / 100);

  const stressedCollateralUsd = plan.totalCollateralAmount * stressedPrice;
  const debtUsd = plan.totalDebtUsd;
  const lltvDecimal = plan.market.lltv / 100;

  const stressedHealthFactor = debtUsd > 0
    ? (stressedCollateralUsd * lltvDecimal) / debtUsd
    : 99.0;

  const isLiquidated = stressedHealthFactor < 1.0;
  const isDangerZone = stressedHealthFactor >= 1.0 && stressedHealthFactor < 1.15;
  const isWarningZone = stressedHealthFactor >= 1.15 && stressedHealthFactor < 1.4;
  const isSafeZone = stressedHealthFactor >= 1.4;

  // Calculate debt needed to repay to restore health factor to 1.4
  const targetSafeHealth = 1.4;
  const maxSafeDebtUsd = (stressedCollateralUsd * lltvDecimal) / targetSafeHealth;
  const requiredEmergencyDebtRepaymentUsd = Math.max(0, debtUsd - maxSafeDebtUsd);

  const dropSteps = [0, 5, 10, 15, 20, 25, 30, 40];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Market Stress Test & Risk Engine
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            Simulate adverse market price crashes on {plan.collateralToken.symbol} and model liquidation cascades.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
          <span>Liquidation LLTV: {plan.market.lltv}%</span>
          <span aria-hidden="true">·</span>
          <span>Liq Price: ${plan.liquidationPrice.toFixed(2)}</span>
        </div>
      </div>

      {/* Interactive Stress Slider */}
      <div className="bg-neutral-900/60 p-5 rounded-xl border border-neutral-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-white">
              Simulate {plan.collateralToken.symbol} Price Drawdown
            </span>
            <span className="text-xs text-neutral-400 block">
              Test how sudden market selloffs impact your collateral buffer
            </span>
          </div>

          <div className="text-right">
            <span className="text-xs text-neutral-400 font-mono block">Stressed Price:</span>
            <span className="text-lg font-bold font-mono text-white tabular-nums">
              ${stressedPrice.toFixed(2)}{' '}
              <span className="text-xs text-rose-400 font-mono">
                (-{simulatedPriceDropPercent}%)
              </span>
            </span>
          </div>
        </div>

        <input
          type="range"
          min="0"
          max="50"
          step="1"
          value={simulatedPriceDropPercent}
          onChange={(e) => setSimulatedPriceDropPercent(parseFloat(e.target.value))}
          className="w-full accent-rose-500 cursor-pointer"
        />

        {/* Quick Drop Buttons */}
        <div className="flex items-center justify-between gap-1">
          {dropSteps.map((pct) => (
            <button
              key={pct}
              onClick={() => setSimulatedPriceDropPercent(pct)}
              className={`px-3 py-1.5 text-xs font-mono rounded-md border transition-colors ${
                simulatedPriceDropPercent === pct
                  ? 'bg-rose-950/80 border-rose-600 text-rose-300 font-bold'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              -{pct}%
            </button>
          ))}
        </div>
      </div>

      {/* Stress Outcome Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="p-4 bg-neutral-900/60 rounded-xl border border-neutral-800 space-y-2">
          <span className="text-xs text-neutral-400">Stressed Health Factor</span>
          <div className="flex items-center justify-between">
            <span
              className={`text-2xl font-bold font-mono tabular-nums ${
                isLiquidated
                  ? 'text-rose-500'
                  : isDangerZone
                  ? 'text-rose-400'
                  : isWarningZone
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {stressedHealthFactor.toFixed(2)}
            </span>
            {isLiquidated && <ShieldAlert className="w-6 h-6 text-rose-500" />}
            {isDangerZone && <AlertTriangle className="w-6 h-6 text-rose-400" />}
            {isWarningZone && <AlertTriangle className="w-6 h-6 text-amber-400" />}
            {isSafeZone && <ShieldCheck className="w-6 h-6 text-emerald-400" />}
          </div>
          <span className="text-[11px] font-mono text-neutral-400 block">
            {isLiquidated
              ? 'LIQUIDATED! Debt exceeds safe collateral capacity.'
              : isDangerZone
              ? 'CRITICAL DANGER: High risk of bot liquidation.'
              : isWarningZone
              ? 'WARNING: Margin buffer shrinking.'
              : 'HEALTHY: Sufficient cushion against liquidation.'}
          </span>
        </div>

        <div className="p-4 bg-neutral-900/60 rounded-xl border border-neutral-800 space-y-2">
          <span className="text-xs text-neutral-400">Collateral Value Delta</span>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">
            ${stressedCollateralUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </div>
          <span className="text-[11px] font-mono text-rose-400 tabular-nums">
            -${(plan.totalCollateralUsd - stressedCollateralUsd).toLocaleString('en-US', { maximumFractionDigits: 0 })} USD loss
          </span>
        </div>

        <div className="p-4 bg-neutral-900/60 rounded-xl border border-neutral-800 space-y-2">
          <span className="text-xs text-neutral-400">Emergency Deleverage Needed</span>
          <div className="text-2xl font-bold font-mono text-amber-300 tabular-nums">
            ${requiredEmergencyDebtRepaymentUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </div>
          <span className="text-[11px] font-mono text-neutral-400 block">
            To restore Health Factor to safe 1.40
          </span>
        </div>
      </div>

      {/* Sensitivity Matrix Table */}
      <div className="bg-neutral-900/40 rounded-xl border border-neutral-800 overflow-hidden">
        <div className="px-5 py-3 border-b border-neutral-800">
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
            Price Sensitivity & Liquidation Matrix
          </h3>
        </div>

        <table className="w-full text-xs font-mono text-left">
          <thead className="bg-neutral-950/60 text-neutral-400 border-b border-neutral-800">
            <tr>
              <th className="py-2.5 px-4 font-medium">{plan.collateralToken.symbol} Price</th>
              <th className="py-2.5 px-4 font-medium">Drawdown</th>
              <th className="py-2.5 px-4 font-medium">Collateral Value</th>
              <th className="py-2.5 px-4 font-medium">Health Factor</th>
              <th className="py-2.5 px-4 font-medium text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
            {[0, 10, 20, 25, 30, 35, 40].map((drop) => {
              const p = basePrice * (1 - drop / 100);
              const colUsd = plan.totalCollateralAmount * p;
              const hf = (colUsd * lltvDecimal) / debtUsd;
              const isLiq = hf < 1.0;
              return (
                <tr key={drop} className="hover:bg-neutral-800/40 transition-colors">
                  <td className="py-2.5 px-4 font-bold text-white tabular-nums">${p.toFixed(2)}</td>
                  <td className="py-2.5 px-4 tabular-nums text-neutral-400">-{drop}%</td>
                  <td className="py-2.5 px-4 tabular-nums">${colUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                  <td className="py-2.5 px-4 font-bold tabular-nums">
                    <span className={isLiq ? 'text-rose-500' : hf < 1.2 ? 'text-amber-400' : 'text-emerald-400'}>
                      {hf.toFixed(2)}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    {isLiq ? (
                      <span className="text-rose-400 font-bold">LIQUIDATION</span>
                    ) : hf < 1.2 ? (
                      <span className="text-amber-400">HIGH RISK</span>
                    ) : (
                      <span className="text-emerald-400">SOLVENT</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Emergency trigger CTA */}
      {requiredEmergencyDebtRepaymentUsd > 0 && (
        <div className="p-4 bg-amber-950/40 border border-amber-800/60 rounded-xl flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              Under-collateralization Alert
            </span>
            <p className="text-xs text-neutral-300">
              In this scenario, execute an Enso atomic deleverage bundle to repay debt and withdraw collateral in 1 transaction without needing upfront capital.
            </p>
          </div>

          <button
            onClick={onNavigateToDeleverage}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-amber-400 hover:bg-amber-300 text-neutral-950 rounded-lg whitespace-nowrap shrink-0 transition-colors"
          >
            <span>Open Deleverage Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
