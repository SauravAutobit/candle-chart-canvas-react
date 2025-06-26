import React, { useState } from "react";
import CandlestickCharts from "./CandlestickCharts";

type LayoutType = "1" | "2" | "4" | "6";

interface Props {
  data: any[]; // array of CandleData[]
}

const MultiChartLayout: React.FC<Props> = ({ data }) => {
  const [layout, setLayout] = useState<LayoutType>("1");

  const getGridStyle = () => {
    switch (layout) {
      case "1":
        return "grid-cols-1 grid-rows-1";
      case "2":
        return "grid-cols-2 grid-rows-1";
      case "4":
        return "grid-cols-2 grid-rows-2";
      case "6":
        return "grid-cols-3 grid-rows-2";
      default:
        return "grid-cols-1 grid-rows-1";
    }
  };

  const layoutOptions: { label: string; value: LayoutType }[] = [
    { label: "1", value: "1" },
    { label: "2", value: "2" },
    { label: "4", value: "4" },
    { label: "6", value: "6" },
  ];

  return (
    <div>
      <div className="mb-4 flex gap-2">
        {layoutOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setLayout(opt.value)}
            className={`px-4 py-1 text-sm rounded ${
              layout === opt.value
                ? "bg-blue-500 text-white"
                : "bg-gray-700 text-gray-300"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div
        className={`grid ${getGridStyle()} gap-4`}
        style={{ height: "1000px" }}
      >
        {Array.from({ length: parseInt(layout) }).map((_, i) => (
          <div key={i} className="bg-gray-800 rounded p-2">
            <CandlestickCharts
              data={data[i % data.length]} // reuse or rotate data
              width={1000}
              height={600}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default MultiChartLayout;
