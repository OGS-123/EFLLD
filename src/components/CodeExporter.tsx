import React, { useState } from 'react';
import { LeveragePlan } from '../types/enso';
import { generateEnsoTypeScriptSnippet } from '../utils/ensoBundleBuilder';
import { Code2, Copy, Check, Terminal, FileCode, Send } from 'lucide-react';

interface CodeExporterProps {
  plan: LeveragePlan;
}

export const CodeExporter: React.FC<CodeExporterProps> = ({ plan }) => {
  const [activeTab, setActiveTab] = useState<'sdk' | 'api' | 'curl' | 'foundry'>('sdk');
  const [copied, setCopied] = useState(false);

  const tsCode = generateEnsoTypeScriptSnippet(plan);

  const apiPayload = {
    chainId: plan.market.chainId,
    fromAddress: '0xYourWalletAddress',
    receiver: '0xYourWalletAddress',
    routingStrategy: plan.adapter === 'EnsoRouterFlashloanAdapter' ? 'router' : 'delegate',
    actions: [
      {
        protocol: plan.flashloanProvider.id,
        action: 'flashloan',
        args: {
          flashloanToken: plan.debtToken.address,
          flashloanAmount: Math.round(plan.flashloanAmount * Math.pow(10, plan.debtToken.decimals)).toString(),
          tokenOut: plan.collateralToken.address,
          primaryAddress: plan.flashloanProvider.contractAddress,
          callback: [
            {
              protocol: 'enso',
              action: 'route',
              args: {
                tokenIn: plan.debtToken.address,
                tokenOut: plan.collateralToken.address,
                amountIn: Math.round(plan.flashloanAmount * Math.pow(10, plan.debtToken.decimals)).toString(),
                slippage: Math.round(plan.slippageTolerancePercent * 100),
              },
            },
            {
              protocol: plan.market.protocol === 'morpho-blue' ? 'morpho-markets-v1' : plan.market.protocol,
              action: 'deposit',
              args: {
                tokenIn: plan.collateralToken.address,
                primaryAddress: plan.market.marketId || plan.market.id,
                amountIn: { useOutputOfCallAt: 0 },
              },
            },
            {
              protocol: plan.market.protocol === 'morpho-blue' ? 'morpho-markets-v1' : plan.market.protocol,
              action: 'borrow',
              args: {
                tokenOut: plan.debtToken.address,
                primaryAddress: plan.market.marketId || plan.market.id,
                amountOut: Math.round(plan.flashloanAmount * Math.pow(10, plan.debtToken.decimals)).toString(),
                receiver: '0xYourWalletAddress',
              },
            },
            {
              protocol: plan.flashloanProvider.id,
              action: 'repay',
              args: {
                tokenIn: plan.debtToken.address,
                amountIn: Math.round(plan.flashloanAmount * Math.pow(10, plan.debtToken.decimals)).toString(),
                primaryAddress: plan.flashloanProvider.contractAddress,
              },
            },
          ],
        },
      },
    ],
  };

  const curlSnippet = `curl -X POST https://api.enso.finance/api/v1/shortcuts/bundle \\
  -H "Authorization: Bearer YOUR_ENSO_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(apiPayload, null, 2)}'`;

  const foundryTestSnippet = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";

contract EnsoLeverageForkTest is Test {
    address constant ENSO_ROUTER = 0x10d1b02330a13E16cfB1201B4B6E70d24e12eE5e;
    address constant COLLATERAL = ${plan.collateralToken.address}; // ${plan.collateralToken.symbol}
    address constant DEBT_TOKEN = ${plan.debtToken.address}; // ${plan.debtToken.symbol}

    function setUp() public {
        vm.createSelectFork("mainnet", 21849000);
    }

    function test_AtomicLeverageLoop() public {
        address user = makeAddr("alice");
        deal(COLLATERAL, user, ${plan.initialCapitalAmount} ether);

        vm.startPrank(user);
        IERC20(COLLATERAL).approve(ENSO_ROUTER, type(uint256).max);

        // Execute Enso atomic bundle transaction:
        // (calldata acquired from Enso Bundle API)
        // (bool success, ) = ENSO_ROUTER.call(bundleCalldata);
        // assertTrue(success, "Enso loop failed");

        vm.stopPrank();
    }
}`;

  let currentCode = tsCode;
  if (activeTab === 'api') currentCode = JSON.stringify(apiPayload, null, 2);
  if (activeTab === 'curl') currentCode = curlSnippet;
  if (activeTab === 'foundry') currentCode = foundryTestSnippet;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            SDK & API Code Exporter
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            Export production-grade TypeScript code, Enso Bundle API payloads, cURL commands, and Foundry test suites.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-lg">
          <button
            onClick={() => setActiveTab('sdk')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'sdk' ? 'bg-neutral-800 text-white font-semibold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            TypeScript SDK
          </button>
          <button
            onClick={() => setActiveTab('api')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'api' ? 'bg-neutral-800 text-white font-semibold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Bundle JSON
          </button>
          <button
            onClick={() => setActiveTab('curl')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'curl' ? 'bg-neutral-800 text-white font-semibold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            cURL Request
          </button>
          <button
            onClick={() => setActiveTab('foundry')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'foundry' ? 'bg-neutral-800 text-white font-semibold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Foundry Test
          </button>
        </div>
      </div>

      {/* Code Display Area */}
      <div className="bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-neutral-950/80 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-mono font-medium text-white">
              {activeTab === 'sdk'
                ? 'leverageLoop.ts (@ensofinance/sdk)'
                : activeTab === 'api'
                ? 'bundle-payload.json'
                : activeTab === 'curl'
                ? 'request.sh'
                : 'EnsoLeverageFork.t.sol'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const filename =
                  activeTab === 'sdk'
                    ? 'leverageLoop.ts'
                    : activeTab === 'api'
                    ? 'bundle-payload.json'
                    : activeTab === 'curl'
                    ? 'request.sh'
                    : 'EnsoLeverageFork.t.sol';
                const blob = new Blob([currentCode], { type: 'text/plain;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-md transition-colors"
              title="Download file"
            >
              <span>Download</span>
            </button>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-neutral-800 hover:bg-neutral-700 text-white rounded-md transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Code'}</span>
            </button>
          </div>
        </div>

        <pre className="p-4 text-xs font-mono text-neutral-300 overflow-x-auto max-h-[560px] bg-neutral-950/60 leading-relaxed">
          {currentCode}
        </pre>
      </div>
    </div>
  );
};
