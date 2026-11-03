import React from 'react';
import { ChainId, TxStage } from '../types/enso';
import { SUPPORTED_CHAINS } from '../data/tokensAndMarkets';
import { CheckCircle2, Loader2, X, ExternalLink, ShieldCheck, ArrowRight, AlertCircle, Zap } from 'lucide-react';

interface DirectExecutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  txStage: TxStage;
  statusMessage: string;
  txHash: string;
  blockNumber: number;
  chainId: ChainId;
  actionTitle: string;
  summaryDetails: {
    collateral: string;
    debt: string;
    healthFactor: string;
  };
  onViewPositions?: () => void;
}

export const DirectExecutionModal: React.FC<DirectExecutionModalProps> = ({
  isOpen,
  onClose,
  txStage,
  statusMessage,
  txHash,
  blockNumber,
  chainId,
  actionTitle,
  summaryDetails,
  onViewPositions,
}) => {
  if (!isOpen) return null;

  const currentChain = SUPPORTED_CHAINS.find((c) => c.id === chainId) || SUPPORTED_CHAINS[0];
  const isConfirmed = txStage === 'confirmed';
  const isFailed = txStage === 'failed';

  const stages: { key: TxStage; label: string; desc: string }[] = [
    { key: 'checking_allowance', label: '1. Validation & Allowance', desc: 'Verify network balance & ERC-20 allowances' },
    { key: 'approving', label: '2. EnsoRouter Approval', desc: 'Approve token spend for execution context' },
    { key: 'awaiting_signature', label: '3. Wallet Signature', desc: 'Awaiting signature confirmation from your wallet' },
    { key: 'broadcasting', label: '4. Mempool Broadcast', desc: `Broadcasting atomic bundle to ${currentChain.name}` },
    { key: 'confirmed', label: '5. Execution Confirmed', desc: 'Flashloan callback satisfied & position live' },
  ];

  const getStageIndex = (s: TxStage) => {
    switch (s) {
      case 'checking_allowance': return 0;
      case 'approving': return 1;
      case 'awaiting_signature': return 2;
      case 'broadcasting': return 3;
      case 'confirmed': return 4;
      default: return 0;
    }
  };

  const currentIndex = getStageIndex(txStage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-emerald-400 fill-current" />
            <h3 className="text-sm font-bold text-white">
              {actionTitle}
            </h3>
          </div>
          {isConfirmed && (
            <button
              onClick={onClose}
              className="p-1 text-neutral-400 hover:text-white rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {/* Main Status Callout */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between ${
              isConfirmed
                ? 'bg-emerald-950/40 border-emerald-800/80'
                : isFailed
                ? 'bg-rose-950/40 border-rose-800/80'
                : 'bg-neutral-950 border-neutral-800'
            }`}
          >
            <div className="space-y-1">
              <span className="text-xs font-bold text-white block">
                {isConfirmed ? 'Bundle Executed Successfully!' : statusMessage}
              </span>
              <span className="text-[11px] font-mono text-neutral-400">
                Network: {currentChain.name} ({currentChain.id})
              </span>
            </div>

            {isConfirmed ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            ) : isFailed ? (
              <AlertCircle className="w-6 h-6 text-rose-500 shrink-0" />
            ) : (
              <Loader2 className="w-6 h-6 text-emerald-400 animate-spin shrink-0" />
            )}
          </div>

          {/* Sequential Lifecycle Steps */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
              On-Chain Execution Lifecycle
            </span>

            {stages.map((stageItem, idx) => {
              const isPast = currentIndex > idx || isConfirmed;
              const isCurrent = currentIndex === idx && !isConfirmed;

              return (
                <div
                  key={stageItem.key}
                  className={`p-3 rounded-lg border text-xs flex items-center justify-between transition-colors ${
                    isPast
                      ? 'bg-neutral-950/80 border-emerald-900/60 text-white'
                      : isCurrent
                      ? 'bg-neutral-950 border-emerald-500/80 text-emerald-200'
                      : 'bg-neutral-950/40 border-neutral-800/60 text-neutral-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isPast ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 text-emerald-400 animate-spin shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-neutral-700 text-[10px] flex items-center justify-center font-mono">
                        {idx + 1}
                      </div>
                    )}
                    <div>
                      <span className="font-semibold block">{stageItem.label}</span>
                      <span className="text-[11px] text-neutral-400">{stageItem.desc}</span>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono uppercase">
                    {isPast ? 'DONE' : isCurrent ? 'ACTIVE' : 'QUEUED'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Confirmed Position Details */}
          {isConfirmed && (
            <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-400">Transaction Hash:</span>
                <a
                  href={`${currentChain.explorer}/tx/${txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 underline decoration-dotted"
                >
                  <span>{txHash.slice(0, 10)}...{txHash.slice(-6)}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 bg-neutral-900 rounded border border-neutral-800/60">
                  <span className="text-neutral-500 block">Total Collateral:</span>
                  <span className="text-white font-bold">{summaryDetails.collateral}</span>
                </div>
                <div className="p-2 bg-neutral-900 rounded border border-neutral-800/60">
                  <span className="text-neutral-500 block">Total Debt:</span>
                  <span className="text-amber-300 font-bold">{summaryDetails.debt}</span>
                </div>
              </div>

              <div className="flex justify-between text-[11px] text-neutral-400 pt-1">
                <span>Health Factor:</span>
                <span className="text-emerald-400 font-bold">{summaryDetails.healthFactor}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/80 flex justify-between items-center">
          <span className="text-xs text-neutral-400 font-mono">
            {isConfirmed ? `Block #${blockNumber}` : 'Atomic flashloan guarantee'}
          </span>

          <div className="flex items-center gap-2">
            {isConfirmed && onViewPositions && (
              <button
                onClick={() => {
                  onClose();
                  onViewPositions();
                }}
                className="px-4 py-2 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-neutral-950 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <span>View My Positions</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {isConfirmed && (
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
