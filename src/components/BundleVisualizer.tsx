import React, { useState } from 'react';
import { ExecutionStep, LeveragePlan, DeleveragePlan, SimulationResult } from '../types/enso';
import { generateWeirollCommands } from '../utils/ensoBundleBuilder';
import { Play, CheckCircle2, ChevronRight, ChevronDown, Terminal, Layers, ShieldCheck, Activity, Copy, Check } from 'lucide-react';

interface BundleVisualizerProps {
  steps: ExecutionStep[];
  plan: LeveragePlan | DeleveragePlan;
  isSimulating: boolean;
  simulationResult: SimulationResult | null;
  onSimulate: () => void;
}

export const BundleVisualizer: React.FC<BundleVisualizerProps> = ({
  steps,
  plan,
  isSimulating,
  simulationResult,
  onSimulate,
}) => {
  const [expandedStepId, setExpandedStepId] = useState<string | null>(steps[1]?.id || null);
  const [viewMode, setViewMode] = useState<'tree' | 'weiroll' | 'logs'>('tree');
  const [copiedWeiroll, setCopiedWeiroll] = useState(false);

  const isLeverage = 'leverage' in plan;
  const weirollCommands = isLeverage ? generateWeirollCommands(plan as LeveragePlan) : [];

  const handleCopyWeiroll = () => {
    navigator.clipboard.writeText(weirollCommands.join('\n'));
    setCopiedWeiroll(true);
    setTimeout(() => setCopiedWeiroll(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Atomic Bundle & Weiroll Visualizer
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            Inspect the exact callback tree and bytecode commands executed inside the single-transaction flashloan bundle.
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-lg">
          <button
            onClick={() => setViewMode('tree')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'tree'
                ? 'bg-neutral-800 text-white font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Call Tree
          </button>
          <button
            onClick={() => setViewMode('weiroll')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'weiroll'
                ? 'bg-neutral-800 text-white font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Weiroll VM Bytecode
          </button>
          <button
            onClick={() => setViewMode('logs')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'logs'
                ? 'bg-neutral-800 text-white font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Execution Logs ({simulationResult ? simulationResult.logs.length : 0})
          </button>
        </div>
      </div>

      {/* Main Execution View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Call Tree or Weiroll Bytecode (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          {viewMode === 'tree' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
                <span>Total Actions: {steps.length} atomic steps</span>
                <span className="font-mono">Gas Target: ~{isLeverage ? (plan as LeveragePlan).estimatedGasUnits : 295000}</span>
              </div>

              {steps.map((step) => {
                const isExpanded = expandedStepId === step.id;
                return (
                  <div
                    key={step.id}
                    className={`rounded-xl border transition-all ${
                      step.isInsideCallback
                        ? 'border-neutral-800 bg-neutral-900/60 ml-4 md:ml-6'
                        : 'border-neutral-700/80 bg-neutral-900/90'
                    }`}
                  >
                    {/* Header */}
                    <button
                      onClick={() => setExpandedStepId(isExpanded ? null : step.id)}
                      className="w-full flex items-center justify-between p-4 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold ${
                            step.status === 'success'
                              ? 'bg-emerald-500 text-neutral-950'
                              : step.status === 'pending'
                              ? 'bg-amber-400 text-neutral-950 animate-pulse'
                              : 'bg-neutral-800 text-neutral-300'
                          }`}
                        >
                          {step.status === 'success' ? '✓' : step.number}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-white">
                              {step.title}
                            </span>
                            {step.isInsideCallback && (
                              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-1.5 py-0.5 rounded">
                                Flashloan Callback
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-neutral-400 line-clamp-1 mt-0.5">
                            {step.description}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
                        <span className="hidden sm:inline">{step.actionType}</span>
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-neutral-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-neutral-400" />
                        )}
                      </div>
                    </button>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 border-t border-neutral-800/80 text-xs space-y-3 font-mono">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-neutral-950/60 p-3 rounded-lg border border-neutral-800/60">
                          <div>
                            <span className="text-neutral-500 block text-[11px]">Target Contract:</span>
                            <span className="text-neutral-200 break-all select-all">{step.contract}</span>
                          </div>
                          <div>
                            <span className="text-neutral-500 block text-[11px]">Method Signature:</span>
                            <span className="text-emerald-400">{step.method}</span>
                          </div>
                        </div>

                        <div>
                          <span className="text-neutral-400 block mb-1">Inputs:</span>
                          <div className="bg-neutral-950/80 p-2.5 rounded-lg border border-neutral-800/40 space-y-1">
                            {Object.entries(step.inputs).map(([k, v]) => (
                              <div key={k} className="flex justify-between">
                                <span className="text-neutral-500">{k}:</span>
                                <span className="text-neutral-200">{v}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <span className="text-neutral-400 block mb-1">Expected Output / Invariant:</span>
                          <div className="bg-neutral-950/80 p-2.5 rounded-lg border border-neutral-800/40 text-emerald-300">
                            {step.expectedOutput}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {viewMode === 'weiroll' && (
            <div className="bg-neutral-900/90 rounded-xl border border-neutral-800 p-5 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold text-white">Enso Weiroll VM Execution Script</span>
                </div>
                <button
                  onClick={handleCopyWeiroll}
                  className="flex items-center gap-1 px-2.5 py-1 text-[11px] bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded transition-colors"
                >
                  {copiedWeiroll ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedWeiroll ? 'Copied' : 'Copy VM Script'}</span>
                </button>
              </div>

              <div className="space-y-1 text-neutral-300 bg-neutral-950 p-4 rounded-lg overflow-x-auto">
                {weirollCommands.map((cmd, i) => (
                  <div
                    key={i}
                    className={cmd.startsWith('//') ? 'text-neutral-500 italic' : cmd.includes('COMMAND') ? 'text-emerald-400 font-semibold' : 'text-neutral-300 pl-4'}
                  >
                    {cmd}
                  </div>
                ))}
              </div>

              <div className="text-[11px] text-neutral-400">
                Weiroll compiles complex multi-call flashloan logic into minimal bytecode executed via EnsoRouter with zero delegatecall vulnerabilities.
              </div>
            </div>
          )}

          {viewMode === 'logs' && (
            <div className="bg-neutral-950 rounded-xl border border-neutral-800 p-4 font-mono text-xs space-y-2 h-[420px] overflow-y-auto">
              <div className="flex items-center gap-2 text-neutral-400 pb-2 border-b border-neutral-800">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>Simulation RPC Console Logs</span>
              </div>

              {simulationResult ? (
                <div className="space-y-1">
                  {simulationResult.logs.map((log, i) => (
                    <div
                      key={i}
                      className={
                        log.includes('OK') || log.includes('verified')
                          ? 'text-emerald-400'
                          : log.includes('Step')
                          ? 'text-white'
                          : 'text-neutral-400'
                      }
                    >
                      {log}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-neutral-500 py-12 text-center">
                  No simulation logs yet. Click &quot;Run Bundle Simulation&quot; to test execution.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Simulation Controller & Status (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-neutral-900/60 p-5 rounded-xl border border-neutral-800 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-sm font-semibold text-white">Simulation Engine</h3>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>

            <p className="text-xs text-neutral-400">
              Run this bundle against a virtual fork of Ethereum Mainnet to verify flashloan callback invariants, slippage protection, and health factor guarantees.
            </p>

            <button
              onClick={onSimulate}
              disabled={isSimulating}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
                isSimulating
                  ? 'bg-neutral-800 text-neutral-400 cursor-not-allowed'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isSimulating ? 'Executing Simulation...' : 'Run Bundle Simulation'}</span>
            </button>

            {/* Simulation Status Card */}
            {simulationResult && (
              <div className="p-3.5 bg-neutral-950/80 rounded-lg border border-emerald-900/50 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Simulation Passed</span>
                  </div>
                  <span className="font-mono text-neutral-400 text-[11px]">
                    Block #{simulationResult.blockNumber}
                  </span>
                </div>

                <div className="text-[11px] font-mono space-y-1">
                  <div className="text-neutral-400">
                    Tx Hash: <span className="text-neutral-200">{simulationResult.txHash.slice(0, 16)}...</span>
                  </div>
                  <div className="text-neutral-400">
                    Gas Used: <span className="text-emerald-400 font-bold tabular-nums">{simulationResult.gasUsed.toLocaleString()} units</span>
                  </div>
                </div>

                {/* State deltas */}
                <div className="pt-2 border-t border-neutral-800 space-y-1.5 text-[11px] font-mono">
                  <span className="text-neutral-400 font-semibold block text-[10px] uppercase">
                    Balance & State Deltas
                  </span>
                  {simulationResult.balanceChanges.map((change, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="text-neutral-400">{change.token}:</span>
                      <span className="text-emerald-300 font-medium tabular-nums">{change.delta}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
