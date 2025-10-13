import React, { useMemo, useState, useEffect } from 'react';
import { evidenceApi } from '@/lib/api.ts';
import { EvidenceSnippet } from '../../types';
import { UserCircleIcon, LocationMarkerIcon, DeviceMobileIcon, ShieldCheckIcon, CubeTransparentIcon } from '../icons';
import { useDemo } from '@/contexts/DemoContext.tsx';

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
    const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
    const [showGraph, setShowGraph] = useState(true);

    useEffect(() => {
        const loadEvidence = async () => {
            try {
                setLoading(true);
                setError(null);

                if (isDemoMode) {
                    // Use sample data in demo mode
                    const sampleEvidence = getSampleCaseEvidence(caseId);
                    console.log('NetworkGraphView: Loaded sample evidence:', sampleEvidence.length, 'items');
                    setEvidence(sampleEvidence);
                } else {
                    // Load evidence for specific case from API
                    const data = await evidenceApi.list({ case_id: caseId });
                    // Ensure data is an array
                    const evidenceArray = Array.isArray(data) ? data : [];
                    console.log('NetworkGraphView: Loaded evidence from API:', evidenceArray.length, 'items');
                    setEvidence(evidenceArray);
                }
            } catch (error) {
                console.error('NetworkGraphView: Error loading evidence:', error);
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
        
        console.log('NetworkGraphView: Processing evidence for graph generation:', evidence.length, 'items');
        
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

        evidence.forEach((snippet, idx) => {
            const deviceId = `device-${snippet.device}`;
            addNode(deviceId, snippet.device, 'Device');
            
            console.log(`NetworkGraphView: Evidence ${idx + 1} has ${snippet.entities?.length || 0} entities`);
            
            const entities = (snippet.entities || []).map(e => {
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
        
        console.log('NetworkGraphView: Generated graph with', nodesArray.length, 'nodes and', extractedEdges.length, 'edges');
        
        return { nodes: nodesArray, edges: extractedEdges };
    }, [evidence]);

    const handleClearGraph = () => {
        setShowGraph(false);
        setSelectedNodes(new Set());
        setTimeout(() => setShowGraph(true), 100);
    };

    const handleDeleteSelectedNodes = () => {
        if (selectedNodes.size === 0) return;
        
        // Filter out evidence that contains the selected nodes
        const filteredEvidence = evidence.filter(snippet => {
            const deviceId = `device-${snippet.device}`;
            if (selectedNodes.has(deviceId)) return false;
            
            const hasSelectedEntity = snippet.entities.some(e => {
                const entityId = `${e.type}-${e.value}`;
                return selectedNodes.has(entityId);
            });
            
            return !hasSelectedEntity;
        });
        
        setEvidence(filteredEvidence);
        setSelectedNodes(new Set());
    };

    const toggleNodeSelection = (nodeId: string) => {
        setSelectedNodes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(nodeId)) {
                newSet.delete(nodeId);
            } else {
                newSet.add(nodeId);
            }
            return newSet;
        });
    };

    return (
        <div className="p-6 lg:p-8 h-full flex flex-col">
            <div className="mb-6 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-white">Network Graph</h1>
                            {isDemoMode && (
                                <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs font-medium rounded-full">
                                    DEMO MODE
                                </span>
                            )}
                        </div>
                        <p className="text-slate-400 mt-1">
                            {isDemoMode
                                ? "Visualizing connections between entities in this demo case using sample data."
                                : "Visualizing connections between entities in this case."
                            }
                        </p>
                    </div>
                    
                    {/* Action Buttons */}
                    {nodes.length > 0 && (
                        <div className="flex items-center gap-2">
                            {selectedNodes.size > 0 && (
                                <button
                                    onClick={handleDeleteSelectedNodes}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-all shadow-lg"
                                    title="Delete selected nodes"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Delete Selected ({selectedNodes.size})
                                </button>
                            )}
                            <button
                                onClick={handleClearGraph}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-all border border-slate-600"
                                title="Reset graph view"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Reset View
                            </button>
                        </div>
                    )}
                </div>
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
                    <div className="text-center p-8">
                        <svg className="w-16 h-16 mx-auto mb-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        <p className="font-semibold text-lg mb-2">No Network Graph Available</p>
                        <p className="text-sm text-slate-500 mb-4">The evidence in this case doesn't contain any extracted entities yet.</p>
                        <div className="bg-slate-800/50 rounded-lg p-4 text-left max-w-md mx-auto">
                            <p className="text-xs text-slate-400 mb-2"><strong>To see a network graph:</strong></p>
                            <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                                <li>Upload UFDR files with communication data</li>
                                <li>Ensure evidence contains contacts, locations, or crypto addresses</li>
                                <li>Use SpectraX AI to analyze relationships: "Show me network connections"</li>
                            </ul>
                        </div>
                        {evidence.length > 0 && (
                            <p className="text-xs text-yellow-400 mt-4">
                                ⚠️ Found {evidence.length} evidence items, but no entities were extracted.
                            </p>
                        )}
                    </div>
                </div>
            ) : showGraph ? (
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
                    const isSelected = selectedNodes.has(node.id);
                    return (
                        <div
                            key={node.id}
                            onClick={() => toggleNodeSelection(node.id)}
                            className={`absolute p-3 rounded-lg border flex items-center gap-3 transition-all hover:scale-110 hover:z-10 cursor-pointer ${
                                isSelected 
                                    ? 'bg-red-500/30 border-red-400 ring-2 ring-red-400 scale-105 z-20' 
                                    : style.color
                            }`}
                            style={{ 
                                top: `${node.position.y}%`, 
                                left: `${node.position.x}%`, 
                                transform: 'translate(-50%, -50%)',
                                backdropFilter: 'blur(10px)',
                            }}
                            title={`Click to ${isSelected ? 'deselect' : 'select'} ${node.label}`}
                        >
                            <div className="flex-shrink-0">{style.icon}</div>
                            <span className="text-sm font-medium whitespace-nowrap">{node.label.length > 20 ? node.label.substring(0, 18) + '...' : node.label}</span>
                            {isSelected && (
                                <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            )}
                        </div>
                    );
                })}
                </div>
            ) : null}
            
            {/* Help Text */}
            {nodes.length > 0 && showGraph && (
                <div className="mt-4 flex-shrink-0 bg-slate-800/50 border border-slate-700 rounded-lg p-3">
                    <p className="text-xs text-slate-400">
                        💡 <strong>Tip:</strong> Click on nodes to select them, then use the "Delete Selected" button to remove them from the graph.
                    </p>
                </div>
            )}
        </div>
    );
};

export default NetworkGraphView;
