import React, { useEffect, useRef } from "react";
import \* as PIXI from "pixi.js";

interface CandleData {
open: number;
high: number;
low: number;
close: number;
timestamp: number;
}

interface Props {
data: CandleData[];
width?: number;
height?: number;
}

const CandlestickCharts: React.FC<Props> = ({
data,
width = 800,
height = 500,
}) => {
const chartRef = useRef<HTMLDivElement | null>(null);
const appRef = useRef<PIXI.Application | null>(null);

const scaleRef = useRef(1);
const offsetXRef = useRef(0);

useEffect(() => {
if (!chartRef.current) return;

    chartRef.current.innerHTML = "";

    const app: any = new PIXI.Application({
      width,
      height: height + 30,
      backgroundColor: "black",
      antialias: true,
    });

    appRef.current = app;
    chartRef.current.appendChild(app.view);

    const chartContainer = new PIXI.Container();
    const graphics: any = new PIXI.Graphics();
    chartContainer.addChild(graphics);
    app.stage.addChild(chartContainer);

    const axisContainer = new PIXI.Container();
    app.stage.addChild(axisContainer);

    const tooltip = new PIXI.Text("", { fontSize: 12, fill: 0xffffff });
    tooltip.visible = false;
    app.stage.addChild(tooltip);

    const crosshair = new PIXI.Graphics();
    app.stage.addChild(crosshair);

    const spacing = 10;

    let dragging = false;
    let lastX = 0;

    // Calculate 20-period SMA
    const sma20 = data.map((_, i) => {
      if (i < 19) return null;
      const slice = data.slice(i - 19, i + 1);
      const avg = slice.reduce((sum, d) => sum + d.close, 0) / 20;
      return avg;
    });

    const redraw = (mousePos?: { x: number; y: number }) => {
      const scale = scaleRef.current;
      const offsetX = offsetXRef.current;

      graphics.clear();
      axisContainer.removeChildren();
      crosshair.clear();
      tooltip.visible = false;

      const scaledSpacing = spacing * scale;
      const candleWidth = scaledSpacing * 0.6;

      const visibleCount = Math.ceil(width / scaledSpacing);
      const startIndex = Math.max(0, Math.floor(-offsetX / scaledSpacing));
      const endIndex = Math.min(data.length, startIndex + visibleCount + 2);
      const visibleData = data.slice(startIndex, endIndex);

      const max = Math.max(...visibleData.map((d) => d.high));
      const min = Math.min(...visibleData.map((d) => d.low));
      const range = max - min || 1;
      const scaleY = height / range;

      for (let i = 0; i < visibleData.length; i++) {
        const d = visibleData[i];
        const idx = startIndex + i;
        const x = idx * scaledSpacing + offsetX;
        const openY = height - (d.open - min) * scaleY;
        const closeY = height - (d.close - min) * scaleY;
        const highY = height - (d.high - min) * scaleY;
        const lowY = height - (d.low - min) * scaleY;

        const isBull = d.close >= d.open;
        const color = isBull ? "#089981" : "#F23645";

        graphics.lineStyle(1, color);
        graphics.moveTo(x + candleWidth / 2, highY);
        graphics.lineTo(x + candleWidth / 2, lowY);

        graphics.beginFill(color);
        graphics.drawRect(
          x,
          Math.min(openY, closeY),
          candleWidth,
          Math.max(1, Math.abs(closeY - openY))
        );
        graphics.endFill();

        if (idx % 10 === 0) {
          const label: any = new PIXI.Text(
            new Date(d.timestamp).toLocaleDateString(),
            {
              fontSize: 10,
              fill: 0xffffff,
            }
          );
          label.position.set(x - 10, height + 5);
          axisContainer.addChild(label);
        }

        // Tooltip and crosshair
        if (mousePos && mousePos.x >= x && mousePos.x <= x + candleWidth) {
          tooltip.text = `O: ${d.open}\nH: ${d.high}\nL: ${d.low}\nC: ${d.close}`;
          tooltip.position.set(mousePos.x + 10, mousePos.y - 40);
          tooltip.visible = true;

          crosshair.lineStyle(1, 0xffffff, 0.3);
          crosshair.moveTo(x + candleWidth / 2, 0);
          crosshair.lineTo(x + candleWidth / 2, height);
          crosshair.moveTo(0, mousePos.y);
          crosshair.lineTo(width, mousePos.y);
        }
      }

      // SMA Line
      // graphics.lineStyle(1, 0x00ccff);
      // for (let i = 1; i < visibleData.length; i++) {
      //   const idx1 = startIndex + i - 1;
      //   const idx2 = startIndex + i;
      //   if (sma20[idx1] && sma20[idx2]) {
      //     const x1 = idx1 * scaledSpacing + offsetX + candleWidth / 2;
      //     const y1 = height - (sma20[idx1]! - min) * scaleY;
      //     const x2 = idx2 * scaledSpacing + offsetX + candleWidth / 2;
      //     const y2 = height - (sma20[idx2]! - min) * scaleY;
      //     graphics.moveTo(x1, y1);
      //     graphics.lineTo(x2, y2);
      //   }
      // }

      // Y-axis
      const steps = 10;
      const priceStep = range / steps;
      for (let i = 0; i <= steps; i++) {
        const price = min + i * priceStep;
        const y = height - (price - min) * scaleY;

        const label: any = new PIXI.Text(price.toFixed(2), {
          fontSize: 10,
          fill: 0xffffff,
        });
        label.position.set(5, y - 6);
        axisContainer.addChild(label);

        graphics.lineStyle(0.5, 0x888888, 0.3);
        graphics.moveTo(0, y);
        graphics.lineTo(width, y);
      }
    };

    redraw();

    // Zoom
    app.view.addEventListener("wheel", (e: WheelEvent) => {
      e.preventDefault();
      const bounds = app.view.getBoundingClientRect();
      const mouseX = e.clientX - bounds.left;

      if (e.shiftKey) {
        // Horizontal panning when shift is pressed
        const panAmount = e.deltaY > 0 ? -30 : 30;
        offsetXRef.current += panAmount;
        redraw();
        return;
      }

      const worldX = (mouseX - offsetXRef.current) / scaleRef.current;
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(
        0.2,
        Math.min(5, scaleRef.current * zoomFactor)
      );

      offsetXRef.current = mouseX - worldX * newScale;
      scaleRef.current = newScale;

      redraw();
    });

    app.stage.eventMode = "static";
    app.stage.hitArea = app.screen;

    app.stage.on("pointerdown", (e: any) => {
      dragging = true;
      lastX = e.screen.x;
    });
    app.stage.on("pointerup", () => (dragging = false));
    app.stage.on("pointerupoutside", () => (dragging = false));

    app.stage.on("pointermove", (e: any) => {
      const x = e.data.global.x;
      const y = e.data.global.y;

      if (dragging) {
        const dx = e.screen.x - lastX;
        offsetXRef.current += dx;
        lastX = e.screen.x;
        redraw();
      } else {
        redraw({ x, y });
      }
    });

    return () => {
      app.destroy(true, true);
      if (chartRef.current) chartRef.current.innerHTML = "";
    };

}, [data, width, height]);

return <div ref={chartRef} style={{ width, height: height + 30 }} />;
};

