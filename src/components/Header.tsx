import React, { useState } from 'react';
import { ChainId } from '../types/enso';
import { SUPPORTED_CHAINS, CHAIN_GAS_CONFIG } from '../data/tokensAndMarkets';
import { ChevronDown, Wallet, ExternalLink, Menu, X, Fuel } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedChainId: ChainId;
  setSelectedChainId: (chainId: ChainId) => void;
  userAddress: string;
  isWalletConnected: boolean;
  onOpenWalletModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  selectedChainId,
  setSelectedChainId,
  userAddress,
  isWalletConnected,
  onOpenWalletModal,
}) => {
  const [showChainMenu, setShowChainMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentChain = SUPPORTED_CHAINS.find((c) => c.id === selectedChainId) || SUPPORTED_CHAINS[0];
  const gasInfo = CHAIN_GAS_CONFIG[selectedChainId] || CHAIN_GAS_CONFIG[1];

  const navItems = [
    { id: 'leverage', label: 'Leverage Studio' },
    { id: 'deleverage', label: 'Deleverage & Exit' },
    { id: 'visualizer', label: 'Bundle Visualizer' },
    { id: 'code', label: 'SDK & Weiroll' },
    { id: 'risk', label: 'Risk Engine' },
    { id: 'widget', label: 'Shortcuts Widget' },
    { id: 'directory', label: 'Adapters' },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center justify-between gap-8 px-4 sm:px-6 py-3.5 bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveTab('leverage')}
            className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 hover:text-emerald-400 transition-colors"
          >
            EnsoFlash Terminal
          </button>
        </div>

        {/* Zone 2: Concise single-line nav links */}
        <nav className="hidden lg:flex items-center gap-5 text-sm font-medium text-neutral-400">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
                  isActive
                    ? 'text-white border-b-2 border-emerald-500 font-semibold'
                    : 'hover:text-neutral-200'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Chain switcher + Wallet connection + Mobile toggle */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Gas indicator */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono text-neutral-400 bg-neutral-900 border border-neutral-800/80 rounded-md">
            <Fuel className="w-3 h-3 text-emerald-400" />
            <span className="text-neutral-200">{gasInfo.gwei} gwei</span>
          </div>

          {/* Chain selector dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowChainMenu(!showChainMenu)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-neutral-200 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-md transition-colors whitespace-nowrap shrink-0"
              aria-label="Select chain"
            >
              <span className="font-mono text-emerald-400 font-bold">[{currentChain.icon}]</span>
              <span className="hidden sm:inline">{currentChain.shortName}</span>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
            </button>

            {showChainMenu && (
              <div className="absolute right-0 mt-2 w-52 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in duration-100">
                <div className="px-3 py-1.5 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider border-b border-neutral-800/80">
                  Select Blockchain
                </div>
                {SUPPORTED_CHAINS.map((chain) => {
                  const isCurrent = chain.id === selectedChainId;
                  return (
                    <button
                      key={chain.id}
                      onClick={() => {
                        setSelectedChainId(chain.id);
                        setShowChainMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                        isCurrent
                          ? 'bg-neutral-800 text-white font-medium'
                          : 'text-neutral-300 hover:bg-neutral-800/60'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-xs text-neutral-400 w-8">
                          [{chain.icon}]
                        </span>
                        <span>{chain.name}</span>
                      </span>
                      {isCurrent && (
                        <span className="text-emerald-400 font-mono text-[10px]">
                          ACTIVE
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Connect / Connected state button */}
          <button
            onClick={onOpenWalletModal}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              isWalletConnected
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 hover:bg-emerald-900/60'
                : 'bg-emerald-600 hover:bg-emerald-500 text-neutral-950 font-semibold'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>
              {isWalletConnected
                ? `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`
                : 'Connect Wallet'}
            </span>
          </button>

          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 text-neutral-400 hover:text-white rounded-md bg-neutral-900 border border-neutral-800"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-neutral-950 border-b border-neutral-800 px-4 py-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                activeTab === item.id
                  ? 'bg-neutral-800 text-white font-semibold'
                  : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </>
  );
};
