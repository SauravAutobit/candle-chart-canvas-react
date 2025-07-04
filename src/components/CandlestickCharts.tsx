// no jump just zoom pann not wokring

import React, { useEffect, useRef, useState } from "react";
import * as PIXI from "pixi.js";
import { before } from "node:test";
import {
  calculateHMA,
  calculateMcGinley,
  calculateMedianPrice,
  calculateParabolicSAR,
  calculateSMA,
  calculateSuperTrend,
} from "./ChartManager";

interface CandleData {
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  timestamp: number;
}

const chartTypes = [
  "Candlestick",
  "Hollow Candles",
  "Line",
  "Area",
  "Volume Bars",
  "Step Line",
  "Line with Markers",
  "Bars",
  "HLC",
  "Baseline",
  "Columns",
] as const;
// "High-Low", "Renko", "Heikin Ashi", "Line Break", "Kagi", "Point & Figure", "Range",
type ChartType = (typeof chartTypes)[number];

interface Props {
  data: CandleData[];
  // width?: number;
  // height?: number;
}

const CandlestickCharts: React.FC<Props> = ({
  data,
  // width = 800,
  // height = 500,
}) => {
  const [chartType, setChartType] = useState<ChartType>("Candlestick");
  const [indicator, setIndicator] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

  const [refresh, setRefresh] = useState(0);

  const chartRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const scaleRef = useRef(1);
  const offsetXRef = useRef(0);

  // Track containers and graphics for redraw
  const chartContainerRef = useRef<PIXI.Container | null>(null);
  const aroonContainerRef = useRef<PIXI.Container | null>(null);
  const axisContainerRef = useRef<PIXI.Container | null>(null);
  const graphicsRef = useRef<PIXI.Graphics | null>(null);
  const tooltipRef = useRef<PIXI.Text | null>(null);
  const crosshairRef = useRef<PIXI.Graphics | null>(null);

  // Only create PIXI app once
  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    const width = dimensions.width;
    const height = dimensions.height;
    const xAxisHeight = 30;
    const totalHeight = height + xAxisHeight;

    const app = new PIXI.Application({
      width,
      height: totalHeight,
      backgroundColor: 0x000000,
      antialias: true,
    });
    appRef.current = app;
    el.appendChild(app.view as unknown as Node); // Fix type error

    // Containers
    const chartContainer = new PIXI.Container();
    const aroonContainer = new PIXI.Container();
    const axisContainer = new PIXI.Container();
    const graphics = new PIXI.Graphics();
    chartContainer.addChild(graphics);
    app.stage.addChild(chartContainer);
    app.stage.addChild(aroonContainer);
    app.stage.addChild(axisContainer);
    const tooltip = new PIXI.Text("", { fontSize: 12, fill: 0xffffff });
    tooltip.visible = false;
    app.stage.addChild(tooltip);
    const crosshair = new PIXI.Graphics();
    app.stage.addChild(crosshair);

    // Store refs
    chartContainerRef.current = chartContainer;
    aroonContainerRef.current = aroonContainer;
    axisContainerRef.current = axisContainer;
    graphicsRef.current = graphics;
    tooltipRef.current = tooltip;
    crosshairRef.current = crosshair;

    // Clean up on unmount
    return () => {
      app.destroy(true, true);
      if (el) el.innerHTML = "";
    };
  }, []);

  // Resize observer (same as before)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({
          width,
          height: height - 30, // minus x-axis height
        });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []); // Empty dependency array

  // Redraw chart on data, dimensions, chartType, indicator
  useEffect(() => {
    const app = appRef.current;
    if (!app) return;
    const width = dimensions.width;
    const height = dimensions.height;
    const xAxisHeight = 30;
    let aroonHeight = 0;
    if (indicator === "Aroon") aroonHeight = 100;
    const totalHeight = height + xAxisHeight + aroonHeight;
    if (app.view.width !== width || app.view.height !== totalHeight) {
      app.renderer.resize(width, totalHeight);
    }
    // Clear containers
    graphicsRef.current?.clear();
    aroonContainerRef.current?.removeChildren();
    axisContainerRef.current?.removeChildren();
    crosshairRef.current?.clear();
    if (tooltipRef.current) tooltipRef.current.visible = false;

    // Helper for drawing X axis labels
    function drawXAxisLabels(
      startIndex: number,
      visibleData: CandleData[],
      scaledSpacing: number
    ) {
      const skip = Math.ceil(80 / scaledSpacing);
      for (let i = 0; i < visibleData.length; i++) {
        const d = visibleData[i];
        const idx = startIndex + i;
        const x = idx * scaledSpacing + offsetXRef.current;
        if (idx % skip === 0) {
          const label = new PIXI.Text(
            new Date(d.timestamp).toLocaleDateString(),
            { fontSize: 10, fill: 0xffffff }
          );
          label.position.set(x - 10, totalHeight - xAxisHeight + 5);
          axisContainerRef.current?.addChild(label);
        }
      }
    }

    // All drawing logic from previous redraw() function goes here, using refs
    const scaledSpacing = 10 * scaleRef.current;
    const candleWidth = scaledSpacing * 0.6;

    const visibleCount = Math.ceil(width / scaledSpacing);
    const startIndex = Math.max(
      0,
      Math.floor(-offsetXRef.current / scaledSpacing)
    );
    const endIndex = Math.min(data.length, startIndex + visibleCount + 2);
    const visibleData = data.slice(startIndex, endIndex);

    const max = Math.max(...visibleData.map((d) => d.high));
    const min = Math.min(...visibleData.map((d) => d.low));
    const range = max - min || 1;
    const scaleY = height / range;

    const xFor = (idx: number) =>
      idx * scaledSpacing + offsetXRef.current + candleWidth / 2;
    const yFor = (price: number) => height - (price - min) * scaleY;

    const drawCandle = (d: CandleData, x: number) => {
      const openY = yFor(d.open);
      const closeY = yFor(d.close);
      const highY = yFor(d.high);
      const lowY = yFor(d.low);
      const isBull = d.close >= d.open;
      const color = isBull ? 0x089981 : 0xf23645;

      graphicsRef.current!.lineStyle(1, color);
      graphicsRef.current!.moveTo(x, highY);
      graphicsRef.current!.lineTo(x, lowY);

      if (chartType === "Candlestick") {
        graphicsRef.current!.beginFill(color);
        graphicsRef.current!.drawRect(
          x - candleWidth / 2,
          Math.min(openY, closeY),
          candleWidth,
          Math.max(1, Math.abs(closeY - openY))
        );
        graphicsRef.current!.endFill();
      } else if (chartType === "Hollow Candles") {
        graphicsRef.current!.drawRect(
          x - candleWidth / 2,
          Math.min(openY, closeY),
          candleWidth,
          Math.max(1, Math.abs(closeY - openY))
        );
      }
    };

    visibleData.forEach((d, i) => {
      const idx = startIndex + i;
      const x = xFor(idx);

      if (["Candlestick", "Hollow Candles"].includes(chartType))
        drawCandle(d, x);

      if (chartType === "Bars" || chartType === "HLC") {
        const openY = yFor(d.open);
        const closeY = yFor(d.close);
        const highY = yFor(d.high);
        const lowY = yFor(d.low);
        const color = d.close >= d.open ? 0x089981 : 0xf23645;

        graphicsRef.current!.lineStyle(1, color);
        graphicsRef.current!.moveTo(x, highY);
        graphicsRef.current!.lineTo(x, lowY);

        if (chartType === "Bars") {
          graphicsRef.current!.moveTo(x - 4, openY);
          graphicsRef.current!.lineTo(x, openY);
        }
        graphicsRef.current!.moveTo(x, closeY);
        graphicsRef.current!.lineTo(x + 4, closeY);
      }

      if (chartType === "Volume Bars" || chartType === "Columns") {
        const color = d.close >= d.open ? 0x089981 : 0xf23645;
        const y = yFor(d.close);
        graphicsRef.current!.beginFill(color);
        graphicsRef.current!.drawRect(
          x - candleWidth / 2,
          y,
          candleWidth,
          height - y
        );
        graphicsRef.current!.endFill();
      }

      if (chartType === "Line with Markers") {
        const y = yFor(d.close);
        graphicsRef.current!.beginFill(0x00ccff);
        graphicsRef.current!.drawCircle(x, y, 2);
        graphicsRef.current!.endFill();
      }
    });

    if (
      ["Line", "Area", "Step Line", "Line with Markers", "Baseline"].includes(
        chartType
      )
    ) {
      graphicsRef.current!.lineStyle(1, 0x00ccff);
      graphicsRef.current!.beginFill(
        chartType === "Area" || chartType === "Baseline" ? 0x00ccff : undefined,
        0.2
      );
      visibleData.forEach((d, i) => {
        const x = xFor(startIndex + i);
        const y = yFor(d.close);

        if (i === 0) {
          graphicsRef.current!.moveTo(
            x,
            chartType === "Area" || chartType === "Baseline" ? height : y
          );
          graphicsRef.current!.lineTo(x, y);
        } else if (chartType === "Step Line") {
          const prev = yFor(visibleData[i - 1].close);
          graphicsRef.current!.lineTo(x, prev);
          graphicsRef.current!.lineTo(x, y);
        } else {
          graphicsRef.current!.lineTo(x, y);
        }
      });
      if (chartType === "Area" || chartType === "Baseline") {
        const lastX = xFor(startIndex + visibleData.length - 1);
        graphicsRef.current!.lineTo(lastX, height);
        graphicsRef.current!.lineTo(xFor(startIndex), height);
        graphicsRef.current!.closePath();
      }

      graphicsRef.current!.endFill();
    }

    drawXAxisLabels(startIndex, visibleData, scaledSpacing);

    const steps = 10;
    const priceStep = range / steps;
    for (let i = 0; i <= steps; i++) {
      const price = min + i * priceStep;
      const y = yFor(price);
      const label = new PIXI.Text(price.toFixed(2), {
        fontSize: 10,
        fill: 0xffffff,
      });
      label.position.set(5, y - 6);
      axisContainerRef.current!.addChild(label);

      graphicsRef.current!.lineStyle(0.5, 0x888888, 0.3);
      graphicsRef.current!.moveTo(0, y);
      graphicsRef.current!.lineTo(width, y);
    }
    if (indicator === "MA Cross") {
      const maShort = calculateSMA(data, 5); // 5-period MA
      const maLong = calculateSMA(data, 10); // 10-period MA
      console.log("maShort, maLong", maShort, maLong);
      graphicsRef.current!.lineStyle(1.5, 0xffff00); // Yellow for short MA
      maShort.slice(startIndex, endIndex).forEach((val, i) => {
        if (val === null) return;
        const x = xFor(startIndex + i);
        const y = yFor(val);
        if (i === 0 || maShort[startIndex + i - 1] === null) {
          graphicsRef.current!.moveTo(x, y);
        } else {
          graphicsRef.current!.lineTo(x, y);
        }
      });

      graphicsRef.current!.lineStyle(1.5, 0x00ffff); // Cyan for long MA
      maLong.slice(startIndex, endIndex).forEach((val, i) => {
        if (val === null) return;
        const x = xFor(startIndex + i);
        const y = yFor(val);
        if (i === 0 || maLong[startIndex + i - 1] === null) {
          graphicsRef.current!.moveTo(x, y);
        } else {
          graphicsRef.current!.lineTo(x, y);
        }
      });
    }

    if (indicator === "McGinley Dynamic") {
      const mcg = calculateMcGinley(data);
      graphicsRef.current!.lineStyle(1.5, 0xffaa00); // Orange
      mcg.slice(startIndex, endIndex).forEach((val, i) => {
        if (val === null) return;
        const x = xFor(startIndex + i);
        const y = yFor(val);
        if (i === 0 || mcg[startIndex + i - 1] === null) {
          graphicsRef.current!.moveTo(x, y);
        } else {
          graphicsRef.current!.lineTo(x, y);
        }
      });
    }

    if (indicator === "Median Price") {
      const median = calculateMedianPrice(data);
      graphicsRef.current!.lineStyle(1.5, 0xff00ff); // Pink
      median.slice(startIndex, endIndex).forEach((val, i) => {
        const x = xFor(startIndex + i);
        const y = yFor(val);
        if (i === 0) {
          graphicsRef.current!.moveTo(x, y);
        } else {
          graphicsRef.current!.lineTo(x, y);
        }
      });
    }

    if (indicator === "Hull MA") {
      const hma = calculateHMA(data);
      graphicsRef.current!.lineStyle(1.5, 0x00ff99); // Green
      hma.slice(startIndex, endIndex).forEach((val, i) => {
        if (isNaN(val)) return;
        const x = xFor(startIndex + i);
        const y = yFor(val);
        if (i === 0) {
          graphicsRef.current!.moveTo(x, y);
        } else {
          graphicsRef.current!.lineTo(x, y);
        }
      });
    }

    if (indicator === "Parabolic SAR") {
      const psar = calculateParabolicSAR(data);
      graphicsRef.current!.lineStyle(0);
      psar.slice(startIndex, endIndex).forEach((val, i) => {
        const x = xFor(startIndex + i);
        const y = yFor(val);
        graphicsRef.current!.beginFill(0xff00ff);
        graphicsRef.current!.drawCircle(x, y, 2);
        graphicsRef.current!.endFill();
      });
    }

    if (indicator === "SuperTrend") {
      const supertrend = calculateSuperTrend(data);
      graphicsRef.current!.lineStyle(2, 0x00ffcc);
      supertrend.slice(startIndex, endIndex).forEach((val, i) => {
        if (isNaN(val)) return;
        const x = xFor(startIndex + i);
        const y = yFor(val);
        if (i === 0 || isNaN(supertrend[startIndex + i - 1])) {
          graphicsRef.current!.moveTo(x, y);
        } else {
          graphicsRef.current!.lineTo(x, y);
        }
      });
    }
  }, [data, dimensions, chartType, indicator, refresh]);

  // Handle zoom
  useEffect(() => {
    const app = appRef.current;
    if (!app) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const scaleFactor = 1.1;
      const prevScale = scaleRef.current;

      if (e.deltaY < 0) {
        scaleRef.current *= scaleFactor;
      } else {
        scaleRef.current /= scaleFactor;
      }

      // Clamp
      scaleRef.current = Math.max(0.1, Math.min(10, scaleRef.current));

      // Optional: center zoom around mouse
      // const mouseX = e.clientX - canvas.getBoundingClientRect().left;
      // const prevOffset = offsetXRef.current;
      // const scaleChange = scaleRef.current / prevScale;
      // offsetXRef.current = mouseX - (mouseX - prevOffset) * scaleChange;

      setRefresh((r) => r + 1); // trigger redraw
    };

    const canvas = app.view;
    canvas.addEventListener("wheel", handleWheel);

    return () => {
      canvas.removeEventListener("wheel", handleWheel);
    };
  }, []);

  // Handle panning
  useEffect(() => {
    const app = appRef.current;
    if (!app) return;

    let isDragging = false;
    let startX = 0;
    const canvas = app.view;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      startX = e.clientX;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      startX = e.clientX;
      offsetXRef.current += dx;

      // Clamp offset to prevent empty space
      const maxOffset = 0;
      const minOffset = -data.length * 10 * scaleRef.current + dimensions.width;
      offsetXRef.current = Math.min(
        maxOffset,
        Math.max(minOffset, offsetXRef.current)
      );
      // app.render(); // Optional
      setRefresh((r) => r + 1); // redraw
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [data.length, dimensions.width]);

  // Handle crosshair and tooltip
  useEffect(() => {
    const app = appRef.current;
    if (!app || !crosshairRef.current) return;

    const canvas = app.view;

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const scaledSpacing = 10 * scaleRef.current;
      const candleWidth = scaledSpacing * 0.6;
      const index = Math.floor((mouseX - offsetXRef.current) / scaledSpacing);
      if (index >= 0 && index < data.length && tooltipRef.current) {
        const d = data[index];
        const tooltip = tooltipRef.current;
        tooltip.text = `O:${d.open} H:${d.high} L:${d.low} C:${d.close}`;
        // tooltip.position.set(mouseX + 10, 10);
        tooltip.position.set(80, 10);
        tooltip.visible = true;
      } else if (tooltipRef.current) {
        tooltipRef.current.visible = false;
      }

      const x = index * scaledSpacing + offsetXRef.current + candleWidth / 2;

      const crosshair = crosshairRef.current;
      crosshair.clear();
      crosshair.lineStyle(1, 0xffffff, 0.5);
      crosshair.moveTo(x, 0); // Vertical
      crosshair.lineTo(x, dimensions.height);

      crosshair.moveTo(0, mouseY); // Horizontal
      crosshair.lineTo(dimensions.width, mouseY);
    };

    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", () => {
      crosshairRef.current?.clear();
      // if (tooltipRef.current) {
      //   tooltipRef.current.visible = false;
      // }
    });

    return () => {
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", () => {});
    };
  }, [dimensions.height, dimensions.width]);

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%" }}>
      <div
        ref={chartRef}
        style={{
          position: "relative",
          width: dimensions.width,
          height: dimensions.height,
        }}
      />
    </div>
  );
};

export default CandlestickCharts;
