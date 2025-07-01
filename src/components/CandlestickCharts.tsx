import React, { useEffect, useRef, useState } from "react";
import * as PIXI from "pixi.js";
import { before } from "node:test";

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

  const chartRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const scaleRef = useRef(1);
  const offsetXRef = useRef(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({
          width,
          height: height - 30, // minus x-axis height
        });
      }
    });

    observer.observe(el);

    return () => observer.disconnect();
  }, []);
  console.log("check candles");
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

  function calculateMcGinley(data: CandleData[], k = 0.6): (number | null)[] {
    const result: (number | null)[] = [];
    let prev = data[0].close;
    for (let i = 0; i < data.length; i++) {
      const price = data[i].close;
      const mcg = prev + (price - prev) / (k * Math.pow(price / prev, 4));
      result.push(mcg);
      prev = mcg;
    }
    return result;
  }

  function calculateMedianPrice(data: CandleData[]): number[] {
    return data.map((d) => (d.high + d.low) / 2);
  }

  function calculateWMA(data: number[], period: number): number[] {
    const wma: number[] = [];
    const denom = (period * (period + 1)) / 2;
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        wma.push(NaN);
        continue;
      }
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[i - j] * (period - j);
      }
      wma.push(sum / denom);
    }
    return wma;
  }

  function calculateHMA(data: CandleData[], period = 9): number[] {
    const prices = data.map((d) => d.close);
    const wmaHalf = calculateWMA(prices, Math.floor(period / 2));
    const wmaFull = calculateWMA(prices, period);
    const diff = wmaHalf.map((v, i) =>
      isNaN(v) || isNaN(wmaFull[i]) ? NaN : 2 * v - wmaFull[i]
    );
    return calculateWMA(diff, Math.floor(Math.sqrt(period)));
  }

  function calculateParabolicSAR(
    data: CandleData[],
    step = 0.02,
    max = 0.2
  ): number[] {
    const sar: number[] = [];
    let isUptrend = true;
    let af = step;
    let ep = data[0].low;
    let psar = data[0].low;

    for (let i = 1; i < data.length; i++) {
      sar.push(psar);

      if (isUptrend) {
        psar = psar + af * (ep - psar);
        if (data[i].low < psar) {
          isUptrend = false;
          psar = ep;
          ep = data[i].low;
          af = step;
        } else {
          if (data[i].high > ep) {
            ep = data[i].high;
            af = Math.min(af + step, max);
          }
        }
      } else {
        psar = psar + af * (ep - psar);
        if (data[i].high > psar) {
          isUptrend = true;
          psar = ep;
          ep = data[i].high;
          af = step;
        } else {
          if (data[i].low < ep) {
            ep = data[i].low;
            af = Math.min(af + step, max);
          }
        }
      }
    }

    sar.unshift(data[0].low); // push first value to align length
    return sar;
  }

  function calculateATR(data: CandleData[], period = 10): number[] {
    const trs = data.map((d, i) => {
      if (i === 0) return d.high - d.low;
      const prevClose = data[i - 1].close;
      return Math.max(
        d.high - d.low,
        Math.abs(d.high - prevClose),
        Math.abs(d.low - prevClose)
      );
    });

    const atr: number[] = [];
    for (let i = 0; i < trs.length; i++) {
      if (i < period) {
        atr.push(NaN);
      } else {
        const avg =
          trs.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
        atr.push(avg);
      }
    }
    return atr;
  }

  function calculateSuperTrend(
    data: CandleData[],
    period = 10,
    multiplier = 3
  ): number[] {
    const atr = calculateATR(data, period);
    const result: number[] = [];
    let trendUp = true;
    let prevSuperTrend = data[0].close;

    for (let i = 0; i < data.length; i++) {
      if (i < period) {
        result.push(NaN);
        continue;
      }

      const hl2 = (data[i].high + data[i].low) / 2;
      const basicUpper = hl2 + multiplier * atr[i];
      const basicLower = hl2 - multiplier * atr[i];

      let superTrend = prevSuperTrend;
      if (trendUp) {
        if (data[i].close < basicLower) {
          trendUp = false;
          superTrend = basicUpper;
        } else {
          superTrend = Math.min(basicUpper, prevSuperTrend);
        }
      } else {
        if (data[i].close > basicUpper) {
          trendUp = true;
          superTrend = basicLower;
        } else {
          superTrend = Math.max(basicLower, prevSuperTrend);
        }
      }

      prevSuperTrend = superTrend;
      result.push(superTrend);
    }

    return result;
  }

  function calculateAroon(
    data: CandleData[],
    period = 14
  ): {
    up: number[];
    down: number[];
  } {
    const aroonUp: number[] = [];
    const aroonDown: number[] = [];

    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        aroonUp.push(NaN);
        aroonDown.push(NaN);
        continue;
      }

      const slice = data.slice(i - period + 1, i + 1);
      const highs = slice.map((d) => d.high);
      const lows = slice.map((d) => d.low);

      const highestIndex = highs.lastIndexOf(Math.max(...highs));
      const lowestIndex = lows.lastIndexOf(Math.min(...lows));

      const up = ((period - highestIndex) / period) * 100;
      const down = ((period - lowestIndex) / period) * 100;

      aroonUp.push(up);
      aroonDown.push(down);
    }

    return { up: aroonUp, down: aroonDown };
  }

  useEffect(() => {
    const width = dimensions.width;
    const height = dimensions.height;

    if (!chartRef.current) return;
    chartRef.current.innerHTML = "";

    const hasAroon = indicator === "Aroon";
    const aroonHeight = hasAroon ? 100 : 0;
    const xAxisHeight = 30;
    const totalHeight = height + xAxisHeight + aroonHeight;

    const app = new PIXI.Application({
      width,
      height: totalHeight,
      backgroundColor: 0x000000,
      antialias: true,
    });

    appRef.current = app;
    chartRef.current.appendChild(app.view);

    const chartContainer = new PIXI.Container();
    const aroonContainer = new PIXI.Container();

    const graphics = new PIXI.Graphics();
    chartContainer.addChild(graphics);
    app.stage.addChild(chartContainer);
    app.stage.addChild(aroonContainer);

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
          label.position.set(x - 10, totalHeight - xAxisHeight + 5);
          axisContainer.addChild(label);
        }
      }
    };

    const redraw = (mousePos?: { x: number; y: number }) => {
      const scale = scaleRef.current;
      const offsetX = offsetXRef.current;

      graphics.clear();
      aroonContainer.removeChildren();

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

      if (indicator === "McGinley Dynamic") {
        const mcg = calculateMcGinley(data);
        graphics.lineStyle(1.5, 0xffaa00); // Orange
        mcg.slice(startIndex, endIndex).forEach((val, i) => {
          if (val === null) return;
          const x = xFor(startIndex + i);
          const y = yFor(val);
          if (i === 0 || mcg[startIndex + i - 1] === null) {
            graphics.moveTo(x, y);
          } else {
            graphics.lineTo(x, y);
          }
        });
      }

      if (indicator === "Median Price") {
        const median = calculateMedianPrice(data);
        graphics.lineStyle(1.5, 0xff00ff); // Pink
        median.slice(startIndex, endIndex).forEach((val, i) => {
          const x = xFor(startIndex + i);
          const y = yFor(val);
          if (i === 0) {
            graphics.moveTo(x, y);
          } else {
            graphics.lineTo(x, y);
          }
        });
      }

      if (indicator === "Hull MA") {
        const hma = calculateHMA(data);
        graphics.lineStyle(1.5, 0x00ff99); // Green
        hma.slice(startIndex, endIndex).forEach((val, i) => {
          if (isNaN(val)) return;
          const x = xFor(startIndex + i);
          const y = yFor(val);
          if (i === 0 || isNaN(hma[startIndex + i - 1])) {
            graphics.moveTo(x, y);
          } else {
            graphics.lineTo(x, y);
          }
        });
      }

      if (indicator === "Parabolic SAR") {
        const psar = calculateParabolicSAR(data);
        graphics.lineStyle(0);
        psar.slice(startIndex, endIndex).forEach((val, i) => {
          const x = xFor(startIndex + i);
          const y = yFor(val);
          graphics.beginFill(0xff00ff);
          graphics.drawCircle(x, y, 2);
          graphics.endFill();
        });
      }

      if (indicator === "SuperTrend") {
        const supertrend = calculateSuperTrend(data);
        graphics.lineStyle(2, 0x00ffcc);
        supertrend.slice(startIndex, endIndex).forEach((val, i) => {
          if (isNaN(val)) return;
          const x = xFor(startIndex + i);
          const y = yFor(val);
          if (i === 0 || isNaN(supertrend[startIndex + i - 1])) {
            graphics.moveTo(x, y);
          } else {
            graphics.lineTo(x, y);
          }
        });
      }

      // If Aroon is selected, draw it in a separate pane below the main chart
      if (indicator === "Aroon") {
        const paneHeight = 100; // height for Aroon pane
        const aroon = calculateAroon(data);
        const up = aroon.up.slice(startIndex, endIndex);
        const down = aroon.down.slice(startIndex, endIndex);

        const yForAroon = (val: number) =>
          height + aroonHeight - (val / 100) * aroonHeight;

        // Adjust app height only if not already increased
        if (app.view.height !== height + 30 + paneHeight) {
          app.renderer.resize(width, height + 30 + paneHeight);
        }

        // Aroon Up line (Orange)
        graphics.lineStyle(1.5, 0xffa500);
        up.forEach((val, i) => {
          if (isNaN(val)) return;
          const x = xFor(startIndex + i);
          const y = yForAroon(val);
          if (i === 0 || isNaN(up[i - 1])) {
            graphics.moveTo(x, y);
          } else {
            graphics.lineTo(x, y);
          }
        });

        // Aroon Down line (Blue)
        graphics.lineStyle(1.5, 0x007aff);
        down.forEach((val, i) => {
          if (isNaN(val)) return;
          const x = xFor(startIndex + i);
          const y = yForAroon(val);
          if (i === 0 || isNaN(down[i - 1])) {
            graphics.moveTo(x, y);
          } else {
            graphics.lineTo(x, y);
          }
        });

        // Aroon Y-axis (right side, percentage)
        const step = 20;
        for (let v = 0; v <= 100; v += step) {
          const y = yForAroon(v);
          const label = new PIXI.Text(`${v.toFixed(0)}%`, {
            fontSize: 10,
            fill: 0xffffff,
          });
          label.anchor.set(1, 0.5);
          label.position.set(width - 4, y);
          axisContainer.addChild(label);

          graphics.lineStyle(0.5, 0x666666, 0.3);
          graphics.moveTo(0, y);
          graphics.lineTo(width, y);
        }
      }

      if (indicator !== "Aroon" && app.view.height !== height + 30) {
        app.renderer.resize(width, height + 30);
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
  }, [data, dimensions, chartType, indicator]);

  return (
    <div ref={containerRef} className="w-full h-full">
      {/* <select
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
        <option value="McGinley Dynamic">McGinley Dynamic</option>
        <option value="Median Price">Median Price</option>
        <option value="Parabolic SAR">Parabolic SAR</option>
        <option value="SuperTrend">SuperTrend</option>
        <option value="Hull MA">Hull MA</option>
        <option value="Aroon">Aroon</option>
      </select> */}

      <div
        ref={chartRef}
        style={{ width: "100%", height: dimensions.height + 30 }}
      />
    </div>
  );
};

export default CandlestickCharts;
