import React from 'react';
import { UserPosition } from '../types/enso';
import { SUPPORTED_CHAINS } from '../data/tokensAndMarkets';
import { ShieldCheck, AlertTriangle, ArrowRight, ExternalLink, RotateCcw, TrendingUp } from 'lucide-react';

interface ActivePositionsProps {
  positions: UserPosition[];
  onSelectPositionForDeleverage: (position: UserPosition) => void;
  onNavigateToRisk: () => void;
  onNavigateToLeverage: () => void;
}

export const ActivePositions: React.FC<ActivePositionsProps> = ({
  positions,
  onSelectPositionForDeleverage,
  onNavigateToRisk,
  onNavigateToLeverage,
}) => {
  if (positions.length === 0) {
    return (
      <div className="p-8 text-center bg-neutral-900/40 rounded-2xl border border-neutral-800 space-y-4">
        <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center mx-auto text-neutral-400">
          <RotateCcw className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-white">No Active Positions Yet</h3>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            Execute a live flashloan leverage loop on Polygon, Ethereum, or Arbitrum to establish an active position.
          </p>
        </div>
        <button
          onClick={onNavigateToLeverage}
          className="px-4 py-2 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-neutral-950 rounded-lg transition-colors"
        >
          Open First Position in Studio
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            My Active Leveraged Positions ({positions.length})
          </h2>
          <p className="text-xs text-neutral-400">
            Real-time positions established via Enso flashloan bundles
          </p>
        </div>

        <button
          onClick={onNavigateToRisk}
          className="text-xs font-mono text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          Run Risk Stress Test →
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {positions.map((pos) => {
          const chain = SUPPORTED_CHAINS.find((c) => c.id === pos.chainId) || SUPPORTED_CHAINS[0];
          const isSafe = pos.healthFactor >= 1.35;

          return (
            <div
              key={pos.id}
              className="p-5 bg-neutral-900/70 rounded-xl border border-neutral-800 space-y-4 hover:border-neutral-700 transition-all"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{pos.market.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-400 mt-1">
                    <span>[{chain.icon}] {chain.shortName}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-emerald-400">{pos.leverage.toFixed(1)}x Leverage</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-neutral-500 block font-mono">Net APY</span>
                  <span className="text-xs font-bold font-mono text-emerald-400 tabular-nums">
                    +{pos.netApy.toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* Collateral & Debt Stats */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 bg-neutral-950/70 rounded-lg border border-neutral-800/60">
                  <span className="text-neutral-500 block text-[10px]">Collateral</span>
                  <span className="text-white font-bold tabular-nums">
                    {pos.collateralAmount.toFixed(4)} {pos.market.collateralToken.symbol}
                  </span>
                  <span className="text-[10px] text-neutral-400 block tabular-nums">
                    ≈ ${pos.collateralUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </span>
                </div>

                <div className="p-2.5 bg-neutral-950/70 rounded-lg border border-neutral-800/60">
                  <span className="text-neutral-500 block text-[10px]">Debt</span>
                  <span className="text-amber-300 font-bold tabular-nums">
                    {pos.debtAmount.toLocaleString('en-US', { maximumFractionDigits: 1 })} {pos.market.debtToken.symbol}
                  </span>
                  <span className="text-[10px] text-neutral-400 block tabular-nums">
                    ≈ ${pos.debtUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>

              {/* Health Factor */}
              <div className="p-2.5 bg-neutral-950/90 rounded-lg border border-neutral-800/60 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  {isSafe ? (
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  <span className="text-neutral-300">Health Factor</span>
                </div>
                <span className={`font-bold tabular-nums ${isSafe ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {pos.healthFactor.toFixed(2)}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => onSelectPositionForDeleverage(pos)}
                  className="flex-1 py-2 px-3 text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3 h-3 text-emerald-400" />
                  <span>1-Click Deleverage</span>
                </button>

                <a
                  href={`${chain.explorer}/tx/${pos.txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 text-neutral-400 hover:text-white rounded-lg bg-neutral-900 border border-neutral-800 transition-colors"
                  title="View on block explorer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
