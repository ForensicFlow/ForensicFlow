"""
Function schemas for Gemini Function Calling API
Defines all tools available to SpectraX AI agent
"""
from typing import List

# Tool 1: Generate Network Graph
GENERATE_NETWORK_GRAPH_SCHEMA = {
    "name": "generate_network_graph",
    "description": "Generate a network graph visualization showing relationships between entities (people, organizations, devices, etc.) found in evidence. Use this when the officer asks to 'show network graph', 'show connections', 'show relationships', or similar requests.",
    "parameters": {
        "type": "object",
        "properties": {
            "nodes": {
                "type": "array",
                "description": "List of entities/nodes in the graph",
                "items": {
                    "type": "object",
                    "properties": {
                        "id": {
                            "type": "string",
                            "description": "Unique identifier for the node"
                        },
                        "label": {
                            "type": "string",
                            "description": "Display name for the node"
                        },
                        "group": {
                            "type": "string",
                            "description": "Category of the node",
                            "enum": ["person", "organization", "device", "location", "account", "phone", "email", "crypto", "other"]
                        }
                    },
                    "required": ["id", "label", "group"]
                }
            },
            "edges": {
                "type": "array",
                "description": "List of relationships/connections between nodes",
                "items": {
                    "type": "object",
                    "properties": {
                        "source": {
                            "type": "string",
                            "description": "ID of source node"
                        },
                        "target": {
                            "type": "string",
                            "description": "ID of target node"
                        },
                        "label": {
                            "type": "string",
                            "description": "Type of relationship (e.g., 'communicated', 'transferred', 'located_at')"
                        },
                        "evidence_ids": {
                            "type": "array",
                            "description": "List of evidence IDs supporting this connection",
                            "items": {"type": "string"}
                        }
                    },
                    "required": ["source", "target", "label"]
                }
            }
        },
        "required": ["nodes", "edges"]
    }
}

# Tool 2: Generate Timeline
GENERATE_TIMELINE_SCHEMA = {
    "name": "generate_timeline",
    "description": "Generate a timeline visualization of events. Use this when the officer asks about chronology, 'what happened when', 'show timeline', 'sequence of events', etc.",
    "parameters": {
        "type": "object",
        "properties": {
            "events": {
                "type": "array",
                "description": "List of events in chronological order",
                "items": {
                    "type": "object",
                    "properties": {
                        "id": {
                            "type": "string",
                            "description": "Unique event ID"
                        },
                        "timestamp": {
                            "type": "string",
                            "description": "ISO 8601 timestamp of the event"
                        },
                        "title": {
                            "type": "string",
                            "description": "Brief title of the event"
                        },
                        "description": {
                            "type": "string",
                            "description": "Detailed description of what happened"
                        },
                        "source": {
                            "type": "string",
                            "description": "Source of the event (e.g., 'WhatsApp', 'Call Log')"
                        },
                        "evidence_id": {
                            "type": "string",
                            "description": "ID of evidence item this event is from"
                        }
                    },
                    "required": ["timestamp", "title", "description"]
                }
            }
        },
        "required": ["events"]
    }
}

# Tool 3: Search Evidence
SEARCH_EVIDENCE_SCHEMA = {
    "name": "search_evidence",
    "description": "Search for evidence items matching specific criteria. Use this when you need to find specific evidence that wasn't in the initial results, or to do a more targeted search.",
    "parameters": {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "Search query or keywords to find evidence"
            },
            "evidence_types": {
                "type": "array",
                "description": "Filter by evidence types",
                "items": {
                    "type": "string",
                    "enum": ["message", "call", "file", "location", "transaction", "browser", "app"]
                }
            },
            "date_range": {
                "type": "object",
                "description": "Filter by date range",
                "properties": {
                    "start": {"type": "string", "description": "Start date (ISO 8601)"},
                    "end": {"type": "string", "description": "End date (ISO 8601)"}
                }
            },
            "limit": {
                "type": "integer",
                "description": "Maximum number of results to return",
                "default": 20
            }
        },
        "required": ["query"]
    }
}

