// import { useRef } from 'react';
// import WindowSlot from './WindowSlot';

// interface WindowManagerProps {
//   rows: number;
//   columns: number;
//   syncX: boolean;
// }

// const createXScale = () => ({
//   scale: 1,
//   offset: 0
// });

// const createYScale = () => ({
//   min: 0,
//   max: 100
// });

// function WindowManager({ rows, columns, syncX }: WindowManagerProps) {
//   const totalSlots = rows * columns;
//   const sharedXScale = useRef(createXScale());

//   return (
//     <div
//       style={{
//         display: "grid",
//         gridTemplateColumns: `repeat(${columns}, 1fr)`,
//         gridTemplateRows: `repeat(${rows}, 1fr)`,
//         gap: "5px",
//         height: "100%",
//       }}
//     >
//       {Array.from({ length: totalSlots }).map((_, i) => (
//         <WindowSlot
//           key={i}
//           sharedXScale={syncX ? sharedXScale.current : createXScale()}
//           yScale={createYScale()}
//           className="bg-gray-900 rounded-lg overflow-hidden"
//         />
//       ))}
//     </div>
//   );
// }

// export default WindowManager;

import React, { useState } from "react";
import CandlestickCharts from "./CandlestickCharts";
// import sampleData from "./sampleData.json"; // or use props

const layouts = [
  { label: "1x1", rows: 1, columns: 1 },
  { label: "1x2", rows: 1, columns: 2 },
  { label: "2x2", rows: 2, columns: 2 },
];

const WindowManager = ({ data }) => {
  const [layout, setLayout] = useState(layouts[0]); // default 1x1

  const totalWindows = layout.rows * layout.columns;

  return (
    <div>
      {/* Layout Selector */}
      <div style={{ marginBottom: 10 }}>
        {layouts.map((l) => (
          <button
            key={l.label}
            onClick={() => setLayout(l)}
            style={{
              marginRight: 5,
              padding: "5px 10px",
              background: layout.label === l.label ? "#444" : "#222",
              color: "white",
              border: "1px solid #666",
              borderRadius: 4,
            }}
          >
            {l.label}
          </button>
        ))}
      </div>

      {/* Grid Layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${layout.columns}, 1fr)`,
          gridTemplateRows: `repeat(${layout.rows}, 1fr)`,
          gap: "8px",
          height: "calc(100vh - 100px)",
        }}
      >
        {Array.from({ length: totalWindows }).map((_, index) => (
          <div key={index} style={{ border: "1px solid #555" }}>
            <CandlestickCharts data={data} width={1000} height={600} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default WindowManager;
