import React, { useRef, useState } from "react";

interface ResizablePaneProps {
  direction: "horizontal" | "vertical";
  children: React.ReactNode[]; // Support more than two children
  initialSplit?: number; // Optional default split, applies only if 2 children
}

const ResizablePane: React.FC<ResizablePaneProps> = ({
  direction,
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isHorizontal = direction === "horizontal";
  const [sizes, setSizes] = useState<number[]>(
    Array(children.length).fill(100 / children.length)
  );

  const onMouseDown = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    const start = isHorizontal ? e.clientX : e.clientY;
    const startSizes = [...sizes];

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!containerRef.current) return;

      const current = isHorizontal ? moveEvent.clientX : moveEvent.clientY;
      const deltaPx = current - start;
      const rect = containerRef.current.getBoundingClientRect();
      const containerSize = isHorizontal ? rect.width : rect.height;
      const deltaPercent = (deltaPx / containerSize) * 100;

      const newSizes = [...startSizes];
      newSizes[index] = Math.max(5, startSizes[index] + deltaPercent);
      newSizes[index + 1] = Math.max(5, startSizes[index + 1] - deltaPercent);

      setSizes(newSizes);
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  return (
    <div
      ref={containerRef}
      className={`w-full h-full flex ${isHorizontal ? "flex-row" : "flex-col"}`}
    >
      {children.map((child, index) => (
        <React.Fragment key={index}>
          <div
            style={{
              width: isHorizontal ? `${sizes[index]}%` : "100%",
              height: isHorizontal ? "100%" : `${sizes[index]}%`,
            }}
            className="overflow-hidden"
          >
            {child}
          </div>

          {index < children.length - 1 && (
            <div
              onMouseDown={(e) => onMouseDown(index, e)}
              className={`${
                isHorizontal ? "w-1 cursor-col-resize" : "h-1 cursor-row-resize"
              } bg-gray-600 hover:bg-gray-400`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default ResizablePane;
