export type LayoutType =
  | "1"
  | "2H"
  | "2V"
  | "3H"
  | "3V"
  | "3L-R2"
  | "3R-L2"
  | "3T-B2"
  | "3B-T2"
  | "4"
  | "4L"
  | "4V"
  | "4L-R3"
  | "4R-L3"
  | "4T-B3"
  | "4B-T3"
  | "4L2-R2"
  | "4R2-L2"
  | "4T2-B2"
  | "5"
  | "6"
  | "6V"
  | "7"
  | "8"
  | "9"
  | "10"
  | "12"
  | "14"
  | "16";

type CallbackFn = (layout: LayoutType) => void;

let layoutCallback: CallbackFn | null = null;
let isRegistered = false;

export const registerLayoutHandler = (cb: CallbackFn) => {
  layoutCallback = cb;
  isRegistered = true;
};

export const setLayout = (layout: LayoutType) => {
  if (layoutCallback) layoutCallback(layout);
};

export const isLayoutHandlerReady = () => isRegistered;

let resizingAllowed = true;
const initialPaneSizes: Record<string, number[]> = {};

export function setResizableCharts(value: boolean) {
  resizingAllowed = value;
}

export function setInitialPaneSizes(layout: LayoutType, sizes: number[]) {
  initialPaneSizes[layout] = sizes;
}

export function getChartConfig(layout: LayoutType) {
  return {
    resizable: resizingAllowed,
    sizes: initialPaneSizes[layout] || undefined,
  };
}

export function parseNestedPaneSizes(
  layout: LayoutType,
  sizes?: number[]
): {
  horizontalSizes?: number[];
  verticalSizes?: number[];
  nestedHorizontal?: number[];
  nestedVertical?: number[];
} {
  if (!sizes) return {};

  switch (layout) {
    case "3L-R2": {
      const [leftWidth, topHeight, bottomHeight] = sizes;
      return {
        horizontalSizes: [leftWidth, 100 - leftWidth],
        verticalSizes: [topHeight, bottomHeight],
      };
    }

    case "3R-L2": {
      const [rightWidth, topHeight, bottomHeight] = sizes;
      return {
        horizontalSizes: [100 - rightWidth, rightWidth],
        verticalSizes: [topHeight, bottomHeight],
      };
    }

    case "4L-R3": {
      const [leftWidth, topRight, midRight, bottomRight] = sizes;
      return {
        horizontalSizes: [leftWidth, 100 - leftWidth],
        verticalSizes: [topRight, midRight, bottomRight],
      };
    }

    case "4T2-B2": {
      const [topLeft, topRight, bottomLeft, bottomRight] = sizes;
      return {
        verticalSizes: [50, 50], // or derive if dynamic
        nestedHorizontal: [topLeft, topRight],
        nestedVertical: [bottomLeft, bottomRight],
      };
    }

    default:
      return {};
  }
}

type CandleData = {
  open: number;
  high: number;
  low: number;
  close: number;
  timestamp: number;
};

export const generateRandomCandlestickData = (count: number): CandleData[] => {
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

// ----------

 export  function calculateSMA(data: CandleData[], period: number): (number | null)[] {
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

  export function calculateMcGinley(data: CandleData[], k = 0.6): (number | null)[] {
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

  export function calculateMedianPrice(data: CandleData[]): number[] {
    return data.map((d) => (d.high + d.low) / 2);
  }

  export function calculateWMA(data: number[], period: number): number[] {
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

 export function calculateHMA(data: CandleData[], period = 9): number[] {
    const prices = data.map((d) => d.close);
    const wmaHalf = calculateWMA(prices, Math.floor(period / 2));
    const wmaFull = calculateWMA(prices, period);
    const diff = wmaHalf.map((v, i) =>
      isNaN(v) || isNaN(wmaFull[i]) ? NaN : 2 * v - wmaFull[i]
    );
    return calculateWMA(diff, Math.floor(Math.sqrt(period)));
  }

  export function calculateParabolicSAR(
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

  export function calculateATR(data: CandleData[], period = 10): number[] {
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

  export function calculateSuperTrend(
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

  export function calculateAroon(
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
  