export default CandlestickCharts;

<!-- --------------------------------------------------------------------------------- -->

import React, { useEffect, useRef, useState } from "react";
import \* as PIXI from "pixi.js";

interface CandleData {
open: number;
high: number;
low: number;
close: number;
timestamp: number;
}

interface Props {
data: CandleData[];
width?: number;
height?: number;
}

const chartTypes = ["Candlestick", "Line", "Area", "Hollow Candles"] as const;
type ChartType = (typeof chartTypes)[number];

const CandlestickCharts: React.FC<Props> = ({
data,
width = 800,
height = 500,
}) => {
const [chartType, setChartType] = useState<ChartType>("Candlestick");

const chartRef = useRef<HTMLDivElement | null>(null);
const appRef = useRef<PIXI.Application | null>(null);
const scaleRef = useRef(1);
const offsetXRef = useRef(0);

useEffect(() => {
if (!chartRef.current) return;

    chartRef.current.innerHTML = "";

    const app: any = new PIXI.Application({
      width,
      height: height + 30,
      backgroundColor: "black",
      antialias: true,
    });

    appRef.current = app;
    chartRef.current.appendChild(app.view);

    const chartContainer = new PIXI.Container();
    const graphics = new PIXI.Graphics();
    chartContainer.addChild(graphics);
    app.stage.addChild(chartContainer);

    const axisContainer = new PIXI.Container();
    app.stage.addChild(axisContainer);

    const tooltip = new PIXI.Text("", { fontSize: 12, fill: 0xffffff });
    tooltip.visible = false;
    app.stage.addChild(tooltip);

    const crosshair = new PIXI.Graphics();
    app.stage.addChild(crosshair);

    const spacing = 10;

    let dragging = false;
    let lastX = 0;

    const redraw = (mousePos?: { x: number; y: number }) => {
      const scale = scaleRef.current;
      const offsetX = offsetXRef.current;

      graphics.clear();
      axisContainer.removeChildren();
      crosshair.clear();
      tooltip.visible = false;

      const scaledSpacing = spacing * scale;
      const candleWidth = scaledSpacing * 0.6;

      const visibleCount = Math.ceil(width / scaledSpacing);
      const startIndex = Math.max(0, Math.floor(-offsetX / scaledSpacing));
      const endIndex = Math.min(data.length, startIndex + visibleCount + 2);
      const visibleData = data.slice(startIndex, endIndex);

      const max = Math.max(...visibleData.map((d) => d.high));
      const min = Math.min(...visibleData.map((d) => d.low));
      const range = max - min || 1;
      const scaleY = height / range;

      if (chartType === "Candlestick" || chartType === "Hollow Candles") {
        for (let i = 0; i < visibleData.length; i++) {
          const d = visibleData[i];
          const idx = startIndex + i;
          const x = idx * scaledSpacing + offsetX;
          const openY = height - (d.open - min) * scaleY;
          const closeY = height - (d.close - min) * scaleY;
          const highY = height - (d.high - min) * scaleY;
          const lowY = height - (d.low - min) * scaleY;

          const isBull = d.close >= d.open;
          const color = isBull ? "#089981" : "#F23645";

          graphics.lineStyle(1, color);
          graphics.moveTo(x + candleWidth / 2, highY);
          graphics.lineTo(x + candleWidth / 2, lowY);

          if (chartType === "Candlestick") {
            graphics.beginFill(color);
            graphics.drawRect(
              x,
              Math.min(openY, closeY),
              candleWidth,
              Math.max(1, Math.abs(closeY - openY))
            );
            graphics.endFill();
          } else if (chartType === "Hollow Candles") {
            graphics.lineStyle(1.5, color);
            graphics.drawRect(
              x,
              Math.min(openY, closeY),
              candleWidth,
              Math.max(1, Math.abs(closeY - openY))
            );
          }

          if (idx % 10 === 0) {
            const label: any = new PIXI.Text(
              new Date(d.timestamp).toLocaleDateString(),
              { fontSize: 10, fill: 0xffffff }
            );
            label.position.set(x - 10, height + 5);
            axisContainer.addChild(label);
          }

          if (mousePos && mousePos.x >= x && mousePos.x <= x + candleWidth) {
            tooltip.text = `O: ${d.open}\nH: ${d.high}\nL: ${d.low}\nC: ${d.close}`;
            tooltip.position.set(mousePos.x + 10, mousePos.y - 40);
            tooltip.visible = true;

            crosshair.lineStyle(1, 0xffffff, 0.3);
            crosshair.moveTo(x + candleWidth / 2, 0);
            crosshair.lineTo(x + candleWidth / 2, height);
            crosshair.moveTo(0, mousePos.y);
            crosshair.lineTo(width, mousePos.y);
          }
        }
      }

      if (chartType === "Line" || chartType === "Area") {
        graphics.lineStyle(1, "#00ccff");
        graphics.beginFill(chartType === "Area" ? "#00ccff" : undefined, 0.2);

        visibleData.forEach((d, i) => {
          const idx = startIndex + i;
          const x = idx * scaledSpacing + offsetX + candleWidth / 2;
          const y = height - (d.close - min) * scaleY;

          if (i === 0) {
            graphics.moveTo(x, chartType === "Area" ? height : y);
            graphics.lineTo(x, y);
          } else {
            graphics.lineTo(x, y);
          }

          if (i === visibleData.length - 1 && chartType === "Area") {
            graphics.lineTo(x, height);
            graphics.lineTo(
              startIndex * scaledSpacing + offsetX + candleWidth / 2,
              height
            );
            graphics.closePath();
          }
        });

        graphics.endFill();
      }

      // Y-axis grid + price labels
      const steps = 10;
      const priceStep = range / steps;
      for (let i = 0; i <= steps; i++) {
        const price = min + i * priceStep;
        const y = height - (price - min) * scaleY;

        const label: any = new PIXI.Text(price.toFixed(2), {
          fontSize: 10,
          fill: 0xffffff,
        });
        label.position.set(5, y - 6);
        axisContainer.addChild(label);

        graphics.lineStyle(0.5, 0x888888, 0.3);
        graphics.moveTo(0, y);
        graphics.lineTo(width, y);
      }
    };

    redraw();

    app.view.addEventListener("wheel", (e: WheelEvent) => {
      e.preventDefault();
      const bounds = app.view.getBoundingClientRect();
      const mouseX = e.clientX - bounds.left;

      if (e.shiftKey) {
        offsetXRef.current += e.deltaY > 0 ? -30 : 30;
        redraw();
        return;
      }

      const worldX = (mouseX - offsetXRef.current) / scaleRef.current;
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(
        0.2,
        Math.min(5, scaleRef.current * zoomFactor)
      );
      offsetXRef.current = mouseX - worldX * newScale;
      scaleRef.current = newScale;
      redraw();
    });

    app.stage.eventMode = "static";
    app.stage.hitArea = app.screen;

    app.stage.on("pointerdown", (e: any) => {
      dragging = true;
      lastX = e.screen.x;
    });
    app.stage.on("pointerup", () => (dragging = false));
    app.stage.on("pointerupoutside", () => (dragging = false));

    app.stage.on("pointermove", (e: any) => {
      const x = e.data.global.x;
      const y = e.data.global.y;

      if (dragging) {
        const dx = e.screen.x - lastX;
        offsetXRef.current += dx;
        lastX = e.screen.x;
        redraw();
      } else {
        redraw({ x, y });
      }
    });

    return () => {
      app.destroy(true, true);
      if (chartRef.current) chartRef.current.innerHTML = "";
    };

}, [data, width, height, chartType]);

return (
<div>
<select
style={{ marginBottom: 10 }}
value={chartType}
onChange={(e) => setChartType(e.target.value as ChartType)} >
{chartTypes.map((type) => (
<option key={type}>{type}</option>
))}
</select>
<div ref={chartRef} style={{ width, height: height + 30 }} />
</div>
);
};

