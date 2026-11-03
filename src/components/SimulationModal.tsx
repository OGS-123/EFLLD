import React from 'react';
import { ExecutionStep, SimulationResult } from '../types/enso';
import { CheckCircle2, X, Activity, ExternalLink, Loader2, AlertCircle } from 'lucide-react';

interface SimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSimulating: boolean;
  steps: ExecutionStep[];
  simulationResult: SimulationResult | null;
  mode: 'leverage' | 'deleverage';
}

export const SimulationModal: React.FC<SimulationModalProps> = ({
  isOpen,
  onClose,
  isSimulating,
  steps,
  simulationResult,
  mode,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">
              {mode === 'leverage' ? 'Simulating Atomic Leverage Loop' : 'Simulating Atomic Deleverage'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Progress Banner */}
          <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-white block">
                {isSimulating ? 'Executing Atomic Bundle Steps...' : 'Simulation Completed'}
              </span>
              <span className="text-[11px] text-neutral-400 font-mono">
                {isSimulating
                  ? 'Verifying flashloan callback & invariant checks'
                  : 'All steps verified. Invariants satisfied without revert.'}
              </span>
            </div>

            {isSimulating ? (
              <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            )}
          </div>

          {/* Steps Progress Checklist */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block">
              Execution Sequence
            </span>

            {steps.map((step) => {
              const isPending = step.status === 'pending';
              const isSuccess = step.status === 'success';

              return (
                <div
                  key={step.id}
                  className={`p-3 rounded-lg border text-xs flex items-center justify-between transition-colors ${
                    isSuccess
                      ? 'bg-neutral-950/80 border-emerald-900/60 text-white'
                      : isPending
                      ? 'bg-neutral-950 border-amber-800/80 text-amber-200'
                      : 'bg-neutral-950/40 border-neutral-800/60 text-neutral-500'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {isSuccess ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : isPending ? (
                      <Loader2 className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-neutral-700 text-[10px] flex items-center justify-center font-mono">
                        {step.number}
                      </div>
                    )}
                    <div>
                      <span className="font-semibold block">{step.title}</span>
                      <span className="text-[11px] text-neutral-400">{step.expectedOutput}</span>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono uppercase">
                    {step.status}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Simulation Output Summary if Done */}
          {simulationResult && !isSimulating && (
            <div className="p-4 bg-emerald-950/20 border border-emerald-800/40 rounded-xl space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-300 font-semibold">Simulated Transaction Hash:</span>
                <span className="font-mono text-emerald-400">
                  {simulationResult.txHash.slice(0, 14)}...{simulationResult.txHash.slice(-8)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <span className="text-neutral-500 block">Gas Consumed:</span>
                  <span className="text-white font-bold">{simulationResult.gasUsed.toLocaleString()} units</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Network State:</span>
                  <span className="text-emerald-400 font-bold">Confirmed in Block #{simulationResult.blockNumber}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-800/80 space-y-1 text-xs font-mono">
                <span className="text-neutral-400 block font-semibold text-[10px] uppercase">
                  Net Balance Changes:
                </span>
                {simulationResult.balanceChanges.map((change, idx) => (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <span className="text-neutral-400">{change.token}:</span>
                    <span className="text-emerald-300 font-medium">{change.delta}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"
          >
            Close Simulation
          </button>
        </div>
      </div>
    </div>
  );
};
