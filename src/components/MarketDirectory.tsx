import React from 'react';
import { FLASHLOAN_PROVIDERS, LENDING_MARKETS, ENSO_CORE_CONTRACTS } from '../data/tokensAndMarkets';
import { Shield, Layers, Cpu, ExternalLink, CheckCircle } from 'lucide-react';

export const MarketDirectory: React.FC = () => {
  const adapters = [
    {
      name: 'EnsoRouterFlashloanAdapter',
      address: ENSO_CORE_CONTRACTS[1].routerFlashloanAdapter,
      description: 'Universal stateless adapter allowing any EOA or contract to execute flashloans through Enso Router without pre-deploying a smart account.',
      bestFor: 'General Web3 apps, instant 1-click leverage, dApp widgets',
      contractRepo: 'https://github.com/EnsoBuild/shortcuts-contracts',
    },
    {
      name: 'EnsoWalletFlashloanAdapter',
      address: ENSO_CORE_CONTRACTS[1].walletFlashloanAdapter,
      description: 'Dedicated adapter for deterministic Enso Smart Wallets, eliminating approval overhead and granting fine-grained session keys.',
      bestFor: 'Automated vaults, DCA leverage, cross-chain intents',
      contractRepo: 'https://github.com/EnsoBuild/enso-wallet-contracts',
    },
    {
      name: 'EnsoSafeFlashloanAdapter',
      address: ENSO_CORE_CONTRACTS[1].safeFlashloanAdapter,
      description: 'Specialized adapter for Gnosis Safe multisigs, ensuring multisig signers can atomic loop or unwind institutional treasury assets in 1 batch.',
      bestFor: 'DAOs, protocol treasuries, institutional custody',
      contractRepo: 'https://github.com/EnsoBuild/shortcuts-contracts',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Enso Flashloan Architecture & Adapters
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            Overview of supported flashloan protocols, deterministic wallet contracts, and Enso shortcuts execution adapters.
          </p>
        </div>

        <a
          href="https://docs.enso.build/pages/build/reference/flashloans"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 hover:text-emerald-300"
        >
          <span>Enso Flashloans Reference Docs</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Flashloan Adapters Cards */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
          Enso Flashloan Adapter Contracts
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {adapters.map((adapter) => (
            <div
              key={adapter.name}
              className="p-5 bg-neutral-900/60 rounded-xl border border-neutral-800 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{adapter.name}</span>
                <Shield className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                {adapter.description}
              </p>
              <div className="pt-2 border-t border-neutral-800 text-[11px] font-mono space-y-1">
                <div className="text-neutral-500">Target Userbase:</div>
                <div className="text-neutral-200">{adapter.bestFor}</div>
                <div className="text-neutral-500 pt-1">Address (Mainnet):</div>
                <div className="text-emerald-400 truncate">{adapter.address}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Supported Flashloan Protocols Grid */}
      <div className="space-y-3 pt-2">
        <h2 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
          Supported Flashloan Liquidity Sources
        </h2>

        <div className="bg-neutral-900/40 rounded-xl border border-neutral-800 overflow-hidden">
          <table className="w-full text-xs font-mono text-left">
            <thead className="bg-neutral-950/60 text-neutral-400 border-b border-neutral-800">
              <tr>
                <th className="py-3 px-4 font-medium">Protocol Identifier</th>
                <th className="py-3 px-4 font-medium">Flashloan Fee</th>
                <th className="py-3 px-4 font-medium">Mechanism</th>
                <th className="py-3 px-4 font-medium">Contract Address</th>
                <th className="py-3 px-4 font-medium text-right">Supported Chains</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
              {FLASHLOAN_PROVIDERS.map((fp) => (
                <tr key={fp.id} className="hover:bg-neutral-800/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-white">
                    {fp.name}
                    <span className="text-[10px] text-neutral-500 block">{fp.id}</span>
                  </td>
                  <td className="py-3 px-4 tabular-nums">
                    <span className={fp.feePercent === 0 ? 'text-emerald-400 font-bold' : 'text-neutral-200'}>
                      {fp.feePercent}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-neutral-400">{fp.description}</td>
                  <td className="py-3 px-4 text-neutral-400 truncate max-w-[140px] select-all">
                    {fp.contractAddress}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums text-neutral-400">
                    {fp.supportedChains.join(', ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