# Tool 4: Analyze Pattern
ANALYZE_PATTERN_SCHEMA = {
    "name": "analyze_pattern",
    "description": "Perform deep pattern analysis on a subset of evidence. Use this when the officer asks about patterns, trends, anomalies, or suspicious behavior.",
    "parameters": {
        "type": "object",
        "properties": {
            "evidence_ids": {
                "type": "array",
                "description": "List of evidence IDs to analyze",
                "items": {"type": "string"}
            },
            "analysis_type": {
                "type": "string",
                "description": "Type of pattern analysis to perform",
                "enum": ["temporal", "frequency", "anomaly", "network", "financial", "communication"]
            },
            "focus": {
                "type": "string",
                "description": "What aspect to focus on (e.g., 'transaction amounts', 'call frequency', 'time gaps')"
            }
        },
        "required": ["evidence_ids", "analysis_type"]
    }
}

# Tool 5: Get Entity Details
GET_ENTITY_DETAILS_SCHEMA = {
    "name": "get_entity_details",
    "description": "Get detailed information about a specific entity (person, phone number, account, etc.). Use when the officer asks about a specific entity.",
    "parameters": {
        "type": "object",
        "properties": {
            "entity_type": {
                "type": "string",
                "description": "Type of entity",
                "enum": ["phone", "email", "crypto_address", "person", "organization", "device", "location"]
            },
            "entity_value": {
                "type": "string",
                "description": "The value/identifier of the entity (e.g., phone number, email address)"
            }
        },
        "required": ["entity_type", "entity_value"]
    }
}

# Tool 6: Format Report Section
FORMAT_REPORT_SECTION_SCHEMA = {
    "name": "format_report_section",
    "description": "Format data into a structured report section. Use when the officer asks to 'create a report', 'summarize for report', or 'format this as...'",
    "parameters": {
        "type": "object",
        "properties": {
            "section_type": {
                "type": "string",
                "description": "Type of report section",
                "enum": ["executive_summary", "findings", "evidence_list", "timeline", "conclusions", "recommendations"]
            },
            "content": {
                "type": "string",
                "description": "Content to be formatted"
            },
            "evidence_ids": {
                "type": "array",
                "description": "Evidence items to include in the section",
                "items": {"type": "string"}
            }
        },
        "required": ["section_type", "content"]
    }
}

# All tool schemas for easy registration
ALL_TOOL_SCHEMAS = [
    GENERATE_NETWORK_GRAPH_SCHEMA,
    GENERATE_TIMELINE_SCHEMA,
    SEARCH_EVIDENCE_SCHEMA,
    ANALYZE_PATTERN_SCHEMA,
    GET_ENTITY_DETAILS_SCHEMA,
    FORMAT_REPORT_SECTION_SCHEMA,
]

# Tool detection keywords - helps determine when to suggest tools to the LLM
TOOL_KEYWORDS = {
    "generate_network_graph": [
        "network", "graph", "connection", "relationship", "link", "between",
        "show connections", "network diagram", "who knows who"
    ],
    "generate_timeline": [
        "timeline", "chronolog", "when", "sequence", "order", "history",
        "what happened when", "time sequence", "series of events"
    ],
    "search_evidence": [
        "find", "search", "look for", "show me", "get", "retrieve",
        "evidence about", "items containing"
    ],
    "analyze_pattern": [
        "pattern", "trend", "anomaly", "suspicious", "unusual", "frequency",
        "behavior", "analyze", "detect", "identify patterns"
    ],
    "get_entity_details": [
        "who is", "what is", "tell me about", "information about",
        "details of", "profile of", "background on"
    ],
    "format_report_section": [
        "report", "summarize", "format", "document", "write up",
        "create report", "format as", "prepare summary"
    ]
}


def detect_required_tools(query: str) -> List[str]:
    """
    Detect which tools might be needed for a given query
    Returns list of tool names that match the query intent
    """
    query_lower = query.lower()
    suggested_tools = []
    
    for tool_name, keywords in TOOL_KEYWORDS.items():
        if any(keyword in query_lower for keyword in keywords):
            suggested_tools.append(tool_name)
    
    return suggested_tools

