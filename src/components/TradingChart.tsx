
import React, { useRef, useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { drawCandlesticks } from '../utils/candlestickRenderer';
import { ChartInteractions } from '../utils/chartInteractions';

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
  // Store the chart interactions instance
  const interactionsRef = useRef<ChartInteractions | null>(null);

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
        const container = drawCandlesticks(candleData, app);
        
        // Step 3: Setup zoom and pan interactions
        interactionsRef.current = new ChartInteractions(app, container, {
          minZoom: 0.3,
          maxZoom: 10,
          zoomSpeed: 0.15
        });
        
        console.log('Chart interactions enabled');
      }
    };

    initializePixiApp().catch((error) => {
      console.error('Failed to initialize PixiJS application:', error);
    });

    // Step 4: Cleanup function - runs when component unmounts or dependencies change
    return () => {
      console.log('Cleaning up PixiJS application...');
      if (interactionsRef.current) {
        interactionsRef.current.destroy();
        interactionsRef.current = null;
      }
      if (appRef.current) {
        appRef.current.destroy(true); // Destroy app and remove from DOM
        appRef.current = null;
      }
    };
  }, [candleData, width, height]); // Re-run when these values change

  const handleResetZoom = () => {
    if (interactionsRef.current) {
      interactionsRef.current.resetZoom();
    }
  };

  return (
    <div className="trading-chart-container">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-white">Interactive Candlestick Chart</h3>
        <button
          onClick={handleResetZoom}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
        >
          Reset Zoom
        </button>
      </div>
      
      <div className="mb-2 text-sm text-gray-400">
        Use mouse wheel to zoom, drag to pan
      </div>
      
      {/* This canvas element is where PixiJS will render our chart */}
      <canvas 
        ref={canvasRef} 
        className="border border-gray-600 rounded cursor-grab"
      />
    </div>
  );
};

export default TradingChart;
