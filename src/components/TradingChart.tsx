
import React, { useRef, useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { drawCandlesticks } from '../utils/candlestickRenderer';

// Define the structure of our candle data
interface CandleData {
  open: number;
  high: number;
  low: number;
  close: number;
  timestamp?: string;
}

interface TradingChartProps {
  candleData: CandleData[];
  width?: number;
  height?: number;
}

const TradingChart: React.FC<TradingChartProps> = ({ 
  candleData, 
  width = 800, 
  height = 400 
}) => {
  // Create a ref to attach the PixiJS canvas to our React component
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Store the PixiJS application instance
  const appRef = useRef<PIXI.Application | null>(null);

  useEffect(() => {
    // This effect runs when the component mounts or when candleData changes
    console.log('Initializing PixiJS application...');
    
    const initializePixiApp = async () => {
      // Step 1: Create a new PixiJS application with await for proper initialization
      const app = new PIXI.Application();
      
      // Initialize the application
      await app.init({
        canvas: canvasRef.current!, // Attach to our canvas element
        width: width,             // Set chart width
        height: height,           // Set chart height
        backgroundColor: 0x1a1a1a, // Dark background (hex color)
        antialias: true,          // Enable smooth edges
      });

      // Store the app reference for cleanup later
      appRef.current = app;
      console.log('PixiJS application created successfully');

      // Step 2: Draw the candlesticks using our utility function
      if (candleData && candleData.length > 0) {
        console.log(`Drawing ${candleData.length} candlesticks...`);
        drawCandlesticks(candleData, app);
      }
    };

    initializePixiApp().catch((error) => {
      console.error('Failed to initialize PixiJS application:', error);
    });

    // Step 3: Cleanup function - runs when component unmounts or dependencies change
    return () => {
      console.log('Cleaning up PixiJS application...');
      if (appRef.current) {
        appRef.current.destroy(true); // Destroy app and remove from DOM
        appRef.current = null;
      }
    };
  }, [candleData, width, height]); // Re-run when these values change

  return (
    <div className="trading-chart-container">
      <h3 className="text-lg font-semibold mb-2 text-white">Candlestick Chart</h3>
      {/* This canvas element is where PixiJS will render our chart */}
      <canvas 
        ref={canvasRef} 
        className="border border-gray-600 rounded"
      />
    </div>
  );
};

export default TradingChart;