export default CandlestickCharts;


<!-- --------------------------------------------------------------------------------------------- -->

/**
 * ✅ Supports: Candlestick, Hollow Candles, Line, Area, Step Line, Line with Markers, Volume Bars, Bars, HLC, Baseline, Columns, High-Low
 * ⏳ Special Logic Required: Renko, Heikin Ashi, Line Break, Kagi, Point & Figure, Range
 */

import React, { useEffect, useRef, useState } from "react";
import * as PIXI from "pixi.js";

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
  "High-Low",
  "Renko",
  "Heikin Ashi",
  "Line Break",
  "Kagi",
  "Point & Figure",
  "Range"
] as const;
type ChartType = typeof chartTypes[number];

interface Props {
  data: CandleData[];
  width?: number;
  height?: number;
}

const CandlestickCharts: React.FC<Props> = ({ data, width = 800, height = 500 }) => {
  const [chartType, setChartType] = useState<ChartType>("Candlestick");
  const chartRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const scaleRef = useRef(1);
  const offsetXRef = useRef(0);

  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.innerHTML = "";

    const app = new PIXI.Application({
      width,
      height: height + 30,
      backgroundColor: 0x000000,
      antialias: true,
    });

    appRef.current = app;
    chartRef.current.appendChild(app.view);

    const chartContainer = new PIXI.Container();
    const graphics = new PIXI.Graphics();
    chartContainer.addChild(graphics);
    app.stage.addChild(chartContainer);

    const axisContainer = new PIXI.Container();
    app.stage.addChild(axisContainer);

    const tooltip = new PIXI.Text("", { fontSize: 12, fill: 0xffffff });
    tooltip.visible = false;
    app.stage.addChild(tooltip);

    const crosshair = new PIXI.Graphics();
    app.stage.addChild(crosshair);

    const spacing = 10;
    let dragging = false;
    let lastX = 0;

    const drawXAxisLabels = (startIndex: number, visibleData: CandleData[], scaledSpacing: number) => {
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
          label.position.set(x - 10, height + 5);
          axisContainer.addChild(label);
        }
      }
    };

    const redraw = (mousePos?: { x: number; y: number }) => {
      const scale = scaleRef.current;
      const offsetX = offsetXRef.current;

      graphics.clear();
      axisContainer.removeChildren();
      crosshair.clear();
      tooltip.visible = false;

      const scaledSpacing = spacing * scale;
      const candleWidth = scaledSpacing * 0.6;

      const visibleCount = Math.ceil(width / scaledSpacing);
      const startIndex = Math.max(0, Math.floor(-offsetX / scaledSpacing));
      const endIndex = Math.min(data.length, startIndex + visibleCount + 2);
      const visibleData = data.slice(startIndex, endIndex);

      const max = Math.max(...visibleData.map((d) => d.high));
      const min = Math.min(...visibleData.map((d) => d.low));
      const range = max - min || 1;
      const scaleY = height / range;

      const xFor = (idx: number) => idx * scaledSpacing + offsetX + candleWidth / 2;
      const yFor = (price: number) => height - (price - min) * scaleY;

      const drawRectOrLine = (x: number, yTop: number, yBottom: number, color: number, filled = true) => {
        graphics.lineStyle(1, color);
        graphics.moveTo(x, yTop);
        graphics.lineTo(x, yBottom);
        if (filled) {
          graphics.beginFill(color);
          graphics.drawRect(x - candleWidth / 2, yTop, candleWidth, yBottom - yTop);
          graphics.endFill();
        }
      };

      visibleData.forEach((d, i) => {
        const idx = startIndex + i;
        const x = xFor(idx);
        const openY = yFor(d.open);
        const closeY = yFor(d.close);
        const highY = yFor(d.high);
        const lowY = yFor(d.low);
        const isBull = d.close >= d.open;
        const color = isBull ? 0x089981 : 0xf23645;

        if (["Candlestick", "Hollow Candles"].includes(chartType)) {
          drawRectOrLine(x, highY, lowY, color, chartType === "Candlestick");
        }

        if (["Bars", "HLC"].includes(chartType)) {
          graphics.lineStyle(1, color);
          graphics.moveTo(x, highY);
          graphics.lineTo(x, lowY);
          if (chartType === "Bars") {
            graphics.moveTo(x - 4, openY);
            graphics.lineTo(x, openY);
          }
          graphics.moveTo(x, closeY);
          graphics.lineTo(x + 4, closeY);
        }

        if (chartType === "Columns") {
          const y = yFor(d.close);
          graphics.beginFill(color);
          graphics.drawRect(x - candleWidth / 2, y, candleWidth, height - y);
          graphics.endFill();
        }

        if (chartType === "High-Low") {
          graphics.lineStyle(1, color);
          graphics.moveTo(x, highY);
          graphics.lineTo(x, lowY);
        }

        if (chartType === "Volume Bars") {
          const volumeHeight = (d.volume ?? 0) / 1000;
          const barHeight = volumeHeight * 4;
          const y = height - barHeight;
          graphics.beginFill(color);
          graphics.drawRect(x - candleWidth / 2, y, candleWidth, barHeight);
          graphics.endFill();
        }

        if (chartType === "Line with Markers") {
          const y = yFor(d.close);
          graphics.beginFill(0x00ccff);
          graphics.drawCircle(x, y, 2);
          graphics.endFill();
        }

        if (mousePos && mousePos.x >= x - candleWidth / 2 && mousePos.x <= x + candleWidth / 2) {
          tooltip.text = `O: ${d.open}\nH: ${d.high}\nL: ${d.low}\nC: ${d.close}`;
          tooltip.position.set(mousePos.x + 10, mousePos.y - 40);
          tooltip.visible = true;

          crosshair.lineStyle(1, 0xffffff, 0.3);
          crosshair.moveTo(x, 0);
          crosshair.lineTo(x, height);
          crosshair.moveTo(0, mousePos.y);
          crosshair.lineTo(width, mousePos.y);
        }
      });

      if (["Line", "Area", "Step Line", "Line with Markers", "Baseline"].includes(chartType)) {
        graphics.lineStyle(1, 0x00ccff);
        graphics.beginFill(["Area", "Baseline"].includes(chartType) ? 0x00ccff : undefined, 0.2);
        visibleData.forEach((d, i) => {
          const x = xFor(startIndex + i);
          const y = yFor(d.close);

          if (i === 0) {
            graphics.moveTo(x, ["Area", "Baseline"].includes(chartType) ? height : y);
            graphics.lineTo(x, y);
          } else if (chartType === "Step Line") {
            const prev = yFor(visibleData[i - 1].close);
            graphics.lineTo(x, prev);
            graphics.lineTo(x, y);
          } else {
            graphics.lineTo(x, y);
          }
        });
        if (["Area", "Baseline"].includes(chartType)) {
          const lastX = xFor(startIndex + visibleData.length - 1);
          graphics.lineTo(lastX, height);
          graphics.lineTo(xFor(startIndex), height);
          graphics.closePath();
        }
        graphics.endFill();
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
        axisContainer.addChild(label);

        graphics.lineStyle(0.5, 0x888888, 0.3);
        graphics.moveTo(0, y);
        graphics.lineTo(width, y);
      }
    };

    redraw();

    app.view.addEventListener("wheel", (e: WheelEvent) => {
      e.preventDefault();
      const bounds = app.view.getBoundingClientRect();
      const mouseX = e.clientX - bounds.left;
      const worldX = (mouseX - offsetXRef.current) / scaleRef.current;
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(0.2, Math.min(5, scaleRef.current * zoomFactor));
      offsetXRef.current = mouseX - worldX * newScale;
      scaleRef.current = newScale;
      redraw();
    });

    app.stage.eventMode = "static";
    app.stage.hitArea = app.screen;
    app.stage.on("pointerdown", (e: any) => {
      dragging = true;
      lastX = e.screen.x;
    });
    app.stage.on("pointerup", () => (dragging = false));
    app.stage.on("pointerupoutside", () => (dragging = false));
    app.stage.on("pointermove", (e: any) => {
      const x = e.data.global.x;
      const y = e.data.global.y;
      if (dragging) {
        const dx = e.screen.x - lastX;
        offsetXRef.current += dx;
        lastX = e.screen.x;
        redraw();
      } else {
        redraw({ x, y });
      }
    });

    return () => {
      app.destroy(true, true);
      if (chartRef.current) chartRef.current.innerHTML = "";
    };
  }, [data, width, height, chartType]);

  return (
    <div>
      <select
        style={{ marginBottom: 10 }}
        value={chartType}
        onChange={(e) => setChartType(e.target.value as ChartType)}
      >
        {chartTypes.map((type) => (
          <option key={type}>{type}</option>
        ))}
      </select>
      <div ref={chartRef} style={{ width, height: height + 30 }} />
    </div>
  );
};

