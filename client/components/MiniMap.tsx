import React from 'react';

interface LocationPoint {
  id: string;
  lat: number;
  lon: number;
  timestamp: string;
  label?: string;
  device?: string;
}

interface MiniMapProps {
  locations: LocationPoint[];
  height?: number;
  onExpandClick?: () => void;
}

const MiniMap: React.FC<MiniMapProps> = ({ 
  locations, 
  height = 300,
  onExpandClick 
}) => {
  // Calculate bounds
  const lats = locations.map(l => l.lat);
  const lons = locations.map(l => l.lon);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);

  // Add padding
  const latRange = maxLat - minLat || 0.01;
  const lonRange = maxLon - minLon || 0.01;
  const padding = 0.1;

  // Convert lat/lon to pixel coordinates
  const toPixel = (lat: number, lon: number) => {
    const x = ((lon - minLon + lonRange * padding) / (lonRange * (1 + 2 * padding))) * 100;
    const y = 100 - ((lat - minLat + latRange * padding) / (latRange * (1 + 2 * padding))) * 100;
    return { x, y };
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', { 
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Sort by timestamp
  const sortedLocations = [...locations].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return (
    <div className="mini-map bg-slate-900/50 rounded-lg border border-slate-700">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-800/50">
        <div className="flex items-center gap-2">
          <span className="text-lg">📍</span>
          <h4 className="text-sm font-semibold text-white">Location Map</h4>
          <span className="text-xs text-slate-400">({locations.length} points)</span>
        </div>
        {onExpandClick && (
          <button
            onClick={onExpandClick}
            className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            🗺️ Open Full Map →
          </button>
        )}
      </div>

      {/* Map Visualization */}
      <div className="p-4">
        <div 
          className="relative bg-slate-800 rounded-lg overflow-hidden border border-slate-700"
          style={{ height: height - 60 }}
        >
          {/* Grid Background */}
          <svg className="absolute inset-0 w-full h-full opacity-10">
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* Location Path */}
          {sortedLocations.length > 1 && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <path
                d={sortedLocations.map((loc, idx) => {
                  const { x, y } = toPixel(loc.lat, loc.lon);
                  return `${idx === 0 ? 'M' : 'L'} ${x}% ${y}%`;
                }).join(' ')}
                stroke="#06b6d4"
                strokeWidth="2"
                fill="none"
                strokeDasharray="5,5"
                opacity="0.5"
              />
            </svg>
          )}

          {/* Location Markers */}
          {sortedLocations.map((loc, idx) => {
            const { x, y } = toPixel(loc.lat, loc.lon);
            const isFirst = idx === 0;
            const isLast = idx === sortedLocations.length - 1;

            return (
              <div
                key={loc.id}
                className="absolute group"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                {/* Marker Pin */}
                <div
                  className={`w-4 h-4 rounded-full border-2 border-white shadow-lg cursor-pointer transition-transform hover:scale-150 z-10 ${
                    isFirst
                      ? 'bg-green-500'
                      : isLast
                      ? 'bg-red-500'
                      : 'bg-cyan-500'
                  }`}
                  title={`${loc.label || 'Location'} - ${formatTime(loc.timestamp)}`}
                >
                  {/* Pulse animation for latest */}
                  {isLast && (
                    <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75"></div>
                  )}
                </div>

                {/* Tooltip on Hover */}
                <div className="absolute left-1/2 bottom-full mb-2 transform -translate-x-1/2 hidden group-hover:block z-20">
                  <div className="bg-slate-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow-xl border border-slate-700">
                    <div className="font-semibold">{loc.label || `Point ${idx + 1}`}</div>
                    <div className="text-slate-400">{formatTime(loc.timestamp)}</div>
                    {loc.device && (
                      <div className="text-slate-500 text-xs">{loc.device}</div>
                    )}
                    <div className="text-slate-500 text-xs">
                      {loc.lat.toFixed(6)}, {loc.lon.toFixed(6)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Legend */}
          <div className="absolute bottom-2 right-2 bg-slate-900/90 rounded px-3 py-2 text-xs space-y-1 border border-slate-700">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-white"></div>
              <span className="text-slate-300">Start</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-white"></div>
              <span className="text-slate-300">Latest</span>
            </div>
            {sortedLocations.length > 2 && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-cyan-500 border-2 border-white"></div>
                <span className="text-slate-300">Waypoint</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Location List */}
      <div className="px-4 pb-4 max-h-32 overflow-y-auto">
        <div className="text-xs text-slate-400 mb-2">Location History:</div>
        <div className="space-y-1">
          {sortedLocations.map((loc, idx) => (
            <div key={loc.id} className="flex items-center justify-between text-xs bg-slate-800/50 rounded px-2 py-1">
              <span className="text-slate-300">
                {idx + 1}. {loc.label || `Location ${idx + 1}`}
              </span>
              <span className="text-slate-500">{formatTime(loc.timestamp)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-slate-700 bg-slate-800/50">
        <p className="text-xs text-slate-500">
          💡 Green = Start, Red = Latest position, Dotted line = Movement path
        </p>
      </div>
    </div>
  );
};

export default MiniMap;
