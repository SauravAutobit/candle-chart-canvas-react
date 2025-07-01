// ResizableChart.tsx
import React from "react";
import { Rnd } from "react-rnd";
import CandlestickCharts from "./CandlestickCharts";

interface Props {
  index: number;
  data: any[];
  defaultWidth?: number | string;
  defaultHeight?: number | string;
}

const ResizableChart: React.FC<Props> = ({
  index,
  data,
  defaultWidth = "100%",
  defaultHeight = "100%",
}) => {
  return (
    <Rnd
      default={{
        width: defaultWidth,
        height: defaultHeight,
        x: 0,
        y: 0,
      }}
      minWidth={100}
      minHeight={100}
      bounds="parent"
      enableResizing={{
        bottom: true,
        right: true,
        bottomRight: true,
      }}
      style={{
        width:
          typeof defaultWidth === "string" ? defaultWidth : `${defaultWidth}px`,
        height:
          typeof defaultHeight === "string"
            ? defaultHeight
            : `${defaultHeight}px`,

        border: "1px solid #444",
        backgroundColor: "#1e1e1e",
        borderRadius: 8,
      }}
    >
      <div className="w-full h-full rounded overflow-hidden">
        <CandlestickCharts data={data[index % data.length]} />
      </div>
    </Rnd>
  );
};

export default ResizableChart;
