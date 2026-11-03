import React, { useState } from 'react';
import { LeveragePlan } from '../types/enso';
import { Zap, ArrowDown, ExternalLink, Copy, Check, Settings2 } from 'lucide-react';

interface ShortcutsWidgetProps {
  plan: LeveragePlan;
  onExecute: () => void;
  isExecuting: boolean;
}

export const ShortcutsWidget: React.FC<ShortcutsWidgetProps> = ({
  plan,
  onExecute,
  isExecuting,
}) => {
  const [embedCopied, setEmbedCopied] = useState(false);

  const embedSnippet = `<ShortcutsWidget
  apiKey="YOUR_ENSO_KEY"
  chainId={${plan.market.chainId}}
  targetPosition={{
    protocol: "${plan.market.protocol}",
    marketId: "${plan.market.marketId || plan.market.id}",
    collateralToken: "${plan.collateralToken.address}",
    debtToken: "${plan.debtToken.address}",
    targetLeverage: ${plan.leverage},
  }}
  onSuccess={(txHash) => console.log('Leverage opened:', txHash)}
/>`;

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedSnippet);
    setEmbedCopied(true);
    setTimeout(() => setEmbedCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Title */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Enso Shortcuts Widget Preview
        </h1>
        <p className="text-sm text-neutral-400">
          Embeddable 1-click leverage and looping entry widget from @ensofinance/shortcuts-widget.
        </p>
      </div>

      {/* Widget Container Mockup */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        {/* Widget Top Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Enso 1-Click Leverage</span>
              <span className="text-[10px] text-neutral-400">Powered by Enso Shortcuts</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded">
              {plan.leverage.toFixed(1)}x Leverage
            </span>
            <Settings2 className="w-4 h-4 text-neutral-400 cursor-pointer hover:text-white" />
          </div>
        </div>

        {/* Input Card */}
        <div className="mt-4 p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2">
          <div className="flex justify-between text-xs text-neutral-400">
            <span>You Supply (Initial Capital)</span>
            <span>Balance: 4.82 {plan.collateralToken.symbol}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">
              {plan.initialCapitalAmount.toFixed(2)}
            </span>
            <div className="flex items-center gap-2 bg-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-800">
              <span className="text-xs font-bold text-white">{plan.collateralToken.symbol}</span>
            </div>
          </div>

          <div className="text-[11px] font-mono text-neutral-400">
            ≈ ${(plan.initialCapitalAmount * plan.collateralToken.priceUsd).toLocaleString()} USD
          </div>
        </div>

        {/* Arrow Divider */}
        <div className="flex justify-center -my-2.5 relative z-10">
          <div className="w-7 h-7 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-300">
            <ArrowDown className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Output Position Card */}
        <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2">
          <div className="flex justify-between text-xs text-neutral-400">
            <span>Resulting Leveraged Position</span>
            <span className="text-emerald-400 font-mono">Net APY: +{plan.netApy.toFixed(2)}%</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
              {plan.totalCollateralAmount.toFixed(4)}
            </span>
            <div className="flex items-center gap-2 bg-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-800">
              <span className="text-xs font-bold text-white">{plan.collateralToken.symbol} Collateral</span>
            </div>
          </div>

          <div className="flex justify-between text-[11px] font-mono text-neutral-400">
            <span>Debt: {plan.totalDebtAmount.toFixed(2)} {plan.debtToken.symbol}</span>
            <span>Health Factor: {plan.healthFactor.toFixed(2)}</span>
          </div>
        </div>

        {/* Route Details Strip */}
        <div className="mt-4 p-3 bg-neutral-950/40 rounded-lg border border-neutral-800/60 text-xs font-mono space-y-1.5">
          <div className="flex justify-between text-neutral-400">
            <span>Flashloan Provider:</span>
            <span className="text-white">{plan.flashloanProvider.name} (0% fee)</span>
          </div>
          <div className="flex justify-between text-neutral-400">
            <span>Target Protocol:</span>
            <span className="text-white">{plan.market.name}</span>
          </div>
          <div className="flex justify-between text-neutral-400">
            <span>Slippage Protection:</span>
            <span className="text-white">{plan.slippageTolerancePercent}%</span>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={onExecute}
          disabled={isExecuting}
          className="mt-4 w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <Zap className="w-4 h-4 fill-current" />
          <span>{isExecuting ? 'Submitting Flashloan Bundle...' : '1-Click Leverage Entry'}</span>
        </button>
      </div>

      {/* Embed Code Snippet */}
      <div className="bg-neutral-900/60 rounded-xl border border-neutral-800 p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-neutral-300">
            Embed this widget in your React dApp
          </span>
          <button
            onClick={handleCopyEmbed}
            className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300"
          >
            {embedCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{embedCopied ? 'Copied' : 'Copy JSX'}</span>
          </button>
        </div>
        <pre className="p-3 bg-neutral-950 rounded-lg text-xs font-mono text-neutral-300 overflow-x-auto">
          {embedSnippet}
        </pre>
      </div>
    </div>
  );
};
