
// Define the structure of our candle data
interface CandleData {
  open: number;
  high: number;
  low: number;
  close: number;
  timestamp?: string;
}

// Generate realistic looking sample trading data
export const generateSampleData = (count: number = 50): CandleData[] => {
  const data: CandleData[] = [];
  let lastClose = 100; // Starting price
  
  for (let i = 0; i < count; i++) {
    // Generate a realistic price movement
    const changePercent = (Math.random() - 0.5) * 2; // Random value between -1% and 1%
    const volatilityFactor = 1 + (changePercent / 100);
    
    const open = lastClose;
    const close = open * volatilityFactor;
    
    // Generate realistic high and low values
    const wickSize = open * (0.2 + Math.random() * 0.8) / 100;
    const high = Math.max(open, close) + wickSize;
    const low = Math.min(open, close) - wickSize;
    
    // Create a date for this candle (going back from today)
    const date = new Date();
    date.setDate(date.getDate() - (count - i));
    const timestamp = date.toISOString().split('T')[0];
    
    // Add the candle to our data array
    data.push({
      open,
      high,
      low,
      close,
      timestamp
    });
    
    // Set up for next iteration
    lastClose = close;
  }
  
  return data;
};

// Sample data ready to use
export const sampleCandleData = generateSampleData(100);
