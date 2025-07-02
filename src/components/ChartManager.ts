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