export default CandlestickCharts;

/**
 * ❓ Why Special Logic is Required for Remaining Chart Types:
 * - Renko, Heikin Ashi, Line Break, Kagi, Point & Figure, Range
 * - These types do not rely on a 1:1 mapping of raw OHLC data per timestamp.
 * - They require transformation, aggregation, or rule-based interpretation over time.
 * - You often compute blocks or steps based on price movement, not constant time intervals.
 */


<!-- --------------------------------------------------------------------------------------------------------- -->



import React, { useEffect, useRef, useState } from "react";
import * as PIXI from "pixi.js";

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
  "High-Low",
  "Renko",
  "Heikin Ashi",
  "Line Break",
  "Kagi",
  "Point & Figure",
  "Range",
] as const;
type ChartType = (typeof chartTypes)[number];

interface Props {
  data: CandleData[];
  width?: number;
  height?: number;
}

const CandlestickCharts: React.FC<Props> = ({
  data,
  width = 800,
  height = 500,
}) => {
  const [chartType, setChartType] = useState<ChartType>("Candlestick");
  const chartRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const scaleRef = useRef(1);
  const offsetXRef = useRef(0);

  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.innerHTML = "";

    const app = new PIXI.Application({
      width,
      height: height + 30,
      backgroundColor: 0x000000,
      antialias: true,
    });

    appRef.current = app;
    chartRef.current.appendChild(app.view);

    const chartContainer = new PIXI.Container();
    const graphics = new PIXI.Graphics();
    chartContainer.addChild(graphics);
    app.stage.addChild(chartContainer);

    const axisContainer = new PIXI.Container();
    app.stage.addChild(axisContainer);

    const tooltip = new PIXI.Text("", { fontSize: 12, fill: 0xffffff });
    tooltip.visible = false;
    app.stage.addChild(tooltip);

    const crosshair = new PIXI.Graphics();
    app.stage.addChild(crosshair);

    const spacing = 10;
    let dragging = false;
    let lastX = 0;

    const drawXAxisLabels = (
      startIndex: number,
      visibleData: CandleData[],
      scaledSpacing: number
    ) => {
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
          label.position.set(x - 10, height + 5);
          axisContainer.addChild(label);
        }
      }
    };

    const redraw = (mousePos?: { x: number; y: number }) => {
      const scale = scaleRef.current;
      const offsetX = offsetXRef.current;

      graphics.clear();
      axisContainer.removeChildren();
      crosshair.clear();
      tooltip.visible = false;

      const scaledSpacing = spacing * scale;
      const candleWidth = scaledSpacing * 0.6;

      const visibleCount = Math.ceil(width / scaledSpacing);
      const startIndex = Math.max(0, Math.floor(-offsetX / scaledSpacing));
      const endIndex = Math.min(data.length, startIndex + visibleCount + 2);
      const visibleData = data.slice(startIndex, endIndex);

      const max = Math.max(...visibleData.map((d) => d.high));
      const min = Math.min(...visibleData.map((d) => d.low));
      const range = max - min || 1;
      const scaleY = height / range;

      const xFor = (idx: number) =>
        idx * scaledSpacing + offsetX + candleWidth / 2;
      const yFor = (price: number) => height - (price - min) * scaleY;

      const drawCandle = (d: CandleData, x: number) => {
        const openY = yFor(d.open);
        const closeY = yFor(d.close);
        const highY = yFor(d.high);
        const lowY = yFor(d.low);
        const isBull = d.close >= d.open;
        const color = isBull ? 0x089981 : 0xf23645;

        graphics.lineStyle(1, color);
        graphics.moveTo(x, highY);
        graphics.lineTo(x, lowY);

        if (chartType === "Candlestick") {
          graphics.beginFill(color);
          graphics.drawRect(
            x - candleWidth / 2,
            Math.min(openY, closeY),
            candleWidth,
            Math.max(1, Math.abs(closeY - openY))
          );
          graphics.endFill();
        } else if (chartType === "Hollow Candles") {
          graphics.drawRect(
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

          graphics.lineStyle(1, color);
          graphics.moveTo(x, highY);
          graphics.lineTo(x, lowY);

          if (chartType === "Bars") {
            graphics.moveTo(x - 4, openY);
            graphics.lineTo(x, openY);
          }
          graphics.moveTo(x, closeY);
          graphics.lineTo(x + 4, closeY);
        }

        if (chartType === "Volume Bars" || chartType === "Columns") {
          // const volumeHeight = (d.volume ?? 0) / 1000;
          // const barHeight = volumeHeight * 4;
          // const y = height - barHeight;
          const color = d.close >= d.open ? 0x089981 : 0xf23645;
          // graphics.beginFill(color);
          // graphics.drawRect(x - candleWidth / 2, y, candleWidth, barHeight);
          // graphics.endFill();

          const y = yFor(d.close);
          graphics.beginFill(color);
          graphics.drawRect(x - candleWidth / 2, y, candleWidth, height - y);
          graphics.endFill();
        }

        if (chartType === "Line with Markers") {
          const y = yFor(d.close);
          graphics.beginFill(0x00ccff);
          graphics.drawCircle(x, y, 2);
          graphics.endFill();
        }

        if (
          mousePos &&
          mousePos.x >= x - candleWidth / 2 &&
          mousePos.x <= x + candleWidth / 2
        ) {
          tooltip.text = `O: ${d.open}\nH: ${d.high}\nL: ${d.low}\nC: ${d.close}`;
          tooltip.position.set(mousePos.x + 10, mousePos.y - 40);
          tooltip.visible = true;

          crosshair.lineStyle(1, 0xffffff, 0.3);
          crosshair.moveTo(x, 0);
          crosshair.lineTo(x, height);
          crosshair.moveTo(0, mousePos.y);
          crosshair.lineTo(width, mousePos.y);
        }
      });

      if (
        ["Line", "Area", "Step Line", "Line with Markers", "Baseline"].includes(
          chartType
        )
      ) {
        graphics.lineStyle(1, 0x00ccff);
        graphics.beginFill(
          chartType === "Area" || chartType === "Baseline"
            ? 0x00ccff
            : undefined,
          0.2
        );
        visibleData.forEach((d, i) => {
          const x = xFor(startIndex + i);
          const y = yFor(d.close);

          if (i === 0) {
            graphics.moveTo(
              x,
              chartType === "Area" || chartType === "Baseline" ? height : y
            );
            graphics.lineTo(x, y);
          } else if (chartType === "Step Line") {
            const prev = yFor(visibleData[i - 1].close);
            graphics.lineTo(x, prev);
            graphics.lineTo(x, y);
          } else {
            graphics.lineTo(x, y);
          }
        });
        if (chartType === "Area" || chartType === "Baseline") {
          const lastX = xFor(startIndex + visibleData.length - 1);
          graphics.lineTo(lastX, height);
          graphics.lineTo(xFor(startIndex), height);
          graphics.closePath();
        }

        graphics.endFill();
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
        axisContainer.addChild(label);

        graphics.lineStyle(0.5, 0x888888, 0.3);
        graphics.moveTo(0, y);
        graphics.lineTo(width, y);
      }
    };

    redraw();

    app.view.addEventListener("wheel", (e: WheelEvent) => {
      e.preventDefault();
      const bounds = app.view.getBoundingClientRect();
      const mouseX = e.clientX - bounds.left;

      if (e.shiftKey) {
        const panAmount = e.deltaY > 0 ? -30 : 30;
        offsetXRef.current += panAmount;
        redraw();
        return;
      }

      const worldX = (mouseX - offsetXRef.current) / scaleRef.current;
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(
        0.2,
        Math.min(5, scaleRef.current * zoomFactor)
      );
      offsetXRef.current = mouseX - worldX * newScale;
      scaleRef.current = newScale;
      redraw();
    });

    app.stage.eventMode = "static";
    app.stage.hitArea = app.screen;
    app.stage.on("pointerdown", (e: any) => {
      dragging = true;
      lastX = e.screen.x;
    });
    app.stage.on("pointerup", () => (dragging = false));
    app.stage.on("pointerupoutside", () => (dragging = false));
    app.stage.on("pointermove", (e: any) => {
      const x = e.data.global.x;
      const y = e.data.global.y;
      if (dragging) {
        const dx = e.screen.x - lastX;
        offsetXRef.current += dx;
        lastX = e.screen.x;
        redraw();
      } else {
        redraw({ x, y });
      }
    });

    return () => {
      app.destroy(true, true);
      if (chartRef.current) chartRef.current.innerHTML = "";
    };
  }, [data, width, height, chartType]);

  return (
    <div>
      <select
        style={{ marginBottom: 10 }}
        value={chartType}
        onChange={(e) => setChartType(e.target.value as ChartType)}
      >
        {chartTypes.map((type) => (
          <option key={type}>{type}</option>
        ))}
      </select>
      <div ref={chartRef} style={{ width, height: height + 30 }} />
    </div>
  );
};

