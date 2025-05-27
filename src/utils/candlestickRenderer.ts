
import * as PIXI from 'pixi.js';

// Define the structure of our candle data
interface CandleData {
  open: number;
  high: number;
  low: number;
  close: number;
}

export const drawCandlesticks = (candleData: CandleData[], app: PIXI.Application) => {
  console.log('Starting to draw candlesticks...');
  
  // Step 1: Validate input data
  if (!candleData || candleData.length === 0) {
    console.log('No candle data provided');
    return;
  }

  // Step 2: Set up chart dimensions and spacing
  const candleWidth = 8;        // Width of each candlestick body
  const candleSpacing = 12;     // Total space allocated per candle (including gaps)
  const chartPadding = 40;      // Padding around the chart edges
  const chartWidth = app.screen.width - (chartPadding * 2);
  const chartHeight = app.screen.height - (chartPadding * 2);

  console.log(`Chart dimensions: ${chartWidth}x${chartHeight}`);

  // Step 3: Calculate price range for scaling
  // Find the highest and lowest prices across all candles
  const allPrices = candleData.flatMap(candle => [candle.open, candle.high, candle.low, candle.close]);
  const maxPrice = Math.max(...allPrices);
  const minPrice = Math.min(...allPrices);
  const priceRange = maxPrice - minPrice;
  
  console.log(`Price range: ${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)}`);

  // Calculate how many pixels represent one unit of price
  const priceScale = priceRange > 0 ? chartHeight / priceRange : 1;

  // Step 4: Clear any existing graphics from previous renders
  app.stage.removeChildren();
  
  // Create a graphics container to hold all candlesticks
  const container = new PIXI.Container();
  container.x = chartPadding;
  container.y = chartPadding;
  
  // Step 5: Draw a background grid for better readability
  const grid = new PIXI.Graphics();
  grid.lineStyle(1, 0x333333, 0.5);
  
  // Draw horizontal grid lines
  const priceStep = priceRange / 5;
  for (let i = 0; i <= 5; i++) {
    const price = minPrice + (priceStep * i);
    const y = chartHeight - ((price - minPrice) * priceScale);
    grid.moveTo(0, y);
    grid.lineTo(chartWidth, y);
    
    // Add price labels
    const priceLabel = new PIXI.Text({
      text: price.toFixed(2),
      style: {
        fill: 0x999999,
        fontSize: 10,
      }
    });
    priceLabel.x = -35;
    priceLabel.y = y - 7;
    container.addChild(priceLabel);
  }
  
  // Add grid to container
  container.addChild(grid);
  
  // Step 6: Draw each candlestick
  candleData.forEach((candle, index) => {
    // Cap the visible candlesticks to fit within chart width
    if (index * candleSpacing > chartWidth) return;
    
    // Calculate x position of this candle
    const x = index * candleSpacing;
    
    // Calculate y positions for OHLC values
    // Note that in computer graphics y=0 is at the top, so we invert the values
    const openY = chartHeight - ((candle.open - minPrice) * priceScale);
    const highY = chartHeight - ((candle.high - minPrice) * priceScale);
    const lowY = chartHeight - ((candle.low - minPrice) * priceScale);
    const closeY = chartHeight - ((candle.close - minPrice) * priceScale);
    
    // Determine if this is a bullish or bearish candle
    const isBullish = candle.close > candle.open;
    
    // Create a graphics object for this candle
    const candleGraphic = new PIXI.Graphics();
    
    // Step 6a: Draw the wick (vertical line from high to low)
    candleGraphic.lineStyle(1, isBullish ? 0x4CAF50 : 0xF44336);
    candleGraphic.moveTo(x + candleWidth / 2, highY);
    candleGraphic.lineTo(x + candleWidth / 2, lowY);
    
    // Step 6b: Draw the candle body (rectangle between open and close)
    const bodyColor = isBullish ? 0x4CAF50 : 0xF44336;  // Green for bullish, red for bearish
    candleGraphic.beginFill(bodyColor);
    candleGraphic.drawRect(
      x,  // x position
      isBullish ? closeY : openY,  // y position (top of body)
      candleWidth,  // width of rectangle
      Math.abs(closeY - openY) || 1  // height (at least 1px for flat candles)
    );
    candleGraphic.endFill();
    
    // Add this candle to the container
    container.addChild(candleGraphic);
  });
  
  // Add the container to the stage
  app.stage.addChild(container);
  
  console.log('Candlesticks drawn successfully');
};
