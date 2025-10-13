"""
Tool implementations for SpectraX AI agent - IMPROVED VERSION
Each tool is a callable that takes parameters and returns rich, actionable results
"""
from typing import Dict, Any, List, Optional
from datetime import datetime
import json


class ToolRegistry:
    """
    Registry of all available tools for the AI agent
    Handles tool execution and result formatting with complete loop enforcement
    """
    
    def __init__(self, evidence_data: List[Dict] = None, case_id: str = None):
        self.evidence_data = evidence_data or []
        self.case_id = case_id
        self.execution_log = []  # Track tool executions for debugging
    
    def execute_tool(self, tool_name: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute a tool by name with given parameters
        Returns standardized result dict with success, data, and user-friendly summary
        """
        execution_start = datetime.now()
        
        try:
            # Map tool names to methods
            tool_methods = {
                'generate_network_graph': self.generate_network_graph,
                'generate_timeline': self.generate_timeline,
                'search_evidence': self.search_evidence,
                'analyze_pattern': self.analyze_pattern,
                'get_entity_details': self.get_entity_details,
                'format_report_section': self.format_report_section,
            }
            
            if tool_name not in tool_methods:
                return {
                    'success': False,
                    'error': f"Unknown tool: {tool_name}",
                    'tool_name': tool_name,
                    'user_message': f"I don't have a tool called '{tool_name}'. Available tools: {', '.join(tool_methods.keys())}"
                }
            
            # Execute the tool
            print(f"[Tool Execution] Running {tool_name} with params: {json.dumps(parameters, indent=2)[:200]}")
            result_data = tool_methods[tool_name](parameters)
            
            execution_time = (datetime.now() - execution_start).total_seconds()
            
            # Generate user-friendly summary of what the tool did
            user_message = self._generate_user_message(tool_name, parameters, result_data)
            
            result = {
                'success': True,
                'tool_name': tool_name,
                'data': result_data,
                'execution_time': execution_time,
                'timestamp': datetime.now().isoformat(),
                'user_message': user_message  # NEW: Human-readable summary
            }
            
            print(f"[Tool Success] {tool_name} completed in {execution_time:.2f}s")
            
            # Log execution
            self.execution_log.append({
                'tool': tool_name,
                'parameters': parameters,
                'success': True,
                'time': execution_time
            })
            
            return result
            
        except Exception as e:
            execution_time = (datetime.now() - execution_start).total_seconds()
            
            print(f"[Tool Error] {tool_name} failed: {str(e)}")
            
            error_result = {
                'success': False,
                'tool_name': tool_name,
                'error': str(e),
                'execution_time': execution_time,
                'timestamp': datetime.now().isoformat(),
                'user_message': f"I tried to {tool_name.replace('_', ' ')} but encountered an error: {str(e)}"
            }
            
            # Log error
            self.execution_log.append({
                'tool': tool_name,
                'parameters': parameters,
                'success': False,
                'error': str(e)
            })
            
            return error_result
    
    def _generate_user_message(self, tool_name: str, params: Dict, result_data: Dict) -> str:
        """Generate a user-friendly message about what the tool did"""
        
        if tool_name == 'generate_network_graph':
            node_count = len(result_data.get('nodes', []))
            edge_count = len(result_data.get('edges', []))
            if node_count > 0:
                return f"Generated a network graph with {node_count} entities and {edge_count} connections."
            else:
                return "I tried to create a network graph but couldn't find enough connections in the evidence."
        
        elif tool_name == 'generate_timeline':
            event_count = result_data.get('event_count', 0)
            if event_count > 0:
                time_range = result_data.get('time_range', {})
                return f"Created a timeline with {event_count} events spanning from {time_range.get('start', 'unknown')} to {time_range.get('end', 'unknown')}."
            else:
                return "I tried to create a timeline but couldn't find timestamped events."
        
        elif tool_name == 'search_evidence':
            count = result_data.get('count', 0)
            query = params.get('query', '')
            if count > 0:
                return f"Found {count} evidence items matching '{query}'."
            else:
                return f"I searched for '{query}' but found no matching evidence."
        
        elif tool_name == 'analyze_pattern':
            finding_count = len(result_data.get('findings', []))
            analysis_type = params.get('analysis_type', 'frequency')
            return f"Completed {analysis_type} analysis and found {finding_count} patterns."
        
        elif tool_name == 'get_entity_details':
            mentions = result_data.get('mentions', 0)
            entity_value = params.get('entity_value', '')
            if mentions > 0:
                return f"Found {mentions} mentions of '{entity_value}' across the evidence."
            else:
                return f"I searched for '{entity_value}' but couldn't find it in the evidence."
        
        elif tool_name == 'format_report_section':
            section_type = result_data.get('section_type', 'unknown')
            return f"Formatted a {section_type.replace('_', ' ')} section for the report."
        
        return f"Executed {tool_name.replace('_', ' ')} successfully."
    
    def generate_network_graph(self, params: Dict) -> Dict[str, Any]:
        """
        Generate network graph from evidence data - MULTI-SOURCE CORRELATION
        Links people, locations, messages, financial data, and devices
        """
        nodes_provided = params.get('nodes', [])
        edges_provided = params.get('edges', [])
        
        # If nodes/edges provided by AI, validate and return them
        if nodes_provided and edges_provided:
            print(f"[Network Graph] Using AI-provided nodes ({len(nodes_provided)}) and edges ({len(edges_provided)})")
            return {
                'type': 'network',
                'nodes': nodes_provided,
                'edges': edges_provided,
                'node_count': len(nodes_provided),
                'edge_count': len(edges_provided)
            }
        
        # Generate MULTI-SOURCE correlation graph
        print(f"[Network Graph] Generating multi-source correlation graph from {len(self.evidence_data)} evidence items")
        
        nodes = {}
        edges = []
        
        # Track co-occurrences for meaningful correlations
        entity_cooccurrence = {}  # Track which entities appear together
        temporal_links = {}  # Track entities in same time window
        content_links = {}  # Track entities mentioned in same content
        
        # Pass 1: Extract all entities and build context
        for item in self.evidence_data[:100]:  # Limit for performance
            item_id = str(item.get('id', ''))
            timestamp = item.get('timestamp', '')
            content = item.get('content', '')
            source = item.get('source', 'Unknown')
            device = item.get('device', 'Unknown')
            item_type = item.get('type', 'evidence')
            
            # Extract entities from this item
            item_entities = []
            
            # Add entities from entity list
            for entity in item.get('entities', []):
                e_type = entity.get('type', 'other')
                e_value = entity.get('value', '')
                if e_value and len(e_value) > 2:
                    node_id = f"{e_type}:{e_value}"
                    item_entities.append((node_id, e_type, e_value))
                    
                    # Create node
                    if node_id not in nodes:
                        nodes[node_id] = {
                            'id': node_id,
                            'label': e_value[:40] + ('...' if len(e_value) > 40 else ''),
                            'group': e_type,
                            'mentions': 0,
                            'evidence_ids': []
                        }
                    nodes[node_id]['mentions'] += 1
                    nodes[node_id]['evidence_ids'].append(item_id)
            
            # Also add source and device as nodes (they're entities too!)
            if source and source != 'Unknown':
                source_id = f"source:{source}"
                item_entities.append((source_id, 'source', source))
                if source_id not in nodes:
                    nodes[source_id] = {
                        'id': source_id,
                        'label': source[:40],
                        'group': 'source',
                        'mentions': 0,
                        'evidence_ids': []
                    }
                nodes[source_id]['mentions'] += 1
                nodes[source_id]['evidence_ids'].append(item_id)
            
            if device and device != 'Unknown':
                device_id = f"device:{device}"
                item_entities.append((device_id, 'device', device))
                if device_id not in nodes:
                    nodes[device_id] = {
                        'id': device_id,
                        'label': device[:40],
                        'group': 'device',
                        'mentions': 0,
                        'evidence_ids': []
                    }
                nodes[device_id]['mentions'] += 1
                nodes[device_id]['evidence_ids'].append(item_id)
            
            # Track co-occurrences (entities that appear in same evidence item)
            for i, (id1, type1, val1) in enumerate(item_entities):
                for id2, type2, val2 in item_entities[i+1:]:
                    pair_key = tuple(sorted([id1, id2]))
                    if pair_key not in entity_cooccurrence:
                        entity_cooccurrence[pair_key] = {
                            'count': 0,
                            'evidence_ids': [],
                            'contexts': []
                        }
                    entity_cooccurrence[pair_key]['count'] += 1
                    entity_cooccurrence[pair_key]['evidence_ids'].append(item_id)
                    entity_cooccurrence[pair_key]['contexts'].append({
                        'source': source,
                        'timestamp': timestamp,
                        'snippet': content[:100]
                    })
        
        # Pass 2: Create meaningful edges based on correlations
        for (node1_id, node2_id), data in entity_cooccurrence.items():
            if data['count'] >= 1:  # At least 1 co-occurrence
                # Determine relationship type based on context
                relationship_type = self._determine_relationship_type(
                    node1_id, node2_id, data['contexts']
                )
                
                edges.append({
                    'source': node1_id,
                    'target': node2_id,
                    'label': relationship_type,
                    'weight': data['count'],  # Strength of connection
                    'evidence_ids': data['evidence_ids'][:5],  # Top 5
                    'contexts': data['contexts'][:3]  # Sample contexts
                })
        
        # Convert nodes dict to list
        node_list = list(nodes.values())
        
        # Prioritize most connected nodes
        node_list.sort(key=lambda x: x['mentions'], reverse=True)
        node_list = node_list[:30]  # Top 30 most mentioned entities
        
        # Filter edges to only include nodes we're keeping
        node_ids = {n['id'] for n in node_list}
        filtered_edges = [
            e for e in edges 
            if e['source'] in node_ids and e['target'] in node_ids
        ]
        
        # Sort edges by weight (strongest connections first)
        filtered_edges.sort(key=lambda x: x['weight'], reverse=True)
        filtered_edges = filtered_edges[:50]  # Top 50 connections
        
        print(f"[Network Graph] Created {len(node_list)} nodes and {len(filtered_edges)} edges with multi-source correlations")
        
        return {
            'type': 'network',
            'nodes': node_list,
            'edges': filtered_edges,
            'node_count': len(node_list),
            'edge_count': len(filtered_edges),
            'insights': self._generate_graph_insights(node_list, filtered_edges)
        }
    
    def _determine_relationship_type(self, node1_id: str, node2_id: str, contexts: list) -> str:
        """Determine the type of relationship between two entities based on context"""
        if not contexts:
            return 'associated_with'
        
        # Analyze contexts to determine relationship
        context_text = ' '.join([c.get('snippet', '').lower() for c in contexts[:3]])
        
        # Communication relationships
        if any(word in context_text for word in ['called', 'messaged', 'contacted', 'spoke', 'talked']):
            return 'communicated_with'
        
        # Financial relationships
        if any(word in context_text for word in ['paid', 'transferred', 'sent money', 'transaction', 'crypto']):
            return 'financial_transaction'
        
        # Location relationships
        if any(word in context_text for word in ['met at', 'location', 'place', 'address']):
            return 'met_at_location'
        
        # Device/possession relationships
        if 'device:' in node1_id or 'device:' in node2_id:
            return 'used_device'
        
        # Source relationships
        if 'source:' in node1_id or 'source:' in node2_id:
            return 'appeared_in'
        
        # Default
        return 'associated_with'
    
    def _generate_graph_insights(self, nodes: list, edges: list) -> dict:
        """Generate automatic insights about the network structure"""
        insights = {
            'central_nodes': [],
            'clusters': [],
            'outliers': []
        }
        
        # Find central nodes (most connections)
        node_connections = {}
        for edge in edges:
            node_connections[edge['source']] = node_connections.get(edge['source'], 0) + 1
            node_connections[edge['target']] = node_connections.get(edge['target'], 0) + 1
        
        # Top 3 most connected
        central = sorted(node_connections.items(), key=lambda x: x[1], reverse=True)[:3]
        for node_id, conn_count in central:
            node_data = next((n for n in nodes if n['id'] == node_id), None)
            if node_data:
                insights['central_nodes'].append({
                    'id': node_id,
                    'label': node_data['label'],
                    'connections': conn_count,
                    'group': node_data['group']
                })
        
        # Find outliers (nodes with only 1 connection)
        for node in nodes:
            conn_count = node_connections.get(node['id'], 0)
            if conn_count == 1:
                insights['outliers'].append({
                    'id': node['id'],
                    'label': node['label'],
                    'group': node['group']
                })
        
        return insights
    
    def generate_timeline(self, params: Dict) -> Dict[str, Any]:
        """
        Generate timeline visualization from evidence - IMPROVED WITH BETTER SORTING
        """
        events = params.get('events', [])
        
        # If events provided by AI, use them
        if events:
            print(f"[Timeline] Using AI-provided events ({len(events)})")
            sorted_events = sorted(events, key=lambda x: x.get('timestamp', ''))
            return {
                'type': 'timeline',
                'events': sorted_events,
                'event_count': len(sorted_events),
                'time_range': {
                    'start': sorted_events[0].get('timestamp') if sorted_events else None,
                    'end': sorted_events[-1].get('timestamp') if sorted_events else None
                }
            }
        
        # Otherwise, generate from evidence
        print(f"[Timeline] Generating from {len(self.evidence_data)} evidence items")
        timeline_events = []
        for item in self.evidence_data[:100]:  # Increased limit
            if item.get('timestamp'):
                timeline_events.append({
                    'id': str(item.get('id', '')),
                    'timestamp': item.get('timestamp'),
                    'title': item.get('source', 'Event') + (f" - {item.get('type', '')}" if item.get('type') else ''),
                    'description': item.get('content', '')[:300],  # More context
                    'source': item.get('source', ''),
                    'evidence_id': str(item.get('id', ''))
                })
        
        # Sort by timestamp
        timeline_events.sort(key=lambda x: x.get('timestamp', ''))
        
        return {
            'type': 'timeline',
            'events': timeline_events,
            'event_count': len(timeline_events),
            'time_range': {
                'start': timeline_events[0].get('timestamp') if timeline_events else None,
                'end': timeline_events[-1].get('timestamp') if timeline_events else None
            }
        }
    
    def search_evidence(self, params: Dict) -> Dict[str, Any]:
        """
        Search evidence with filters - IMPROVED WITH BETTER MATCHING
        """
        query = params.get('query', '').lower()
        evidence_types = [t.lower() for t in params.get('evidence_types', [])]
        date_range = params.get('date_range', {})
        limit = params.get('limit', 50)  # Increased default limit
        
        print(f"[Search Evidence] Query: '{query}', Types: {evidence_types}, Limit: {limit}")
        
        filtered = []
        
        for item in self.evidence_data:
            # Text search - more comprehensive
            if query:
                content = item.get('content', '').lower()
                source = item.get('source', '').lower()
                device = item.get('device', '').lower()
                evidence_type = item.get('type', '').lower()
                
                # Check if query matches any field
                if not any(query in field for field in [content, source, device, evidence_type]):
                    # Also check entities
                    entity_match = any(
                        query in entity.get('value', '').lower()
                        for entity in item.get('entities', [])
                    )
                    if not entity_match:
                        continue
            
            # Type filter
            if evidence_types:
                item_type = item.get('type', '').lower()
                if item_type not in evidence_types:
                    continue
            
            # Date range filter
            if date_range:
                item_timestamp = item.get('timestamp', '')
                start = date_range.get('start', '')
                end = date_range.get('end', '')
                
                if start and item_timestamp < start:
                    continue
                if end and item_timestamp > end:
                    continue
            
            filtered.append(item)
            
            if len(filtered) >= limit:
                break
        
        print(f"[Search Evidence] Found {len(filtered)} matching items")
        
        return {
            'type': 'evidence_list',
            'evidence': filtered,
            'count': len(filtered),
            'query': query,
            'filters_applied': {
                'types': evidence_types,
                'date_range': date_range
            }
        }
    
    def analyze_pattern(self, params: Dict) -> Dict[str, Any]:
        """
        Perform pattern analysis on evidence - IMPROVED WITH MORE ANALYSIS TYPES
        """
        evidence_ids = [str(id) for id in params.get('evidence_ids', [])]
        analysis_type = params.get('analysis_type', 'frequency')
        focus = params.get('focus', '')
        
        print(f"[Analyze Pattern] Type: {analysis_type}, Focus: '{focus}', Evidence IDs: {len(evidence_ids)}")
        
        # Filter evidence by IDs
        if evidence_ids:
            subset = [item for item in self.evidence_data if str(item.get('id', '')) in evidence_ids]
        else:
            subset = self.evidence_data[:100]  # Analyze first 100 if no IDs specified
        
        analysis_results = {
            'type': 'pattern_analysis',
            'analysis_type': analysis_type,
            'focus': focus,
            'evidence_count': len(subset),
            'findings': []
        }
        
        if analysis_type == 'temporal':
            # Analyze time patterns
            timestamps = [item.get('timestamp', '') for item in subset if item.get('timestamp')]
            if timestamps:
                timestamps.sort()
                analysis_results['findings'].append({
                    'finding': f'Analyzed {len(timestamps)} timestamped events',
                    'time_range': f"{timestamps[0]} to {timestamps[-1]}",
                    'timespan': f"{len(timestamps)} events"
                })
                
                # Find time gaps
                from datetime import datetime as dt, timedelta
                try:
                    dates = [dt.fromisoformat(ts.replace('Z', '+00:00')) for ts in timestamps]
                    gaps = []
                    for i in range(1, len(dates)):
                        gap = (dates[i] - dates[i-1]).total_seconds() / 3600  # hours
                        if gap > 24:  # More than 24 hours
                            gaps.append({'start': timestamps[i-1], 'end': timestamps[i], 'hours': gap})
                    
                    if gaps:
                        analysis_results['findings'].append({
                            'finding': 'Notable time gaps detected',
                            'gaps': gaps[:5]  # Top 5 gaps
                        })
                except:
                    pass
        
        elif analysis_type == 'frequency':
            # Analyze frequency of entities
            entity_counts = {}
            for item in subset:
                for entity in item.get('entities', []):
                    e_type = entity.get('type', 'unknown')
                    e_val = entity.get('value', '')
                    key = f"{e_type}:{e_val}"
                    entity_counts[key] = entity_counts.get(key, 0) + 1
            
            top_entities = sorted(entity_counts.items(), key=lambda x: x[1], reverse=True)[:10]
            analysis_results['findings'] = [
                {'entity': k, 'count': v, 'type': k.split(':')[0], 'value': ':'.join(k.split(':')[1:])}
                for k, v in top_entities
            ]
        
        elif analysis_type == 'communication':
            # Analyze communication patterns
            sources = {}
            devices = {}
            for item in subset:
                source = item.get('source', 'Unknown')
                device = item.get('device', 'Unknown')
                sources[source] = sources.get(source, 0) + 1
                devices[device] = devices.get(device, 0) + 1
            
            analysis_results['findings'] = [
                {
                    'category': 'Top Sources',
                    'items': [{'source': k, 'count': v} for k, v in sorted(sources.items(), key=lambda x: x[1], reverse=True)[:5]]
                },
                {
                    'category': 'Top Devices',
                    'items': [{'device': k, 'count': v} for k, v in sorted(devices.items(), key=lambda x: x[1], reverse=True)[:5]]
                }
            ]
        
        print(f"[Analyze Pattern] Generated {len(analysis_results['findings'])} findings")
        
        return analysis_results
    
    def get_entity_details(self, params: Dict) -> Dict[str, Any]:
        """
        Get detailed information about a specific entity - IMPROVED WITH MORE CONTEXT
        """
        entity_type = params.get('entity_type', '').lower()
        entity_value = params.get('entity_value', '')
        
        print(f"[Entity Details] Type: {entity_type}, Value: '{entity_value}'")
        
        # Find all evidence mentioning this entity
        related_evidence = []
        
        for item in self.evidence_data:
            # Check in entities
            for entity in item.get('entities', []):
                if entity.get('type', '').lower() == entity_type and \
                   entity_value.lower() in entity.get('value', '').lower():
                    related_evidence.append(item)
                    break
            
            # Also check in content
            if entity_value.lower() in item.get('content', '').lower():
                if item not in related_evidence:
                    related_evidence.append(item)
        
        print(f"[Entity Details] Found {len(related_evidence)} related evidence items")
        
        # Extract additional context
        first_seen = related_evidence[0].get('timestamp', 'Unknown') if related_evidence else None
        last_seen = related_evidence[-1].get('timestamp', 'Unknown') if len(related_evidence) > 1 else first_seen
        
        # Get associated entities
        associated_entities = set()
        for item in related_evidence[:20]:  # Sample first 20
            for entity in item.get('entities', []):
                e_val = entity.get('value', '')
                if e_val and e_val.lower() != entity_value.lower():
                    associated_entities.add(f"{entity.get('type', 'unknown')}:{e_val}")
        
        return {
            'type': 'entity_details',
            'entity': {
                'type': entity_type,
                'value': entity_value
            },
            'mentions': len(related_evidence),
            'first_seen': first_seen,
            'last_seen': last_seen,
            'associated_entities': list(associated_entities)[:10],  # Top 10
            'related_evidence': [
                {
                    'id': str(item.get('id', '')),
                    'source': item.get('source', ''),
                    'timestamp': item.get('timestamp', ''),
                    'content': item.get('content', '')[:200],
                    'type': item.get('type', '')
                }
                for item in related_evidence[:10]
            ]
        }
    
    def format_report_section(self, params: Dict) -> Dict[str, Any]:
        """
        Format content into a structured report section
        """
        section_type = params.get('section_type', 'findings')
        content = params.get('content', '')
        evidence_ids = [str(id) for id in params.get('evidence_ids', [])]
        
        print(f"[Format Report] Type: {section_type}, Evidence: {len(evidence_ids)}")
        
        # Get evidence items
        evidence_items = []
        if evidence_ids:
            evidence_items = [
                item for item in self.evidence_data 
                if str(item.get('id', '')) in evidence_ids
            ]
        
        formatted = {
            'type': 'report_section',
            'section_type': section_type,
            'title': section_type.replace('_', ' ').title(),
            'content': content,
            'evidence_count': len(evidence_items),
            'evidence_references': [
                {
                    'id': str(item.get('id', '')),
                    'source': item.get('source', ''),
                    'timestamp': item.get('timestamp', ''),
                    'type': item.get('type', '')
                }
                for item in evidence_items
            ],
            'generated_at': datetime.now().isoformat()
        }
        
        return formatted
    
    def get_available_tools(self) -> List[Dict[str, str]]:
        """
        Return list of available tools with descriptions
        """
        return [
            {
                'name': 'generate_network_graph',
                'description': 'Generate network graph showing relationships between entities',
                'use_when': 'User asks for network, graph, connections, or relationships'
            },
            {
                'name': 'generate_timeline',
                'description': 'Create timeline visualization of events',
                'use_when': 'User asks about chronology, timeline, when events occurred'
            },
            {
                'name': 'search_evidence',
                'description': 'Search evidence with specific filters',
                'use_when': 'User asks to find, search, or filter evidence'
            },
            {
                'name': 'analyze_pattern',
                'description': 'Perform pattern analysis on evidence',
                'use_when': 'User asks about patterns, trends, frequency, or anomalies'
            },
            {
                'name': 'get_entity_details',
                'description': 'Get detailed information about an entity',
                'use_when': 'User asks about a specific person, phone number, or entity'
            },
            {
                'name': 'format_report_section',
                'description': 'Format content into structured report section',
                'use_when': 'User asks to create a report or summary'
            }
        ]
