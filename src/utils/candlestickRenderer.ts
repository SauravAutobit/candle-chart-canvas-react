
import * as PIXI from 'pixi.js';

// Define the structure of our candle data
interface CandleData {
  open: number;
  high: number;
  low: number;
  close: number;
}

export const drawCandlesticks = (candleData: CandleData[], app: PIXI.Application): PIXI.Container => {
  console.log('Starting to draw candlesticks...');
  
  // Step 1: Validate input data
  if (!candleData || candleData.length === 0) {
    console.log('No candle data provided');
    return new PIXI.Container();
  }

  // Step 2: Set up chart dimensions
  const candleWidth = 12;        
  const candleSpacing = 16;      
  const chartPadding = 50;       
  
  // Calculate the total width needed for ALL candles
  const totalDataWidth = candleData.length * candleSpacing;
  const chartHeight = app.screen.height - (chartPadding * 2);

  console.log(`Total data width: ${totalDataWidth}px for ${candleData.length} candles`);
  console.log(`Chart height: ${chartHeight}px`);

  // Step 3: Calculate price range for scaling
  const allPrices = candleData.flatMap(candle => [candle.open, candle.high, candle.low, candle.close]);
  const maxPrice = Math.max(...allPrices);
  const minPrice = Math.min(...allPrices);
  const priceRange = maxPrice - minPrice;
  
  console.log(`Price range: ${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)}`);

  // Calculate how many pixels represent one unit of price
  const priceScale = priceRange > 0 ? chartHeight / priceRange : 1;

  // Step 4: Clear existing graphics and create main container
  app.stage.removeChildren();
  
  // Create the main container - this is our "world" that contains all data
  const worldContainer = new PIXI.Container();
  
  // Step 5: Draw background grid
  const grid = new PIXI.Graphics();
  
  // Horizontal grid lines (price levels)
  const priceStep = priceRange / 10;
  for (let i = 0; i <= 10; i++) {
    const price = minPrice + (priceStep * i);
    const y = chartHeight - ((price - minPrice) * priceScale);
    
    grid.stroke({ width: 1, color: 0x333333, alpha: 0.3 });
    grid.moveTo(0, y);
    grid.lineTo(totalDataWidth, y);
    
    // Add price labels
    if (i % 2 === 0) {
      const priceLabel = new PIXI.Text({
        text: price.toFixed(2),
        style: {
          fill: 0x999999,
          fontSize: 12,
        }
      });
      priceLabel.x = -40;
      priceLabel.y = y - 8;
      worldContainer.addChild(priceLabel);
    }
  }
  
  // Vertical grid lines
  const timeStep = Math.max(1, Math.floor(candleData.length / 20));
  for (let i = 0; i < candleData.length; i += timeStep) {
    const x = i * candleSpacing;
    grid.moveTo(x, 0);
    grid.lineTo(x, chartHeight);
  }
  
  worldContainer.addChild(grid);
  
  // Step 6: Draw ALL candlesticks
  console.log(`Drawing all ${candleData.length} candlesticks...`);
  
  candleData.forEach((candle, index) => {
    // Calculate x position of this candle
    const x = index * candleSpacing;
    
    // Calculate y positions for OHLC values
    const openY = chartHeight - ((candle.open - minPrice) * priceScale);
    const highY = chartHeight - ((candle.high - minPrice) * priceScale);
    const lowY = chartHeight - ((candle.low - minPrice) * priceScale);
    const closeY = chartHeight - ((candle.close - minPrice) * priceScale);
    
    // Determine if this is a bullish or bearish candle
    const isBullish = candle.close > candle.open;
    const candleColor = isBullish ? 0x4CAF50 : 0xF44336;
    
    // Create a graphics object for this candle
    const candleGraphic = new PIXI.Graphics();
    
    // Draw the wick (high-low line) first
    candleGraphic.stroke({ width: 2, color: candleColor });
    candleGraphic.moveTo(x + candleWidth / 2, highY);
    candleGraphic.lineTo(x + candleWidth / 2, lowY);
    
    // Draw the candle body (open-close rectangle)
    const bodyHeight = Math.max(Math.abs(closeY - openY), 2); // Minimum height of 2px
    const bodyY = Math.min(openY, closeY);
    
    candleGraphic.fill(candleColor);
    candleGraphic.rect(x, bodyY, candleWidth, bodyHeight);
    
    // Add this candle to the world container
    worldContainer.addChild(candleGraphic);
    
    // Debug log for first few candles
    if (index < 3) {
      console.log(`Candle ${index}: x=${x}, bodyY=${bodyY}, height=${bodyHeight}, color=${candleColor.toString(16)}`);
    }
  });
  
  // Step 7: Position the world container
  worldContainer.x = chartPadding;
  worldContainer.y = chartPadding;
  
  // Position to show recent data initially
  const initialCameraX = Math.max(0, totalDataWidth - app.screen.width + chartPadding * 2);
  worldContainer.x = -initialCameraX + chartPadding;
  
  // Add the world container to the stage
  app.stage.addChild(worldContainer);
  
  console.log(`Candlesticks drawn successfully. World container position: (${worldContainer.x}, ${worldContainer.y})`);
  console.log(`World container children count: ${worldContainer.children.length}`);
  
  return worldContainer;
};
