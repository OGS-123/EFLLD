import React, { useState, useEffect } from 'react';
import { ChainId } from '../types/enso';
import { SUPPORTED_CHAINS } from '../data/tokensAndMarkets';
import { X, Wallet, Check, Copy, ExternalLink, ShieldCheck, Zap, RefreshCw, AlertCircle } from 'lucide-react';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  userAddress: string;
  setUserAddress: (address: string) => void;
  isWalletConnected: boolean;
  setIsWalletConnected: (connected: boolean) => void;
  selectedChainId: ChainId;
  setSelectedChainId: (chainId: ChainId) => void;
  onNotify: (msg: string) => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  userAddress,
  setUserAddress,
  isWalletConnected,
  setIsWalletConnected,
  selectedChainId,
  setSelectedChainId,
  onNotify,
}) => {
  const [copied, setCopied] = useState(false);
  const [hasInjected, setHasInjected] = useState(false);
  const [connectingInjected, setConnectingInjected] = useState(false);
  const [balance, setBalance] = useState({
    native: '4.85',
    usdc: '25,400.00',
    pol: '18,500.00',
  });

  const currentChain = SUPPORTED_CHAINS.find((c) => c.id === selectedChainId) || SUPPORTED_CHAINS[0];

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      setHasInjected(true);
    }
  }, []);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(userAddress);
    setCopied(true);
    onNotify('Address copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConnectInjected = async () => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      setConnectingInjected(true);
      try {
        const accounts = await (window as any).ethereum.request({
          method: 'eth_requestAccounts',
        });
        if (accounts && accounts[0]) {
          setUserAddress(accounts[0]);
          setIsWalletConnected(true);
          onNotify(`Connected to ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`);
        }
      } catch (err: any) {
        console.error('Wallet connection failed:', err);
        onNotify('Wallet connection was cancelled or rejected');
      } finally {
        setConnectingInjected(false);
      }
    } else {
      onNotify('No browser extension wallet detected. Using simulation account.');
    }
  };

  const handleConnectDemo = () => {
    setUserAddress('0x71C8360f9C3b2A8620890637Db051b7829778B4D');
    setIsWalletConnected(true);
    onNotify('Connected with Enso Simulation Account');
    onClose();
  };

  const handleFaucet = () => {
    setBalance({
      native: (parseFloat(balance.native) + 5).toFixed(2),
      usdc: (parseFloat(balance.usdc.replace(/,/g, '')) + 10000).toLocaleString('en-US', { minimumFractionDigits: 2 }),
      pol: (parseFloat(balance.pol.replace(/,/g, '')) + 5000).toLocaleString('en-US', { minimumFractionDigits: 2 }),
    });
    onNotify(`Faucet funded! +5 ${currentChain.nativeCurrency.symbol} & +10,000 USDC added`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">
              {isWalletConnected ? 'Account & Network' : 'Connect Wallet'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {isWalletConnected ? (
            <>
              {/* Connected Address Card */}
              <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-400">Connected Address</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span className="text-[11px] font-mono text-emerald-400">Active</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-sm font-bold text-white truncate">
                    {userAddress}
                  </span>
                  <button
                    onClick={handleCopy}
                    className="p-1.5 text-neutral-400 hover:text-white rounded bg-neutral-900 border border-neutral-800 transition-colors shrink-0"
                    title="Copy address"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80 text-xs font-mono">
                  <span className="text-neutral-400">Network:</span>
                  <span className="text-white font-medium">{currentChain.name} ({currentChain.id})</span>
                </div>
              </div>

              {/* Balances */}
              <div className="p-3.5 bg-neutral-950/60 rounded-xl border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span>Available Balance ({currentChain.shortName})</span>
                  <button
                    onClick={handleFaucet}
                    className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-mono transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Testnet Faucet</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2 bg-neutral-900 rounded border border-neutral-800/60">
                    <span className="text-neutral-500 block text-[10px]">{currentChain.nativeCurrency.symbol}</span>
                    <span className="text-white font-bold tabular-nums">
                      {selectedChainId === 137 ? balance.pol : balance.native} {currentChain.nativeCurrency.symbol}
                    </span>
                  </div>
                  <div className="p-2 bg-neutral-900 rounded border border-neutral-800/60">
                    <span className="text-neutral-500 block text-[10px]">USDC</span>
                    <span className="text-white font-bold tabular-nums">
                      ${balance.usdc}
                    </span>
                  </div>
                </div>
              </div>

              {/* Disconnect & Explorer */}
              <div className="flex items-center justify-between pt-2 text-xs">
                <a
                  href={`${currentChain.explorer}/address/${userAddress}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-neutral-400 hover:text-white transition-colors font-mono"
                >
                  <span>View on Explorer</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <button
                  onClick={() => {
                    setIsWalletConnected(false);
                    onNotify('Wallet disconnected');
                    onClose();
                  }}
                  className="text-rose-400 hover:text-rose-300 font-medium transition-colors"
                >
                  Disconnect Wallet
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Connect your browser Web3 wallet or use the simulated Enso account to test flashloan leverage bundles.
              </p>

              {/* Injected Wallet Button */}
              <button
                onClick={handleConnectInjected}
                disabled={connectingInjected}
                className="w-full p-3.5 bg-neutral-950 hover:bg-neutral-800/80 border border-neutral-800 rounded-xl transition-all flex items-center justify-between text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                    🦊
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Browser Extension Wallet
                    </span>
                    <span className="text-[11px] text-neutral-400 block">
                      MetaMask, Rabby, Coinbase Wallet, Brave
                    </span>
                  </div>
                </div>
                <span className="text-xs font-mono text-emerald-400 group-hover:translate-x-0.5 transition-transform">
                  {connectingInjected ? 'Connecting...' : 'Connect →'}
                </span>
              </button>

              {/* Demo Account Button */}
              <button
                onClick={handleConnectDemo}
                className="w-full p-3.5 bg-neutral-950 hover:bg-neutral-800/80 border border-neutral-800 rounded-xl transition-all flex items-center justify-between text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
                    <Zap className="w-4 h-4 fill-current" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Simulation Account (Instant)
                    </span>
                    <span className="text-[11px] text-neutral-400 block">
                      Pre-loaded with 5 ETH, 15,000 POL & 25,000 USDC
                    </span>
                  </div>
                </div>
                <span className="text-xs font-mono text-emerald-400 group-hover:translate-x-0.5 transition-transform">
                  Use Demo →
                </span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
