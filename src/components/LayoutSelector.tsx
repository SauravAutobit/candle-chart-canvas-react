interface LayoutSelectorProps {
  onSelectLayout: (rows: number, columns: number) => void;
}

function LayoutSelector({ onSelectLayout }: LayoutSelectorProps) {
  const layouts = {
    "1x1": { rows: 1, columns: 1 },
    "1x2": { rows: 1, columns: 2 },
    "2x2": { rows: 2, columns: 2 },
    "1x3": { rows: 1, columns: 3 },
    // Add more as per TradingView UI
  };

  return (
    <div className="fixed top-4 right-4 flex gap-2 bg-gray-800 p-2 rounded-lg shadow-lg z-50">
      {Object.entries(layouts).map(([key, { rows, columns }]) => (
        <button
          key={key}
          onClick={() => onSelectLayout(rows, columns)}
          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
        >
          {key}
        </button>
      ))}
    </div>
  );
}

export default LayoutSelector;
