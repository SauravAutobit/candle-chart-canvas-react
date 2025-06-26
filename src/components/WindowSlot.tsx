import { useRef, useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { sampleData } from '../utils/sampleTradingData';
import { renderCandlestickChart } from '../utils/candlestickRenderer';

interface Scale {
  scale: number;
  offset: number;
}

interface YScale {
  min: number;
  max: number;
}

interface WindowSlotProps {
  sharedXScale: Scale;
  yScale: YScale;
  className?: string;
}

function WindowSlot({ sharedXScale, yScale, className }: WindowSlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const app = new PIXI.Application({
      width: 300,
      height: 200,
      backgroundColor: 0x1e1e1e,
    });
    containerRef.current?.appendChild(app.view);

    const graphics = new PIXI.Graphics();
    app.stage.addChild(graphics);

    renderCandlestickChart(graphics, sampleData, sharedXScale, yScale);

    return () => app.destroy(true);
  }, []);

  return (
    <div 
      ref={containerRef} 
      className={`${className || ''} w-full h-full`}
    />
  );
}

export default WindowSlot;
