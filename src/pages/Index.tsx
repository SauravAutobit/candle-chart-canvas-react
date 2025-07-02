import { useEffect } from "react";
import MultiChartLayout from "@/components/MultiChartLayout";
import {
  generateRandomCandlestickData,
  isLayoutHandlerReady,
  setInitialPaneSizes,
  setLayout,
  setResizableCharts,
} from "@/components/ChartManager";

const Index = () => {
  const data = generateRandomCandlestickData(150);
  console.log("data", data);
  useEffect(() => {
    const trySetLayout = () => {
      if (isLayoutHandlerReady()) {
        setResizableCharts(true);
        // setInitialPaneSizes("3L-R2", [20, 70, 30]);
        setLayout("3L-R2");
      } else {
        setTimeout(trySetLayout, 100); // Retry every 100ms
      }
    };
    trySetLayout();
  }, []);
  return (
    <div className="min-h-screen bg-gray-900">
      <div
        className="bg-gray-800 rounded-lg shadow-xl w-full h-screen overflow-hidden"
        style={{ cursor: "crosshair" }}
      >
        <MultiChartLayout data={[data, data, data, data, data, data]} />
      </div>
    </div>
  );
};

export default Index;