export default CandlestickCharts;


<!-- ------------------------------------------------------------------------------------------------- -->


import React, { useEffect, useRef, useState } from "react";
import * as PIXI from "pixi.js";

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
  "High-Low",
  "Renko",
  "Heikin Ashi",
  "Line Break",
  "Kagi",
  "Point & Figure",
  "Range",
] as const;
type ChartType = (typeof chartTypes)[number];

interface Props {
  data: CandleData[];
  width?: number;
  height?: number;
}

const CandlestickCharts: React.FC<Props> = ({
  data,
  width = 800,
  height = 500,
}) => {
  const [chartType, setChartType] = useState<ChartType>("Candlestick");
  const [indicator, setIndicator] = useState<string | null>(null);

  const chartRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const scaleRef = useRef(1);
  const offsetXRef = useRef(0);

  function calculateSMA(data: CandleData[], period: number): (number | null)[] {
    const sma: (number | null)[] = [];
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        sma.push(null); // not enough data
      } else {
        const sum = data
          .slice(i - period + 1, i + 1)
          .reduce((acc, d) => acc + d.close, 0);
        sma.push(sum / period);
      }
    }
    return sma;
  }

  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.innerHTML = "";

    const app = new PIXI.Application({
      width,
      height: height + 30,
      backgroundColor: 0x000000,
      antialias: true,
    });

    appRef.current = app;
    chartRef.current.appendChild(app.view);

    const chartContainer = new PIXI.Container();
    const graphics = new PIXI.Graphics();
    chartContainer.addChild(graphics);
    app.stage.addChild(chartContainer);

    const axisContainer = new PIXI.Container();
    app.stage.addChild(axisContainer);

    const tooltip = new PIXI.Text("", { fontSize: 12, fill: 0xffffff });
    tooltip.visible = false;
    app.stage.addChild(tooltip);

    const crosshair = new PIXI.Graphics();
    app.stage.addChild(crosshair);

    const spacing = 10;
    let dragging = false;
    let lastX = 0;

    const drawXAxisLabels = (
      startIndex: number,
      visibleData: CandleData[],
      scaledSpacing: number
    ) => {
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
          label.position.set(x - 10, height + 5);
          axisContainer.addChild(label);
        }
      }
    };

    const redraw = (mousePos?: { x: number; y: number }) => {
      const scale = scaleRef.current;
      const offsetX = offsetXRef.current;

      graphics.clear();
      axisContainer.removeChildren();
      crosshair.clear();
      tooltip.visible = false;

      const scaledSpacing = spacing * scale;
      const candleWidth = scaledSpacing * 0.6;

      const visibleCount = Math.ceil(width / scaledSpacing);
      const startIndex = Math.max(0, Math.floor(-offsetX / scaledSpacing));
      const endIndex = Math.min(data.length, startIndex + visibleCount + 2);
      const visibleData = data.slice(startIndex, endIndex);

      const max = Math.max(...visibleData.map((d) => d.high));
      const min = Math.min(...visibleData.map((d) => d.low));
      const range = max - min || 1;
      const scaleY = height / range;

      const xFor = (idx: number) =>
        idx * scaledSpacing + offsetX + candleWidth / 2;
      const yFor = (price: number) => height - (price - min) * scaleY;

      const drawCandle = (d: CandleData, x: number) => {
        const openY = yFor(d.open);
        const closeY = yFor(d.close);
        const highY = yFor(d.high);
        const lowY = yFor(d.low);
        const isBull = d.close >= d.open;
        const color = isBull ? 0x089981 : 0xf23645;

        graphics.lineStyle(1, color);
        graphics.moveTo(x, highY);
        graphics.lineTo(x, lowY);

        if (chartType === "Candlestick") {
          graphics.beginFill(color);
          graphics.drawRect(
            x - candleWidth / 2,
            Math.min(openY, closeY),
            candleWidth,
            Math.max(1, Math.abs(closeY - openY))
          );
          graphics.endFill();
        } else if (chartType === "Hollow Candles") {
          graphics.drawRect(
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

          graphics.lineStyle(1, color);
          graphics.moveTo(x, highY);
          graphics.lineTo(x, lowY);

          if (chartType === "Bars") {
            graphics.moveTo(x - 4, openY);
            graphics.lineTo(x, openY);
          }
          graphics.moveTo(x, closeY);
          graphics.lineTo(x + 4, closeY);
        }

        if (chartType === "Volume Bars" || chartType === "Columns") {
          const color = d.close >= d.open ? 0x089981 : 0xf23645;
          const y = yFor(d.close);
          graphics.beginFill(color);
          graphics.drawRect(x - candleWidth / 2, y, candleWidth, height - y);
          graphics.endFill();
        }

        if (chartType === "Line with Markers") {
          const y = yFor(d.close);
          graphics.beginFill(0x00ccff);
          graphics.drawCircle(x, y, 2);
          graphics.endFill();
        }

        if (
          mousePos &&
          mousePos.x >= x - candleWidth / 2 &&
          mousePos.x <= x + candleWidth / 2
        ) {
          tooltip.text = `O: ${d.open}\nH: ${d.high}\nL: ${d.low}\nC: ${d.close}`;
          tooltip.position.set(mousePos.x + 10, mousePos.y - 40);
          tooltip.visible = true;

          crosshair.lineStyle(1, 0xffffff, 0.3);
          crosshair.moveTo(x, 0);
          crosshair.lineTo(x, height);
          crosshair.moveTo(0, mousePos.y);
          crosshair.lineTo(width, mousePos.y);
        }
      });

      if (
        ["Line", "Area", "Step Line", "Line with Markers", "Baseline"].includes(
          chartType
        )
      ) {
        graphics.lineStyle(1, 0x00ccff);
        graphics.beginFill(
          chartType === "Area" || chartType === "Baseline"
            ? 0x00ccff
            : undefined,
          0.2
        );
        visibleData.forEach((d, i) => {
          const x = xFor(startIndex + i);
          const y = yFor(d.close);

          if (i === 0) {
            graphics.moveTo(
              x,
              chartType === "Area" || chartType === "Baseline" ? height : y
            );
            graphics.lineTo(x, y);
          } else if (chartType === "Step Line") {
            const prev = yFor(visibleData[i - 1].close);
            graphics.lineTo(x, prev);
            graphics.lineTo(x, y);
          } else {
            graphics.lineTo(x, y);
          }
        });
        if (chartType === "Area" || chartType === "Baseline") {
          const lastX = xFor(startIndex + visibleData.length - 1);
          graphics.lineTo(lastX, height);
          graphics.lineTo(xFor(startIndex), height);
          graphics.closePath();
        }

        graphics.endFill();
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
        axisContainer.addChild(label);

        graphics.lineStyle(0.5, 0x888888, 0.3);
        graphics.moveTo(0, y);
        graphics.lineTo(width, y);
      }
      if (indicator === "MA Cross") {
        const maShort = calculateSMA(data, 5); // 5-period MA
        const maLong = calculateSMA(data, 10); // 10-period MA

        graphics.lineStyle(1.5, 0xffff00); // Yellow for short MA
        maShort.slice(startIndex, endIndex).forEach((val, i) => {
          if (val === null) return;
          const x = xFor(startIndex + i);
          const y = yFor(val);
          if (i === 0 || maShort[startIndex + i - 1] === null) {
            graphics.moveTo(x, y);
          } else {
            graphics.lineTo(x, y);
          }
        });

        graphics.lineStyle(1.5, 0x00ffff); // Cyan for long MA
        maLong.slice(startIndex, endIndex).forEach((val, i) => {
          if (val === null) return;
          const x = xFor(startIndex + i);
          const y = yFor(val);
          if (i === 0 || maLong[startIndex + i - 1] === null) {
            graphics.moveTo(x, y);
          } else {
            graphics.lineTo(x, y);
          }
        });
      }
    };

    redraw();

    app.view.addEventListener("wheel", (e: WheelEvent) => {
      e.preventDefault();
      const bounds = app.view.getBoundingClientRect();
      const mouseX = e.clientX - bounds.left;

      if (e.shiftKey) {
        // Horizontal panning when shift is pressed
        const panAmount = e.deltaY > 0 ? -30 : 30;
        offsetXRef.current += panAmount;
        redraw();
        return;
      }

      const worldX = (mouseX - offsetXRef.current) / scaleRef.current;
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(
        0.2,
        Math.min(5, scaleRef.current * zoomFactor)
      );
      offsetXRef.current = mouseX - worldX * newScale;
      scaleRef.current = newScale;
      redraw();
    });

    app.stage.eventMode = "static";
    app.stage.hitArea = app.screen;
    app.stage.on("pointerdown", (e: any) => {
      dragging = true;
      lastX = e.screen.x;
    });
    app.stage.on("pointerup", () => (dragging = false));
    app.stage.on("pointerupoutside", () => (dragging = false));
    app.stage.on("pointermove", (e: any) => {
      const x = e.data.global.x;
      const y = e.data.global.y;
      if (dragging) {
        const dx = e.screen.x - lastX;
        offsetXRef.current += dx;
        lastX = e.screen.x;
        redraw();
      } else {
        redraw({ x, y });
      }
    });

    return () => {
      app.destroy(true, true);
      if (chartRef.current) chartRef.current.innerHTML = "";
    };
  }, [data, width, height, chartType, indicator]);

  return (
    <div>
      <select
        style={{ marginBottom: 10 }}
        value={chartType}
        onChange={(e) => setChartType(e.target.value as ChartType)}
      >
        {chartTypes.map((type) => (
          <option key={type}>{type}</option>
        ))}
      </select>
      <select
        style={{ marginBottom: 10 }}
        value={indicator || ""}
        onChange={(e) => setIndicator(e.target.value || null)}
      >
        <option value="">None</option>
        <option value="MA Cross">MA Cross</option>
      </select>

      <div ref={chartRef} style={{ width, height: height + 30 }} />
    </div>
  );
};

export default CandlestickCharts;



-----------

i can make those functions dynamic for 100's of indicators and also instead of those functions i can use the package which provides inbuilt functions for indicators i.e technicalindicators.