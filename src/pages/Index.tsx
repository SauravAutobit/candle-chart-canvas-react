
import React from 'react';
import TradingChart from '@/components/TradingChart';
import { sampleCandleData } from '@/utils/sampleTradingData';

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-white">
          Candlestick Trading Chart
        </h1>
        <p className="text-gray-300 mb-6">
          Interactive financial chart built with PixiJS for high-performance rendering
        </p>
        
        <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
          {/* The TradingChart component displays our candlestick chart */}
          <TradingChart 
            candleData={sampleCandleData} 
            width={800} 
            height={500} 
          />
        </div>
        
        <div className="mt-8 text-gray-400">
          <h2 className="text-xl font-semibold mb-2 text-white">Understanding This Chart</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Each <span className="text-green-500">green candlestick</span> indicates price increased (close &gt; open)</li>
            <li>Each <span className="text-red-500">red candlestick</span> indicates price decreased (close &lt; open)</li>
            <li>The thin vertical lines show the highest and lowest prices reached</li>
            <li>The colored rectangle shows the open and close prices</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Index;
