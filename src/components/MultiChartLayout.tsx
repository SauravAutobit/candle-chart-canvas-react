import React, { useEffect, useState } from "react";
import CandlestickCharts from "./CandlestickCharts";
import { registerLayoutHandler, LayoutType } from "./ChartManager";

interface Props {
  data: any[];
}

const MultiChartLayout: React.FC<Props> = ({ data }) => {
  const [layout, setLayout] = useState<LayoutType>("1");

  useEffect(() => {
    registerLayoutHandler(setLayout);
  }, []);

  const renderLayout = () => {
    const getChart = (i: number) => (
      <div key={i} className="bg-gray-800 rounded w-full h-full">
        <CandlestickCharts data={data[i % data.length]} />
      </div>
    );

    switch (layout) {
      case "1":
        return <div className="w-full h-full">{getChart(0)}</div>;

      case "2H":
        return (
          <div className="grid grid-cols-2 w-full h-full gap-1">
            {[0, 1].map(getChart)}
          </div>
        );

      case "2V":
        return (
          <div className="grid grid-rows-2 w-full h-full gap-1">
            {[0, 1].map(getChart)}
          </div>
        );

      case "3H":
        return (
          <div className="grid grid-cols-3 w-full h-full gap-1">
            {[0, 1, 2].map(getChart)}
          </div>
        );

      case "3V":
        return (
          <div className="grid grid-rows-3 w-full h-full gap-1">
            {[0, 1, 2].map(getChart)}
          </div>
        );

      case "3L-R2":
        return (
          <div className="flex w-full h-full gap-1">
            <div className="w-1/2 h-full">{getChart(0)}</div>
            <div className="w-1/2 h-full flex flex-col gap-1">
              <div className="h-1/2">{getChart(1)}</div>
              <div className="h-1/2">{getChart(2)}</div>
            </div>
          </div>
        );

      case "3R-L2":
        return (
          <div className="flex w-full h-full gap-1">
            <div className="w-1/2 h-full flex flex-col gap-1">
              <div className="h-1/2">{getChart(0)}</div>
              <div className="h-1/2">{getChart(1)}</div>
            </div>
            <div className="w-1/2 h-full">{getChart(2)}</div>
          </div>
        );

      case "3T-B2":
        return (
          <div className="flex flex-col w-full h-full gap-1">
            <div className="h-1/2 w-full">{getChart(0)}</div>
            <div className="h-1/2 flex gap-1">
              <div className="w-1/2">{getChart(1)}</div>
              <div className="w-1/2">{getChart(2)}</div>
            </div>
          </div>
        );

      case "3B-T2":
        return (
          <div className="flex flex-col w-full h-full gap-1">
            <div className="h-1/2 flex gap-1">
              <div className="w-1/2">{getChart(0)}</div>
              <div className="w-1/2">{getChart(1)}</div>
            </div>
            <div className="h-1/2 w-full">{getChart(2)}</div>
          </div>
        );

      case "4":
        return (
          <div className="grid grid-cols-2 grid-rows-2 w-full h-full gap-1">
            {[0, 1, 2, 3].map(getChart)}
          </div>
        );

      case "4L":
        return (
          <div className="grid grid-cols-4 w-full h-full gap-1">
            {[0, 1, 2, 3].map(getChart)}
          </div>
        );

      case "4V":
        return (
          <div className="grid grid-rows-4 w-full h-full gap-1">
            {[0, 1, 2, 3].map(getChart)}
          </div>
        );

      case "4L-R3":
        return (
          <div className="flex w-full h-full gap-1">
            <div className="w-1/2 h-full">{getChart(0)}</div>
            <div className="w-1/2 h-full flex flex-col gap-1">
              <div className="h-1/3">{getChart(1)}</div>
              <div className="h-1/3">{getChart(2)}</div>
              <div className="h-1/3">{getChart(3)}</div>
            </div>
          </div>
        );

      case "4R-L3":
        return (
          <div className="flex w-full h-full gap-1">
            <div className="w-1/2 h-full flex flex-col gap-1">
              <div className="h-1/3">{getChart(0)}</div>
              <div className="h-1/3">{getChart(1)}</div>
              <div className="h-1/3">{getChart(2)}</div>
            </div>
            <div className="w-1/2 h-full">{getChart(3)}</div>
          </div>
        );

      case "4T-B3":
        return (
          <div className="flex flex-col w-full h-full gap-1">
            <div className="h-1/2 w-full">{getChart(0)}</div>
            <div className="h-1/2 flex gap-1">
              <div className="w-1/3">{getChart(1)}</div>
              <div className="w-1/3">{getChart(2)}</div>
              <div className="w-1/3">{getChart(3)}</div>
            </div>
          </div>
        );

      case "4B-T3":
        return (
          <div className="flex flex-col w-full h-full gap-1">
            <div className="h-1/2 flex gap-1">
              <div className="w-1/3">{getChart(0)}</div>
              <div className="w-1/3">{getChart(1)}</div>
              <div className="w-1/3">{getChart(2)}</div>
            </div>
            <div className="h-1/2 w-full">{getChart(3)}</div>
          </div>
        );

      case "4L2-R2":
        return (
          <div className="flex w-full h-full gap-1">
            <div className="w-1/2 h-full flex gap-1">
              <div className="w-1/2 h-full">{getChart(0)}</div>
              <div className="w-1/2 h-full">{getChart(1)}</div>
            </div>
            <div className="w-1/2 h-full flex flex-col gap-1">
              <div className="h-1/2">{getChart(2)}</div>
              <div className="h-1/2">{getChart(3)}</div>
            </div>
          </div>
        );

      case "4R2-L2":
        return (
          <div className="flex w-full h-full gap-1">
            <div className="w-1/2 h-full flex flex-col gap-1">
              <div className="h-1/2">{getChart(0)}</div>
              <div className="h-1/2">{getChart(1)}</div>
            </div>

            <div className="w-1/2 h-full flex gap-1">
              <div className="w-1/2 h-full">{getChart(2)}</div>
              <div className="w-1/2 h-full">{getChart(3)}</div>
            </div>
          </div>
        );

      case "4T2-B2":
        return (
          <div className="flex flex-col w-full h-full gap-1">
            <div className="h-1/2 flex gap-1">
              <div className="w-1/2">{getChart(0)}</div>
              <div className="w-1/2">{getChart(1)}</div>
            </div>

            <div className="h-1/2 flex flex-col gap-1">
              <div className="h-1/2">{getChart(2)}</div>
              <div className="h-1/2">{getChart(3)}</div>
            </div>
          </div>
        );

      case "5":
        return (
          <div className="grid grid-cols-3 grid-rows-2 w-full h-full gap-1">
            {[0, 1, 2, 3, 4].map(getChart)}
          </div>
        );

      case "6":
        return (
          <div className="grid grid-cols-3 grid-rows-2 w-full h-full gap-1">
            {[0, 1, 2, 3, 4, 5].map(getChart)}
          </div>
        );

      case "6V":
        return (
          <div className="grid grid-cols-2 grid-rows-3 w-full h-full gap-1">
            {[0, 1, 2, 3, 4, 5].map(getChart)}
          </div>
        );

      case "7":
        return (
          <div className="grid grid-cols-4 grid-rows-2 w-full h-full gap-1">
            {Array.from({ length: 7 }).map((_, i) => getChart(i))}
          </div>
        );

      case "8":
        return (
          <div className="grid grid-cols-4 grid-rows-2 w-full h-full gap-1">
            {Array.from({ length: 8 }).map((_, i) => getChart(i))}
          </div>
        );

      case "9":
        return (
          <div className="grid grid-cols-3 grid-rows-3 w-full h-full gap-1">
            {Array.from({ length: 9 }).map((_, i) => getChart(i))}
          </div>
        );

      case "10":
        return (
          <div className="grid grid-cols-5 grid-rows-2 w-full h-full gap-1">
            {Array.from({ length: 10 }).map((_, i) => getChart(i))}
          </div>
        );

      case "12":
        return (
          <div className="grid grid-cols-4 grid-rows-3 w-full h-full gap-1">
            {Array.from({ length: 12 }).map((_, i) => getChart(i))}
          </div>
        );

      case "14":
        return (
          <div className="grid grid-cols-7 grid-rows-2 w-full h-full gap-1">
            {Array.from({ length: 14 }).map((_, i) => getChart(i))}
          </div>
        );

      case "16":
        return (
          <div className="grid grid-cols-4 grid-rows-4 w-full h-full gap-1">
            {Array.from({ length: 16 }).map((_, i) => getChart(i))}
          </div>
        );

      default:
        return <div className="w-full h-full">{getChart(0)}</div>;
    }
  };

  return <div className="w-full h-full">{renderLayout()}</div>;
};

export default MultiChartLayout;
