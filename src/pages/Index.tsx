import React from "react";
import TradingChart from "@/components/TradingChart";
import { sampleCandleData } from "@/utils/sampleTradingData";
import CandlestickCharts from "@/components/CandlestickCharts";
import MultiChartLayout from "@/components/MultiChartLayout";

type CandleData = {
  open: number;
  high: number;
  low: number;
  close: number;
  timestamp: number;
};

const generateRandomCandlestickData = (count: number): CandleData[] => {
  const data: CandleData[] = [];
  let previousClose = 100;
  const startTime = new Date("2024-01-01T09:00:00").getTime();

  for (let i = 0; i < count; i++) {
    const open = previousClose + (Math.random() - 0.5) * 5;
    const high = open + Math.random() * 10;
    const low = open - Math.random() * 10;
    const close = low + Math.random() * (high - low);

    data.push({
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      timestamp: startTime + i * 24 * 60 * 60 * 1000,
    });

    previousClose = close;
  }

  return data;
};

const Index = () => {
  const data = generateRandomCandlestickData(150);
  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-white">
          Candlestick Trading Chart
        </h1>
        <p className="text-gray-300 mb-6">
          Interactive financial chart built with PixiJS for high-performance
          rendering
        </p>

        <div
          className="bg-gray-800 rounded-lg p-6 shadow-xl"
          style={{ cursor: "crosshair" }}
        >
          {/* The TradingChart component displays our candlestick chart */}
          {/* <TradingChart 
            candleData={sampleCandleData} 
            width={800} 
            height={500} 
          /> */}
          {/* <CandlestickCharts data={data} width={1000} height={600} /> */}
          <div>
            <MultiChartLayout data={[data, data, data, data, data, data]} />
          </div>
        </div>

        <div className="mt-8 text-gray-400">
          <h2 className="text-xl font-semibold mb-2 text-white">
            Understanding This Chart
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              Each <span className="text-green-500">green candlestick</span>{" "}
              indicates price increased (close &gt; open)
            </li>
            <li>
              Each <span className="text-red-500">red candlestick</span>{" "}
              indicates price decreased (close &lt; open)
            </li>
            <li>
              The thin vertical lines show the highest and lowest prices reached
            </li>
            <li>The colored rectangle shows the open and close prices</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Index;
