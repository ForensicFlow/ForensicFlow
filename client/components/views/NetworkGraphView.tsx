import React, { useMemo, useState, useEffect } from 'react';
import { evidenceApi } from '../../lib/api';
import { EvidenceSnippet } from '../../types';
import { UserCircleIcon, LocationMarkerIcon, DeviceMobileIcon, ShieldCheckIcon, CubeTransparentIcon } from '../icons';
import { useDemo } from '../../contexts/DemoContext';

type NodeType = 'Person' | 'Location' | 'Crypto' | 'Device';
interface Node {
    id: string;
    label: string;
    type: NodeType;
    position: { x: number; y: number };
}
interface Edge {
    source: string;
    target: string;
}

const getNodeStyle = (type: NodeType) => {
    switch(type) {
        case 'Person': return {
            icon: <UserCircleIcon className="h-6 w-6" />,
            color: 'bg-purple-500/20 text-purple-300 border-purple-400/50'
        };
        case 'Location': return {
            icon: <LocationMarkerIcon className="h-6 w-6" />,
            color: 'bg-green-500/20 text-green-300 border-green-400/50'
        };
        case 'Crypto': return {
            icon: <ShieldCheckIcon className="h-6 w-6" />,
            color: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/50'
        };
        case 'Device': return {
            icon: <DeviceMobileIcon className="h-6 w-6" />,
            color: 'bg-sky-500/20 text-sky-300 border-sky-400/50'
        };
        default: return {
            icon: <CubeTransparentIcon className="h-6 w-6" />,
            color: 'bg-slate-500/20 text-slate-300 border-slate-400/50'
        }
    }
}

interface NetworkGraphViewProps {
    caseId: string;
}

const NetworkGraphView: React.FC<NetworkGraphViewProps> = ({ caseId }) => {
    const { isDemoMode, getSampleCaseEvidence } = useDemo();
    const [evidence, setEvidence] = useState<EvidenceSnippet[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadEvidence = async () => {
            try {
                setLoading(true);
                setError(null);

                if (isDemoMode) {
                    // Use sample data in demo mode
                    const sampleEvidence = getSampleCaseEvidence(caseId);
                    setEvidence(sampleEvidence);
                } else {
                    // Load evidence for specific case from API
                    const data = await evidenceApi.list({ case_id: caseId });
                    // Ensure data is an array
                    const evidenceArray = Array.isArray(data) ? data : [];
                    setEvidence(evidenceArray);
                }
            } catch (error) {
                console.error('Error loading evidence:', error);
                if (isDemoMode) {
                    setError('Demo mode: Unable to load sample evidence data.');
                } else {
                    setError('Failed to load network graph data. Please try again.');
                }
                setEvidence([]);
            } finally {
                setLoading(false);
            }
        };
        loadEvidence();
    }, [caseId, isDemoMode, getSampleCaseEvidence]);

    const { nodes, edges } = useMemo(() => {
        const extractedNodes = new Map<string, Node>();
        const extractedEdges: Edge[] = [];
        
        // Generate positions dynamically in a circular layout
        const generatePosition = (index: number, total: number): { x: number; y: number } => {
            const radius = 35; // Distance from center (percentage)
            const centerX = 50;
            const centerY = 50;
            const angle = (index * 2 * Math.PI) / total;
            return {
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle)
            };
        };

        let nodeIndex = 0;

        const addNode = (id: string, label: string, type: NodeType) => {
            if (!extractedNodes.has(id)) {
                // Position will be calculated after all nodes are collected
                extractedNodes.set(id, { id, label, type, position: { x: 0, y: 0 } });
                nodeIndex++;
            }
        };

        evidence.forEach(snippet => {
            const deviceId = `device-${snippet.device}`;
            addNode(deviceId, snippet.device, 'Device');
            
            const entities = snippet.entities.map(e => {
                const entityId = `${e.type}-${e.value}`;
                addNode(entityId, e.value, e.type as NodeType);
                return entityId;
            });
            
            // Connect entities within the snippet to each other and to the device
            const allNodesInSnippet = [deviceId, ...entities];
            for (let i = 0; i < allNodesInSnippet.length; i++) {
                for (let j = i + 1; j < allNodesInSnippet.length; j++) {
                    extractedEdges.push({ source: allNodesInSnippet[i], target: allNodesInSnippet[j] });
                }
            }
        });
        
        // Calculate positions for all nodes
        const nodesArray = Array.from(extractedNodes.values());
        nodesArray.forEach((node, index) => {
            node.position = generatePosition(index, nodesArray.length);
        });
        
        return { nodes: nodesArray, edges: extractedEdges };
    }, [evidence]);

    return (
        <div className="p-6 lg:p-8 h-full flex flex-col">
            <div className="mb-6 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-white">Network Graph</h1>
                    {isDemoMode && (
                        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs font-medium rounded-full">
                            DEMO MODE
                        </span>
                    )}
                </div>
                <p className="text-slate-400">
                    {isDemoMode
                        ? "Visualizing connections between entities in this demo case using sample data."
                        : "Visualizing connections between entities in this case."
                    }
                </p>
            </div>

            {error && (
                <div className="mb-4 bg-red-500/10 border border-red-500 rounded-md p-3">
                    <p className="text-red-400 text-sm">{error}</p>
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center flex-grow">
                    <div className="text-white">Loading network graph...</div>
                </div>
            ) : nodes.length === 0 ? (
                <div className="flex items-center justify-center flex-grow text-slate-400 rounded-lg border border-dashed border-slate-700">
                    <div className="text-center">
                        <p className="font-semibold">No entities found.</p>
                        <p className="text-sm mt-1">Network graph will appear when evidence with entities is available.</p>
                    </div>
                </div>
            ) : (
                <div className="flex-grow w-full rounded-lg border border-white/10 bg-black/20 relative overflow-hidden backdrop-blur-sm">
                <svg className="absolute top-0 left-0 w-full h-full" style={{ pointerEvents: 'none' }}>
                    <defs>
                      <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#475569" />
                      </marker>
                    </defs>
                    {edges.map((edge, i) => {
                        const sourceNode = nodes.find(n => n.id === edge.source);
                        const targetNode = nodes.find(n => n.id === edge.target);
                        if (!sourceNode || !targetNode) return null;
                        return (
                            <line
                                key={i}
                                x1={`${sourceNode.position.x}%`}
                                y1={`${sourceNode.position.y}%`}
                                x2={`${targetNode.position.x}%`}
                                y2={`${targetNode.position.y}%`}
                                stroke="#475569"
                                strokeWidth="2"
                            />
                        );
                    })}
                </svg>

                {nodes.map(node => {
                    const style = getNodeStyle(node.type);
                    return (
                        <div
                            key={node.id}
                            className={`absolute p-3 rounded-lg border flex items-center gap-3 transition-transform hover:scale-110 hover:z-10 cursor-pointer ${style.color}`}
                            style={{ 
                                top: `${node.position.y}%`, 
                                left: `${node.position.x}%`, 
                                transform: 'translate(-50%, -50%)',
                                backdropFilter: 'blur(10px)',
                            }}
                        >
                            <div className="flex-shrink-0">{style.icon}</div>
                            <span className="text-sm font-medium whitespace-nowrap">{node.label.length > 20 ? node.label.substring(0, 18) + '...' : node.label}</span>
                        </div>
                    );
                })}
                </div>
            )}
        </div>
    );
};

export default NetworkGraphView;