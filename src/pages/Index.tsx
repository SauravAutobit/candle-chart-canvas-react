import { useEffect } from "react";
import MultiChartLayout from "@/components/MultiChartLayout";
import WindowManager from "@/components/WindowManager";
import { isLayoutHandlerReady, setLayout } from "@/components/ChartManager";

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

  useEffect(() => {
    const trySetLayout = () => {
      if (isLayoutHandlerReady()) {
        setLayout("4T2-B2");
      } else {
        setTimeout(trySetLayout, 100); // Retry every 100ms
      }
    };
    trySetLayout();
  }, []);
  return (
    <div className="min-h-screen bg-gray-900">
      <div
        className="bg-gray-800 rounded-lg shadow-xl h-screen overflow-hidden"
        style={{ cursor: "crosshair" }}
      >
        <MultiChartLayout data={[data, data, data, data, data, data]} />
        {/* <WindowManager data={data} /> */}
      </div>
    </div>
  );
};

export default Index;
