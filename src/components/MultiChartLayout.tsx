import React, { useEffect, useState } from "react";
import CandlestickCharts from "./CandlestickCharts";
import {
  registerLayoutHandler,
  LayoutType,
  getChartConfig,
  parseNestedPaneSizes,
} from "./ChartManager";
import ResizablePane from "./ResizablePane";

interface Props {
  data: any[];
}

const MultiChartLayout: React.FC<Props> = ({ data }) => {
  const [layout, setLayout] = useState<LayoutType>("1");

  useEffect(() => {
    registerLayoutHandler(setLayout);
  }, []);

  const { resizable, sizes } = getChartConfig(layout);
  console.log("check multichart");

  // remove -> window manager
  const renderLayout = () => {
    const getChart = (i: number) => (
      <div key={i} className="bg-gray-800 rounded w-full h-full">
        <CandlestickCharts data={data[i % data.length]} />
      </div>
    );

    const { horizontalSizes, verticalSizes, nestedHorizontal, nestedVertical } =
      parseNestedPaneSizes(layout, sizes);

    switch (layout) {
      case "1":
        return <div className="w-full h-full">{getChart(0)}</div>;

      case "2H":
        return (
          // <ResizablePane direction="horizontal">
          //   {[getChart(0), getChart(1)]}
          // </ResizablePane>
          <ResizablePane
            direction="horizontal"
            resizable={resizable}
            initialSizes={sizes}
          >
            {[getChart(0), getChart(1)]}
          </ResizablePane>
        );

      case "2V":
        return (
          <ResizablePane
            direction="vertical"
            resizable={resizable}
            initialSizes={sizes}
          >
            {[getChart(0), getChart(1)]}
          </ResizablePane>
        );

      case "3H":
        return (
          <ResizablePane
            direction="horizontal"
            resizable={resizable}
            initialSizes={sizes}
          >
            {[getChart(0), getChart(1), getChart(2)]}
          </ResizablePane>
        );

      case "3V":
        return (
          <ResizablePane
            direction="vertical"
            resizable={resizable}
            initialSizes={sizes}
          >
            {[getChart(0), getChart(1), getChart(2)]}
          </ResizablePane>
        );

      case "3L-R2": {
        const horizontalSizes =
          sizes?.length === 3 ? [sizes[0], 100 - sizes[0]] : undefined;
        const verticalSizes =
          sizes?.length === 3 ? [sizes[1], sizes[2]] : undefined;
        return (
          <ResizablePane
            direction="horizontal"
            resizable={resizable}
            initialSizes={horizontalSizes}
          >
            {[
              getChart(0),
              <ResizablePane
                direction="vertical"
                resizable={resizable}
                initialSizes={verticalSizes}
                key="right"
              >
                {[getChart(1), getChart(2)]}
              </ResizablePane>,
            ]}
          </ResizablePane>
        );
      }

      case "3R-L2":
        return (
          <ResizablePane
            direction="horizontal"
            resizable={resizable}
            initialSizes={horizontalSizes}
          >
            {[
              <ResizablePane
                direction="vertical"
                resizable={resizable}
                initialSizes={verticalSizes}
                key="left"
              >
                {[getChart(0), getChart(1)]}
              </ResizablePane>,
              getChart(2),
            ]}
          </ResizablePane>
        );

      case "3T-B2":
        return (
          <ResizablePane direction="vertical">
            {[
              getChart(0),
              <ResizablePane direction="horizontal" key="bottom">
                {[getChart(1), getChart(2)]}
              </ResizablePane>,
            ]}
          </ResizablePane>
        );

      case "3B-T2":
        return (
          <ResizablePane direction="vertical">
            {[
              <ResizablePane direction="horizontal" key="top">
                {[getChart(0), getChart(1)]}
              </ResizablePane>,
              getChart(2),
            ]}
          </ResizablePane>
        );

      case "4":
        return (
          <ResizablePane direction="vertical">
            {[
              <ResizablePane direction="horizontal" key="top">
                {[getChart(0), getChart(1)]}
              </ResizablePane>,
              <ResizablePane direction="horizontal" key="bottom">
                {[getChart(2), getChart(3)]}
              </ResizablePane>,
            ]}
          </ResizablePane>
        );

      case "4L":
        return (
          <ResizablePane direction="horizontal">
            {[getChart(0), getChart(1), getChart(2), getChart(3)]}
          </ResizablePane>
        );

      case "4V":
        return (
          <ResizablePane direction="vertical">
            {[getChart(0), getChart(1), getChart(2), getChart(3)]}
          </ResizablePane>
        );

      case "4L-R3":
        return (
          <ResizablePane direction="horizontal">
            {[
              getChart(0),
              <ResizablePane direction="vertical" key="right">
                {[getChart(1), getChart(2), getChart(3)]}
              </ResizablePane>,
            ]}
          </ResizablePane>
        );

      case "4R-L3":
        return (
          <ResizablePane direction="horizontal">
            {[
              <ResizablePane direction="vertical" key="left">
                {[getChart(0), getChart(1), getChart(2)]}
              </ResizablePane>,
              getChart(3),
            ]}
          </ResizablePane>
        );

      case "4T-B3":
        return (
          <ResizablePane direction="vertical">
            {[
              getChart(0),
              <ResizablePane direction="horizontal" key="bottom">
                {[getChart(1), getChart(2), getChart(3)]}
              </ResizablePane>,
            ]}
          </ResizablePane>
        );

      case "4B-T3":
        return (
          <ResizablePane direction="vertical">
            {[
              <ResizablePane direction="horizontal" key="top">
                {[getChart(0), getChart(1), getChart(2)]}
              </ResizablePane>,
              getChart(3),
            ]}
          </ResizablePane>
        );

      case "4L2-R2":
        return (
          <ResizablePane direction="horizontal">
            {[
              <ResizablePane direction="horizontal" key="left">
                {[getChart(0), getChart(1)]}
              </ResizablePane>,
              <ResizablePane direction="vertical" key="right">
                {[getChart(2), getChart(3)]}
              </ResizablePane>,
            ]}
          </ResizablePane>
        );

      case "4R2-L2":
        return (
          <ResizablePane direction="horizontal">
            {[
              <ResizablePane direction="vertical" key="left">
                {[getChart(0), getChart(1)]}
              </ResizablePane>,
              <ResizablePane direction="horizontal" key="right">
                {[getChart(2), getChart(3)]}
              </ResizablePane>,
            ]}
          </ResizablePane>
        );

      case "4T2-B2":
        return (
          <ResizablePane direction="vertical">
            {[
              <ResizablePane direction="horizontal" key="top">
                {[getChart(0), getChart(1)]}
              </ResizablePane>,
              <ResizablePane direction="vertical" key="bottom">
                {[getChart(2), getChart(3)]}
              </ResizablePane>,
            ]}
          </ResizablePane>
        );

      case "5":
        return (
          <ResizablePane direction="vertical">
            {[
              <ResizablePane direction="horizontal" key="top">
                {[getChart(0), getChart(1), getChart(2)]}
              </ResizablePane>,
              <ResizablePane direction="horizontal" key="bottom">
                {[getChart(3), getChart(4)]}
              </ResizablePane>,
            ]}
          </ResizablePane>
        );

      case "6":
        return (
          <ResizablePane direction="vertical">
            {[
              <ResizablePane direction="horizontal" key="top">
                {[getChart(0), getChart(1), getChart(2)]}
              </ResizablePane>,
              <ResizablePane direction="horizontal" key="bottom">
                {[getChart(3), getChart(4), getChart(5)]}
              </ResizablePane>,
            ]}
          </ResizablePane>
        );

      case "6V":
        return (
          <ResizablePane direction="horizontal">
            {[
              <ResizablePane direction="vertical" key="left">
                {[getChart(0), getChart(1), getChart(2)]}
              </ResizablePane>,
              <ResizablePane direction="vertical" key="right">
                {[getChart(3), getChart(4), getChart(5)]}
              </ResizablePane>,
            ]}
          </ResizablePane>
        );

      case "7":
        return (
          <ResizablePane direction="vertical">
            {[
              <ResizablePane direction="horizontal" key="top">
                {[getChart(0), getChart(1), getChart(2), getChart(3)]}
              </ResizablePane>,
              <ResizablePane direction="horizontal" key="bottom">
                {[getChart(4), getChart(5), getChart(6)]}
              </ResizablePane>,
            ]}
          </ResizablePane>
        );

      case "8":
        return (
          <ResizablePane direction="vertical">
            {[
              <ResizablePane direction="horizontal" key="top">
                {[getChart(0), getChart(1), getChart(2), getChart(3)]}
              </ResizablePane>,
              <ResizablePane direction="horizontal" key="bottom">
                {[getChart(4), getChart(5), getChart(6), getChart(7)]}
              </ResizablePane>,
            ]}
          </ResizablePane>
        );

      case "9":
        return (
          <ResizablePane direction="vertical">
            {[
              <ResizablePane direction="horizontal" key="row1">
                {[getChart(0), getChart(1), getChart(2)]}
              </ResizablePane>,
              <ResizablePane direction="horizontal" key="row2">
                {[getChart(3), getChart(4), getChart(5)]}
              </ResizablePane>,
              <ResizablePane direction="horizontal" key="row3">
                {[getChart(6), getChart(7), getChart(8)]}
              </ResizablePane>,
            ]}
          </ResizablePane>
        );

      case "10":
        return (
          <ResizablePane direction="vertical">
            {[
              <ResizablePane direction="horizontal" key="row1">
                {[
                  getChart(0),
                  getChart(1),
                  getChart(2),
                  getChart(3),
                  getChart(4),
                ]}
              </ResizablePane>,
              <ResizablePane direction="horizontal" key="row2">
                {[
                  getChart(5),
                  getChart(6),
                  getChart(7),
                  getChart(8),
                  getChart(9),
                ]}
              </ResizablePane>,
            ]}
          </ResizablePane>
        );

      case "12":
        return (
          <ResizablePane direction="vertical">
            {[
              <ResizablePane direction="horizontal" key="row1">
                {[getChart(0), getChart(1), getChart(2), getChart(3)]}
              </ResizablePane>,
              <ResizablePane direction="horizontal" key="row2">
                {[getChart(4), getChart(5), getChart(6), getChart(7)]}
              </ResizablePane>,
              <ResizablePane direction="horizontal" key="row3">
                {[getChart(8), getChart(9), getChart(10), getChart(11)]}
              </ResizablePane>,
            ]}
          </ResizablePane>
        );

      case "14":
        return (
          <ResizablePane direction="vertical">
            {[
              <ResizablePane direction="horizontal" key="row1">
                {Array.from({ length: 7 }, (_, i) => getChart(i))}
              </ResizablePane>,
              <ResizablePane direction="horizontal" key="row2">
                {Array.from({ length: 7 }, (_, i) => getChart(i + 7))}
              </ResizablePane>,
            ]}
          </ResizablePane>
        );

      case "16":
        return (
          <ResizablePane direction="vertical">
            {[
              <ResizablePane direction="horizontal" key="row1">
                {[getChart(0), getChart(1), getChart(2), getChart(3)]}
              </ResizablePane>,
              <ResizablePane direction="horizontal" key="row2">
                {[getChart(4), getChart(5), getChart(6), getChart(7)]}
              </ResizablePane>,
              <ResizablePane direction="horizontal" key="row3">
                {[getChart(8), getChart(9), getChart(10), getChart(11)]}
              </ResizablePane>,
              <ResizablePane direction="horizontal" key="row4">
                {[getChart(12), getChart(13), getChart(14), getChart(15)]}
              </ResizablePane>,
            ]}
          </ResizablePane>
        );

      default:
        return <div className="w-full h-full">{getChart(0)}</div>;
    }
  };

  return <div className="w-full h-full">{renderLayout()}</div>;
};

export default MultiChartLayout;
