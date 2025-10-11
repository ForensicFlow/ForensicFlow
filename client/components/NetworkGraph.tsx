import React, { useState, useRef, useEffect } from 'react';

interface Node {
  id: string;
  group: string;
  label: string;
}

interface Link {
  source: string;
  target: string;
  label: string;
  evidence_ids?: string[];
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

interface NetworkGraphProps {
  graphData: GraphData;
  height?: number;
  isFullScreen?: boolean;
  onExpand?: () => void;
  onClose?: () => void;
  caseId?: string;
}

const NetworkGraph: React.FC<NetworkGraphProps> = ({
  graphData,
  height = 400,
  isFullScreen = false,
  onExpand,
  onClose,
  caseId
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);

  // Simple force-directed graph simulation
  const [nodePositions, setNodePositions] = useState<Map<string, { x: number; y: number }>>(new Map());

  useEffect(() => {
    // Initialize node positions
    const positions = new Map<string, { x: number; y: number }>();
    const width = containerRef.current?.clientWidth || 600;
    const graphHeight = isFullScreen ? window.innerHeight - 100 : height;

    graphData.nodes.forEach((node, index) => {
      const angle = (index / graphData.nodes.length) * 2 * Math.PI;
      const radius = Math.min(width, graphHeight) * 0.3;
      positions.set(node.id, {
        x: width / 2 + radius * Math.cos(angle),
        y: graphHeight / 2 + radius * Math.sin(angle)
      });
    });

    setNodePositions(positions);
  }, [graphData, height, isFullScreen]);

  useEffect(() => {
    if (!canvasRef.current || nodePositions.size === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const graphHeight = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, graphHeight);

    // Draw links
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    graphData.links.forEach(link => {
      const sourcePos = nodePositions.get(link.source);
      const targetPos = nodePositions.get(link.target);
      
      if (sourcePos && targetPos) {
        ctx.beginPath();
        ctx.moveTo(sourcePos.x, sourcePos.y);
        ctx.lineTo(targetPos.x, targetPos.y);
        ctx.stroke();
      }
    });

    // Draw nodes
    graphData.nodes.forEach(node => {
      const pos = nodePositions.get(node.id);
      if (!pos) return;

      const isHovered = hoveredNode?.id === node.id;
      const isSelected = selectedNode?.id === node.id;

      // Node color based on group
      const colors: Record<string, string> = {
        person: '#60a5fa',
        organization: '#f59e0b',
        location: '#10b981',
        device: '#8b5cf6',
        account: '#ec4899',
        phone_number: '#06b6d4',
        source: '#f97316',
        other: '#64748b'
      };

      ctx.fillStyle = colors[node.group] || colors.other;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, isSelected ? 12 : isHovered ? 10 : 8, 0, 2 * Math.PI);
      ctx.fill();

      // Border for selected/hovered
      if (isSelected || isHovered) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Label
      ctx.fillStyle = '#fff';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(node.label.substring(0, 20), pos.x, pos.y + 20);
    });
  }, [graphData, nodePositions, selectedNode, hoveredNode]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find clicked node
    for (const node of graphData.nodes) {
      const pos = nodePositions.get(node.id);
      if (!pos) continue;

      const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
      if (distance < 12) {
        setSelectedNode(node);
        return;
      }
    }

    setSelectedNode(null);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find hovered node
    for (const node of graphData.nodes) {
      const pos = nodePositions.get(node.id);
      if (!pos) continue;

      const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
      if (distance < 12) {
        setHoveredNode(node);
        return;
      }
    }

    setHoveredNode(null);
  };

  const handleDownloadPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `network-graph-${caseId || 'case'}-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleDownloadPDF = async () => {
    // Placeholder for jsPDF integration
    // Will be implemented when jsPDF is installed
    console.log('PDF download - jsPDF not yet installed');
    alert('PDF download will be available after installing jsPDF library');
  };

  const containerWidth = isFullScreen ? window.innerWidth - 100 : containerRef.current?.clientWidth || 600;
  const containerHeight = isFullScreen ? window.innerHeight - 100 : height;

  return (
    <div
      ref={containerRef}
      className={`relative ${isFullScreen ? 'fixed inset-0 z-50 bg-slate-900 p-8' : 'rounded-lg border border-slate-700 bg-slate-800/50'}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/20 rounded-lg">
            <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Relationship Network</h3>
            <p className="text-sm text-slate-400">
              {graphData.nodes.length} entities • {graphData.links.length} connections
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Download Buttons */}
          <button
            onClick={handleDownloadPNG}
            className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors border border-slate-600"
            title="Download as PNG"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>

          {!isFullScreen && onExpand && (
            <button
              onClick={onExpand}
              className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm rounded-lg transition-colors"
              title="Expand to full screen"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
          )}

          {isFullScreen && onClose && (
            <button
              onClick={onClose}
              className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white text-sm rounded-lg transition-colors"
              title="Close full screen"
            >
              ✕ Close
            </button>
          )}
        </div>
      </div>

      {/* Graph Canvas */}
      <div className="relative" style={{ height: containerHeight - 80 }}>
        <canvas
          ref={canvasRef}
          width={containerWidth}
          height={containerHeight - 80}
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
          className="w-full h-full cursor-pointer"
        />

        {/* Node Info Panel */}
        {selectedNode && (
          <div className="absolute top-4 right-4 bg-slate-800 border border-cyan-500/50 rounded-lg p-4 max-w-xs shadow-xl">
            <div className="flex items-start justify-between mb-2">
              <h4 className="text-sm font-semibold text-cyan-300">Selected Entity</h4>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <p className="text-white font-medium mb-1">{selectedNode.label}</p>
            <p className="text-xs text-slate-400 mb-2">Type: {selectedNode.group}</p>
            
            {/* Show connected nodes */}
            <div className="mt-3 pt-3 border-t border-slate-700">
              <p className="text-xs font-medium text-slate-300 mb-2">Connections:</p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {graphData.links
                  .filter(link => link.source === selectedNode.id || link.target === selectedNode.id)
                  .map((link, idx) => (
                    <div key={idx} className="text-xs text-slate-400">
                      {link.source === selectedNode.id ? '→ ' : '← '}
                      {link.source === selectedNode.id 
                        ? graphData.nodes.find(n => n.id === link.target)?.label 
                        : graphData.nodes.find(n => n.id === link.source)?.label}
                      <span className="text-cyan-400 ml-1">({link.label})</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-slate-800/90 border border-slate-700 rounded-lg p-3">
          <p className="text-xs font-semibold text-slate-300 mb-2">Entity Types</p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries({
              person: '#60a5fa',
              organization: '#f59e0b',
              location: '#10b981',
              device: '#8b5cf6',
              account: '#ec4899',
              phone_number: '#06b6d4'
            }).map(([type, color]) => (
              <div key={type} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs text-slate-400 capitalize">{type.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkGraph;



