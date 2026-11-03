import React, { useState, useMemo } from 'react';
import {
  ChainId,
  DeleveragePlan,
  ExecutionStep,
  FlashloanAdapterType,
  FlashloanProvider,
  LendingMarket,
  LeveragePlan,
  OfficialPreset,
  SimulationResult,
  Token,
  TxStage,
  UserPosition,
} from './types/enso';
import { FLASHLOAN_PROVIDERS, LENDING_MARKETS, SUPPORTED_CHAINS, TOKENS } from './data/tokensAndMarkets';
import { OFFICIAL_PRESETS } from './data/officialPresets';
import { calculateLeveragePlan, calculateDeleveragePlan } from './utils/leverageMath';
import { buildLeverageExecutionSteps, buildDeleverageExecutionSteps } from './utils/ensoBundleBuilder';
import { simulateBundleExecution } from './services/ensoSimulation';
import { executeDirectLeverageLoop, executeDirectDeleverage } from './services/ensoExecution';

import { Header } from './components/Header';
import { LeverageStudio } from './components/LeverageStudio';
import { DeleverageStudio } from './components/DeleverageStudio';
import { BundleVisualizer } from './components/BundleVisualizer';
import { CodeExporter } from './components/CodeExporter';
import { RiskEngine } from './components/RiskEngine';
import { ShortcutsWidget } from './components/ShortcutsWidget';
import { MarketDirectory } from './components/MarketDirectory';
import { SimulationModal } from './components/SimulationModal';
import { WalletModal } from './components/WalletModal';
import { DirectExecutionModal } from './components/DirectExecutionModal';
import { ActivePositions } from './components/ActivePositions';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('leverage');
  const [selectedChainId, setSelectedChainId] = useState<ChainId>(1);
  const [userAddress, setUserAddress] = useState<string>('0x71C8360f9C3b2A8620890637Db051b7829778B4D');
  const [isWalletConnected, setIsWalletConnected] = useState<boolean>(true);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active positions portfolio state
  const polygonAaveMarket = LENDING_MARKETS.find((m) => m.id === 'aave-polygon-weth-usdc') || LENDING_MARKETS[0];
  const [userPositions, setUserPositions] = useState<UserPosition[]>([
    {
      id: 'pos-polygon-1',
      market: polygonAaveMarket,
      collateralAmount: 2.5,
      collateralUsd: 6625,
      debtAmount: 4200,
      debtUsd: 4200,
      healthFactor: 1.34,
      liquidationPrice: 1976.47,
      netApy: 8.45,
      leverage: 2.8,
      openedAt: '02:15 PM',
      txHash: '0x8b323495f7e4148be5643a4ea4a8221eef163e4bccfdedc2a6f4696baacbc86cc',
      chainId: 137,
    },
  ]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  // Initial leverage state based on Preset 1 (Morpho WETH/USDC)
  const defaultMarket = LENDING_MARKETS[0];
  const [leveragePlanState, setLeveragePlanState] = useState<{
    initialCapitalAmount: number;
    collateralToken: Token;
    debtToken: Token;
    leverage: number;
    flashloanProvider: FlashloanProvider;
    adapter: FlashloanAdapterType;
    market: LendingMarket;
    slippageTolerancePercent: number;
  }>({
    initialCapitalAmount: 1.0,
    collateralToken: defaultMarket.collateralToken,
    debtToken: defaultMarket.debtToken,
    leverage: 2.8,
    flashloanProvider: FLASHLOAN_PROVIDERS[0], // Morpho 0% fee
    adapter: 'EnsoRouterFlashloanAdapter',
    market: defaultMarket,
    slippageTolerancePercent: 0.3,
  });

  // Initial deleverage state
  const [deleveragePlanState, setDeleveragePlanState] = useState<{
    currentCollateralAmount: number;
    currentDebtAmount: number;
    collateralToken: Token;
    debtToken: Token;
    market: LendingMarket;
    flashloanProvider: FlashloanProvider;
    adapter: FlashloanAdapterType;
    unwindType: 'full' | 'partial';
    targetLtvPercent: number;
  }>({
    currentCollateralAmount: 3.2,
    currentDebtAmount: 5350,
    collateralToken: defaultMarket.collateralToken,
    debtToken: defaultMarket.debtToken,
    market: defaultMarket,
    flashloanProvider: FLASHLOAN_PROVIDERS[0],
    adapter: 'EnsoRouterFlashloanAdapter',
    unwindType: 'full',
    targetLtvPercent: 0,
  });

  // Chain selection handler that automatically adapts markets and presets
  const handleSelectChain = (chainId: ChainId) => {
    setSelectedChainId(chainId);
    const targetChain = SUPPORTED_CHAINS.find((c) => c.id === chainId);
    showToast(`Switched network to ${targetChain?.name || 'Chain ' + chainId}`);

    const marketOnNewChain = LENDING_MARKETS.find((m) => m.chainId === chainId);
    if (marketOnNewChain) {
      const isPolToken = marketOnNewChain.collateralToken.symbol === 'POL';
      setLeveragePlanState((prev) => ({
        ...prev,
        market: marketOnNewChain,
        collateralToken: marketOnNewChain.collateralToken,
        debtToken: marketOnNewChain.debtToken,
        initialCapitalAmount: isPolToken ? 2500 : 1.0,
        flashloanProvider:
          FLASHLOAN_PROVIDERS.find((p) => p.supportedChains.includes(chainId)) || prev.flashloanProvider,
      }));

      setDeleveragePlanState((prev) => ({
        ...prev,
        market: marketOnNewChain,
        collateralToken: marketOnNewChain.collateralToken,
        debtToken: marketOnNewChain.debtToken,
        currentCollateralAmount: isPolToken ? 5000 : 2.5,
        currentDebtAmount: isPolToken ? 1400 : 3800,
        flashloanProvider:
          FLASHLOAN_PROVIDERS.find((p) => p.supportedChains.includes(chainId)) || prev.flashloanProvider,
      }));
    }
  };

  // Calculate leverage and deleverage plan metrics dynamically
  const leveragePlan: LeveragePlan = useMemo(() => {
    return calculateLeveragePlan(leveragePlanState);
  }, [leveragePlanState]);

  const deleveragePlan: DeleveragePlan = useMemo(() => {
    return calculateDeleveragePlan(deleveragePlanState);
  }, [deleveragePlanState]);

  // Generate execution steps dynamically
  const isLeverageMode = activeTab !== 'deleverage';
  const rawSteps = useMemo(() => {
    return isLeverageMode
      ? buildLeverageExecutionSteps(leveragePlan)
      : buildDeleverageExecutionSteps(deleveragePlan);
  }, [isLeverageMode, leveragePlan, deleveragePlan]);

  const [activeSteps, setActiveSteps] = useState<ExecutionStep[]>(rawSteps);

  // Sync active steps when inputs change
  React.useEffect(() => {
    setActiveSteps(rawSteps);
  }, [rawSteps]);

  // Simulation modal state
  const [isSimulationModalOpen, setIsSimulationModalOpen] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);

  // Direct on-chain execution modal state
  const [isDirectModalOpen, setIsDirectModalOpen] = useState(false);
  const [isExecutingDirect, setIsExecutingDirect] = useState(false);
  const [directTxStage, setDirectTxStage] = useState<TxStage>('idle');
  const [directStatusMessage, setDirectStatusMessage] = useState<string>('');
  const [directTxHash, setDirectTxHash] = useState<string>('');
  const [directBlockNumber, setDirectBlockNumber] = useState<number>(0);
  const [directActionTitle, setDirectActionTitle] = useState<string>('Executing Live Flashloan Bundle');
  const [directSummaryDetails, setDirectSummaryDetails] = useState({
    collateral: '',
    debt: '',
    healthFactor: '',
  });

  const handleApplyPreset = (preset: OfficialPreset) => {
    const market = LENDING_MARKETS.find(
      (m) =>
        m.collateralToken.symbol === preset.collateralSymbol &&
        m.debtToken.symbol === preset.debtSymbol
    ) || LENDING_MARKETS[0];

    const provider = FLASHLOAN_PROVIDERS.find((p) => p.id === preset.flashloanProvider) || FLASHLOAN_PROVIDERS[0];

    setSelectedChainId(market.chainId);

    setLeveragePlanState((prev) => ({
      ...prev,
      initialCapitalAmount: preset.defaultCapital,
      collateralToken: market.collateralToken,
      debtToken: market.debtToken,
      leverage: preset.defaultLeverage,
      flashloanProvider: provider,
      market,
    }));

    showToast(`Applied preset: ${preset.title}`);
  };

  const handleRunSimulation = async (mode: 'leverage' | 'deleverage') => {
    setIsSimulationModalOpen(true);
    setIsSimulating(true);
    setSimulationResult(null);

    setActiveSteps((prev) => prev.map((s) => ({ ...s, status: 'idle' })));

    try {
      const planToSimulate = mode === 'leverage' ? leveragePlan : deleveragePlan;
      const res = await simulateBundleExecution(
        rawSteps,
        planToSimulate,
        (stepId, status) => {
          setActiveSteps((prev) =>
            prev.map((s) => (s.id === stepId ? { ...s, status } : s))
          );
        }
      );
      setSimulationResult(res);
      showToast('Simulation completed: Atomic invariant verified');
    } catch (err) {
      console.error('Simulation error:', err);
      showToast('Simulation error encountered');
    } finally {
      setIsSimulating(false);
    }
  };

  // Direct Live On-Chain Leverage Loop
  const handleDirectLeverageExecute = async () => {
    if (!isWalletConnected) {
      setIsWalletModalOpen(true);
      showToast('Please connect your wallet first');
      return;
    }

    setIsDirectModalOpen(true);
    setIsExecutingDirect(true);
    setDirectActionTitle(`Opening ${leveragePlan.leverage.toFixed(1)}x ${leveragePlan.market.name}`);
    setDirectSummaryDetails({
      collateral: `${leveragePlan.totalCollateralAmount.toFixed(4)} ${leveragePlan.collateralToken.symbol}`,
      debt: `${leveragePlan.totalDebtAmount.toFixed(2)} ${leveragePlan.debtToken.symbol}`,
      healthFactor: leveragePlan.healthFactor.toFixed(2),
    });

    try {
      const { txHash, blockNumber, newPosition } = await executeDirectLeverageLoop(
        leveragePlan,
        userAddress,
        (stage, msg) => {
          setDirectTxStage(stage);
          setDirectStatusMessage(msg);
        }
      );

      setDirectTxHash(txHash);
      setDirectBlockNumber(blockNumber);
      setUserPositions((prev) => [newPosition, ...prev]);
      showToast(`Position opened on-chain in Block #${blockNumber}!`);
    } catch (err: any) {
      console.error('Direct execution failed:', err);
      setDirectTxStage('failed');
      setDirectStatusMessage(err?.message || 'Transaction failed or was rejected');
      showToast('Transaction failed');
    } finally {
      setIsExecutingDirect(false);
    }
  };

  // Direct Live On-Chain Deleverage Unwind
  const handleDirectDeleverageExecute = async () => {
    if (!isWalletConnected) {
      setIsWalletModalOpen(true);
      showToast('Please connect your wallet first');
      return;
    }

    setIsDirectModalOpen(true);
    setIsExecutingDirect(true);
    setDirectActionTitle(`Unwinding ${deleveragePlan.market.name} Position`);
    setDirectSummaryDetails({
      collateral: `+${deleveragePlan.netPayoutCollateral.toFixed(4)} ${deleveragePlan.collateralToken.symbol} (Payout)`,
      debt: `-${deleveragePlan.debtToRepay.toFixed(2)} ${deleveragePlan.debtToken.symbol} (Repaid)`,
      healthFactor: deleveragePlan.unwindType === 'full' ? 'Closed' : deleveragePlan.healthFactorAfter.toFixed(2),
    });

    try {
      const { txHash, blockNumber } = await executeDirectDeleverage(
        deleveragePlan,
        userAddress,
        (stage, msg) => {
          setDirectTxStage(stage);
          setDirectStatusMessage(msg);
        }
      );

      setDirectTxHash(txHash);
      setDirectBlockNumber(blockNumber);

      // If full unwind, remove matching positions
      if (deleveragePlan.unwindType === 'full') {
        setUserPositions((prev) => prev.filter((p) => p.market.id !== deleveragePlan.market.id));
      }

      showToast(`Deleverage confirmed on-chain in Block #${blockNumber}!`);
    } catch (err: any) {
      console.error('Direct deleverage failed:', err);
      setDirectTxStage('failed');
      setDirectStatusMessage(err?.message || 'Deleverage transaction failed');
      showToast('Deleverage failed');
    } finally {
      setIsExecutingDirect(false);
    }
  };

  const handleSelectPositionForDeleverage = (pos: UserPosition) => {
    setSelectedChainId(pos.chainId);
    setDeleveragePlanState((prev) => ({
      ...prev,
      market: pos.market,
      collateralToken: pos.market.collateralToken,
      debtToken: pos.market.debtToken,
      currentCollateralAmount: pos.collateralAmount,
      currentDebtAmount: pos.debtAmount,
    }));
    setActiveTab('deleverage');
    showToast(`Loaded ${pos.market.name} position into Deleverage Studio`);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      {/* 3-Zone Top Bar Contract */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedChainId={selectedChainId}
        setSelectedChainId={handleSelectChain}
        userAddress={userAddress}
        isWalletConnected={isWalletConnected}
        onOpenWalletModal={() => setIsWalletModalOpen(true)}
        positionsCount={userPositions.length}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'leverage' && (
          <LeverageStudio
            plan={leveragePlan}
            setPlanParams={(updater) =>
              setLeveragePlanState((prev) => {
                const dummyPlan = calculateLeveragePlan(prev);
                const updated = updater(dummyPlan);
                return {
                  initialCapitalAmount: updated.initialCapitalAmount,
                  collateralToken: updated.collateralToken,
                  debtToken: updated.debtToken,
                  leverage: updated.leverage,
                  flashloanProvider: updated.flashloanProvider,
                  adapter: updated.adapter,
                  market: updated.market,
                  slippageTolerancePercent: updated.slippageTolerancePercent,
                };
              })
            }
            onApplyPreset={handleApplyPreset}
            onOpenVisualizer={() => setActiveTab('visualizer')}
            onOpenCode={() => setActiveTab('code')}
            onSimulate={() => handleRunSimulation('leverage')}
            onExecuteDirect={handleDirectLeverageExecute}
            isExecutingDirect={isExecutingDirect}
          />
        )}

        {activeTab === 'deleverage' && (
          <DeleverageStudio
            plan={deleveragePlan}
            setDeleverageParams={(updater) =>
              setDeleveragePlanState((prev) => {
                const dummyPlan = calculateDeleveragePlan(prev);
                const updated = updater(dummyPlan);
                return {
                  currentCollateralAmount: updated.currentCollateralAmount,
                  currentDebtAmount: updated.currentDebtAmount,
                  collateralToken: updated.collateralToken,
                  debtToken: updated.debtToken,
                  market: updated.market,
                  flashloanProvider: updated.flashloanProvider,
                  adapter: updated.adapter,
                  unwindType: updated.unwindType,
                  targetLtvPercent: updated.targetLtvPercent,
                };
              })
            }
            onSimulateDeleverage={() => handleRunSimulation('deleverage')}
            onOpenVisualizer={() => setActiveTab('visualizer')}
            onExecuteDeleverageDirect={handleDirectDeleverageExecute}
            isExecutingDirect={isExecutingDirect}
          />
        )}

        {activeTab === 'positions' && (
          <ActivePositions
            positions={userPositions}
            onSelectPositionForDeleverage={handleSelectPositionForDeleverage}
            onNavigateToRisk={() => setActiveTab('risk')}
            onNavigateToLeverage={() => setActiveTab('leverage')}
          />
        )}

        {activeTab === 'visualizer' && (
          <BundleVisualizer
            steps={activeSteps}
            plan={isLeverageMode ? leveragePlan : deleveragePlan}
            isSimulating={isSimulating}
            simulationResult={simulationResult}
            onSimulate={() => handleRunSimulation(isLeverageMode ? 'leverage' : 'deleverage')}
            onExecuteDirect={isLeverageMode ? handleDirectLeverageExecute : handleDirectDeleverageExecute}
            isExecutingDirect={isExecutingDirect}
          />
        )}

        {activeTab === 'code' && <CodeExporter plan={leveragePlan} />}

        {activeTab === 'risk' && (
          <RiskEngine
            plan={leveragePlan}
            onNavigateToDeleverage={() => setActiveTab('deleverage')}
          />
        )}

        {activeTab === 'widget' && (
          <ShortcutsWidget
            plan={leveragePlan}
            onExecute={handleDirectLeverageExecute}
            isExecuting={isExecutingDirect}
          />
        )}

        {activeTab === 'directory' && <MarketDirectory />}
      </main>

      {/* Simulation Modal (Fork Test) */}
      <SimulationModal
        isOpen={isSimulationModalOpen}
        onClose={() => setIsSimulationModalOpen(false)}
        isSimulating={isSimulating}
        steps={activeSteps}
        simulationResult={simulationResult}
        mode={isLeverageMode ? 'leverage' : 'deleverage'}
        onExecuteDirect={isLeverageMode ? handleDirectLeverageExecute : handleDirectDeleverageExecute}
      />

      {/* Direct On-Chain Execution Modal */}
      <DirectExecutionModal
        isOpen={isDirectModalOpen}
        onClose={() => setIsDirectModalOpen(false)}
        txStage={directTxStage}
        statusMessage={directStatusMessage}
        txHash={directTxHash}
        blockNumber={directBlockNumber}
        chainId={selectedChainId}
        actionTitle={directActionTitle}
        summaryDetails={directSummaryDetails}
        onViewPositions={() => setActiveTab('positions')}
      />

      {/* Web3 / Account Drawer Modal */}
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        userAddress={userAddress}
        setUserAddress={setUserAddress}
        isWalletConnected={isWalletConnected}
        setIsWalletConnected={setIsWalletConnected}
        selectedChainId={selectedChainId}
        setSelectedChainId={handleSelectChain}
        onNotify={showToast}
      />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900 border border-emerald-500/50 shadow-2xl rounded-xl px-4 py-2.5 text-xs text-white flex items-center gap-2.5 animate-in slide-in-from-bottom-2 duration-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Quiet Minimal Footer */}
      <footer className="border-t border-neutral-800/80 bg-neutral-950/60 py-6 px-6 text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-400">EnsoFlash Terminal</span>
            <span aria-hidden="true">·</span>
            <span>Enso Shortcuts & Flashloan Adapters</span>
            <span aria-hidden="true">·</span>
            <span>Optimized for Vercel</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('directory')}
              className="hover:text-neutral-300 transition-colors"
            >
              Adapters & Contracts
            </button>
            <a
              href="https://github.com/EnsoBuild"
              target="_blank"
              rel="noreferrer"
              className="hover:text-neutral-300 transition-colors"
            >
              EnsoBuild GitHub
            </a>
            <a
              href="https://docs.enso.build"
              target="_blank"
              rel="noreferrer"
              className="hover:text-neutral-300 transition-colors"
            >
              Enso Documentation
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
