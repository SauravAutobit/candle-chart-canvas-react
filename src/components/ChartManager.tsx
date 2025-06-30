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
