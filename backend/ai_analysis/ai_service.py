"""
AI Service for natural language query processing
"""
import os
import json
from typing import List, Dict, Any, Tuple, Optional
from django.conf import settings
from django.core.cache import cache
import re
import hashlib
from datetime import datetime
from collections import deque


class ConversationManager:
    """
    Manages conversation context and state for SpectraX
    Tracks conversation history, entities, and provides context summarization
    """
    
    def __init__(self, max_exchanges: int = 10, max_tokens: int = 8000):
        self.max_exchanges = max_exchanges
        self.max_tokens = max_tokens
        self.exchanges = deque(maxlen=max_exchanges)
        self.tracked_entities = {}  # entity_id -> {type, value, mentions, last_seen}
        self.established_facts = set()  # Track facts already established (to avoid redundancy)
        self.query_count = 0  # Track number of queries for proactive summaries
        self.conversation_state = {}  # Current investigation focus
        
    def add_exchange(self, query: str, response: str, metadata: Optional[Dict] = None):
        """Add a conversation exchange with timestamp"""
        exchange = {
            'query': query,
            'response': response,
            'timestamp': datetime.now().isoformat(),
            'metadata': metadata or {}
        }
        self.exchanges.append(exchange)
        
        self.query_count += 1
        
        # Extract and track entities mentioned in this exchange
        self._track_entities_in_text(query)
        self._track_entities_in_text(response)
        
        # Extract established facts from response
        self._extract_established_facts(response)
    
    def _extract_established_facts(self, response: str):
        """Extract key facts from AI responses to avoid redundancy"""
        # Extract facts like "X is a central hub", "Y pattern indicates..."
        fact_patterns = [
            r'([A-Z][^.!?]*(?:is a|are|was|were)[^.!?]*(?:central|hub|coordinator|key|important)[^.!?]*)',
            r'([A-Z][^.!?]*(?:suggests|indicates|shows|reveals)[^.!?]*)',
            r'([A-Z][^.!?]*(?:pattern|trend|connection)[^.!?]*)',
        ]
        
        for pattern in fact_patterns:
            matches = re.findall(pattern, response)
            for match in matches:
                # Normalize fact (lowercase, trim)
                fact = match.strip().lower()
                if len(fact) > 20:  # Only meaningful facts
                    self.established_facts.add(fact)
        
        # Limit size to prevent memory issues
        if len(self.established_facts) > 50:
            # Remove oldest (using set doesn't preserve order, so just clear some)
            self.established_facts = set(list(self.established_facts)[-40:])
        
    def _track_entities_in_text(self, text: str):
        """Extract and track entities from text"""
        # Simple entity extraction (can be enhanced with NER)
        patterns = {
            'phone': r'\+?\d{10,15}',
            'email': r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
            'crypto': r'\b(0x[a-fA-F0-9]{40}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})\b',
            'evidence_id': r'Evidence #(\d+)',
        }
        
        for entity_type, pattern in patterns.items():
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                entity_id = f"{entity_type}:{match}"
                if entity_id not in self.tracked_entities:
                    self.tracked_entities[entity_id] = {
                        'type': entity_type,
                        'value': match,
                        'mentions': 0,
                        'first_seen': datetime.now().isoformat()
                    }
                self.tracked_entities[entity_id]['mentions'] += 1
                self.tracked_entities[entity_id]['last_seen'] = datetime.now().isoformat()
    
    def get_context_summary(self, include_entities: bool = True) -> str:
        """Generate a concise summary of conversation context"""
        if not self.exchanges:
            return ""
        
        summary_parts = []
        
        # Recent exchanges (last 5)
        recent_exchanges = list(self.exchanges)[-5:]
        summary_parts.append("**Recent Conversation:**")
        for i, exchange in enumerate(recent_exchanges, 1):
            summary_parts.append(f"{i}. Officer: {exchange['query'][:100]}")
            summary_parts.append(f"   Assistant: {exchange['response'][:150]}...")
        
        # Frequently mentioned entities
        if include_entities and self.tracked_entities:
            frequent_entities = sorted(
                self.tracked_entities.items(),
                key=lambda x: x[1]['mentions'],
                reverse=True
            )[:5]
            
            if frequent_entities:
                summary_parts.append("\n**Key Entities in Discussion:**")
                for entity_id, data in frequent_entities:
                    summary_parts.append(f"- {data['type']}: {data['value']} (mentioned {data['mentions']}x)")
        
        # Established facts (to avoid redundancy)
        if self.established_facts:
            summary_parts.append("\n**Established Facts (avoid repeating these):**")
            for fact in list(self.established_facts)[:5]:  # Top 5 facts
                summary_parts.append(f"- {fact[:100]}")
        
        return "\n".join(summary_parts)
    
    def should_offer_proactive_summary(self) -> bool:
        """Check if we should offer a proactive summary to the officer"""
        # Offer summary after 5+ queries or when many entities have been tracked
        return (self.query_count >= 5 and self.query_count % 5 == 0) or \
               (len(self.tracked_entities) >= 10)
    
    def get_proactive_summary_suggestion(self) -> str:
        """Generate a proactive summary suggestion"""
        entity_count = len(self.tracked_entities)
        query_count = self.query_count
        
        suggestion = f"\n\n---\n\n**💡 Proactive Summary Suggestion**\n\n"
        suggestion += f"After {query_count} queries, we've identified {entity_count} entities and uncovered several patterns. "
        suggestion += "Would you like me to:\n\n"
        suggestion += "1. **Generate a comprehensive timeline** of all activities?\n"
        suggestion += "2. **Create a full network analysis** showing all connections?\n"
        suggestion += "3. **Summarize key findings** in a report-ready format?\n"
        suggestion += "4. **Continue with specific queries** (what would you like to investigate next?)\n\n"
        suggestion += "*Just ask: \"Give me a full summary\" or continue with specific questions.*"
        
        return suggestion
    
    def get_conversation_history_for_prompt(self) -> List[Dict]:
        """Format conversation history for LLM prompt"""
        formatted_history = []
        for exchange in self.exchanges:
            formatted_history.append({
                'role': 'user',
                'content': exchange['query']
            })
            formatted_history.append({
                'role': 'assistant',
                'content': exchange['response'][:500]  # Truncate long responses
            })
        return formatted_history
    
    def estimate_token_count(self) -> int:
        """Rough estimation of token count in conversation history"""
        total_chars = sum(
            len(ex['query']) + len(ex['response'][:500])
            for ex in self.exchanges
        )
        # Rough estimate: 4 chars per token
        return total_chars // 4
    
    def should_summarize(self) -> bool:
        """Check if conversation should be summarized due to length"""
        return self.estimate_token_count() > self.max_tokens * 0.8
    
    def update_conversation_state(self, focus: str):
        """Update what the conversation is currently focusing on"""
        self.conversation_state['current_focus'] = focus
        self.conversation_state['updated_at'] = datetime.now().isoformat()
    
    def get_relevant_entities(self, query: str) -> List[Dict]:
        """Get entities relevant to current query"""
        query_lower = query.lower()
        relevant = []
        
        for entity_id, data in self.tracked_entities.items():
            if data['value'].lower() in query_lower:
                relevant.append(data)
        
        return relevant


class AIService:
    """
    Service for AI-powered evidence analysis and natural language queries
    """
    
    def __init__(self):
        self.gemini_key = settings.GEMINI_API_KEY
        self.openai_key = settings.OPENAI_API_KEY
        self.use_gemini = bool(self.gemini_key)
        self.use_openai = bool(self.openai_key)
        self.enable_agent_mode = True  # Enable ReAct agent framework
        self.max_tool_iterations = 5  # Maximum tool calls per query
    
    def process_query_with_agent(
        self,
        query_text: str,
        evidence_items: List[Dict[str, Any]],
        conversation_history: Optional[List[Dict[str, str]]] = None,
        case_id: str = None
    ) -> Tuple[str, float, Optional[Dict]]:
        """
        Process query using ReAct agent framework with tool use
        Returns: (summary, confidence, embedded_component)
        """
        if not self.use_gemini or not self.enable_agent_mode:
            # Fallback to regular query processing
            return self.process_natural_language_query(query_text, evidence_items, conversation_history) + (None,)
        
        try:
            import requests
            from .function_schemas import ALL_TOOL_SCHEMAS, detect_required_tools
            from .tools import ToolRegistry
            
            print(f"[Agent Mode] Processing query: {query_text}")
            
            # Check if query is ambiguous and needs clarification
            is_ambiguous, clarification_needed = self._check_query_ambiguity(query_text, evidence_items)
            
            if is_ambiguous and clarification_needed:
                print(f"[Agent Mode] Query is ambiguous, proposing clarification")
                clarification_response = self._propose_clarification(query_text, evidence_items)
                confidence = 0.75
                return clarification_response, confidence, None
            
            # Detect if tools are needed for this query
            suggested_tools = detect_required_tools(query_text)
            print(f"[Agent Mode] Suggested tools: {suggested_tools}")
            
            # Initialize tool registry
            tool_registry = ToolRegistry(evidence_data=evidence_items, case_id=case_id)
            
            # Prepare evidence context
            evidence_context = self._format_evidence_for_ai(evidence_items, max_items=30)
            
            # Build conversation context
            conversation_context = self._build_conversation_context(conversation_history)
            
            # ReAct Loop: Reason -> Act -> Observe
            agent_thoughts = []
            tool_results = []
            iterations = 0
            embedded_component = None
            
            # Initial system prompt with tool instructions - IMPROVED
            system_prompt = f"""You are an expert forensic AI assistant with access to specialized tools that can generate visualizations and analyze evidence.

**YOUR MISSION:** Help the investigating officer by using tools to provide actionable insights.

**AVAILABLE TOOLS (USE THESE!):**
1. 🕸️ **generate_network_graph** - Creates actual network visualization JSON
   - Use when: Officer asks "show network", "show connections", "relationships"
   - Returns: JSON with nodes and edges that will be rendered as an interactive graph

2. 📅 **generate_timeline** - Creates actual timeline visualization JSON
   - Use when: Officer asks "timeline", "chronology", "when did", "sequence"
   - Returns: JSON with events that will be rendered as an interactive timeline

3. 🔍 **search_evidence** - Searches evidence with filters
   - Use when: Officer asks "find", "search", "show me evidence about"
   - Returns: Filtered list of evidence items

4. 📊 **analyze_pattern** - Analyzes patterns in evidence
   - Use when: Officer asks "what patterns", "frequency", "trends"
   - Returns: Pattern analysis with findings

5. 🏷️ **get_entity_details** - Gets details about specific entities
   - Use when: Officer asks about a specific person, phone, or entity
   - Returns: Detailed information and related evidence

6. 📝 **format_report_section** - Formats content for reports
   - Use when: Officer asks "create report", "summarize for report"
   - Returns: Formatted report section

**CRITICAL RULES:**
- When officer asks for a VISUALIZATION (graph, timeline), you MUST call the appropriate tool
- DO NOT describe what a graph would look like - GENERATE IT using the tool
- After calling a tool, you will see its results and MUST present them clearly
- Be specific: "I found X items" not "I searched for items"

{conversation_context}

**EVIDENCE AVAILABLE:**
{evidence_context}

**OFFICER'S QUESTION:** {query_text}

Now decide: What tool(s) do you need to answer this question? If it's about visualization, USE THE TOOL - don't describe it in text."""
            
            # Call Gemini with function calling
            response = requests.post(
                'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
                headers={
                    'Content-Type': 'application/json',
                    'X-goog-api-key': self.gemini_key
                },
                json={
                    'contents': [{
                        'parts': [{'text': system_prompt}]
                    }],
                    'tools': [{
                        'function_declarations': ALL_TOOL_SCHEMAS
                    }],
                    'generationConfig': {
                        'temperature': 0.4,  # Lower for more deterministic tool use
                    }
                },
                timeout=30
            )
            
            if response.status_code != 200:
                print(f"[Agent Mode] API error: {response.status_code}")
                return self.process_natural_language_query(query_text, evidence_items, conversation_history) + (None,)
            
            result = response.json()
            
            # Check if AI wants to use functions
            if 'candidates' in result and len(result['candidates']) > 0:
                candidate = result['candidates'][0]
                content = candidate.get('content', {})
                parts = content.get('parts', [])
                
                # Process function calls
                for part in parts:
                    if 'functionCall' in part:
                        function_call = part['functionCall']
                        tool_name = function_call.get('name')
                        tool_args = function_call.get('args', {})
                        
                        print(f"[Agent Mode] Tool call: {tool_name} with args: {json.dumps(tool_args, indent=2)[:200]}")
                        
                        # Execute the tool
                        tool_result = tool_registry.execute_tool(tool_name, tool_args)
                        tool_results.append(tool_result)
                        
                        print(f"[Agent Mode] Tool result: success={tool_result.get('success')}")
                        
                        # If it's a visualization tool, prepare embedded component
                        if tool_result.get('success'):
                            result_data = tool_result.get('data', {})
                            result_type = result_data.get('type')
                            
                            if result_type == 'network':
                                embedded_component = {
                                    'type': 'network',
                                    'data': {
                                        'nodes': result_data.get('nodes', []),
                                        'links': result_data.get('edges', [])
                                    }
                                }
                            elif result_type == 'timeline':
                                embedded_component = {
                                    'type': 'timeline',
                                    'data': result_data.get('events', [])
                                }
                        
                        iterations += 1
                        if iterations >= self.max_tool_iterations:
                            break
                
                # Now get the final response incorporating tool results
                if tool_results:
                    # Build follow-up prompt with tool results - ENFORCING COMPLETE LOOP
                    tool_results_text = "\n\n**TOOL EXECUTION RESULTS:**\n"
                    for i, tr in enumerate(tool_results, 1):
                        if tr.get('success'):
                            tool_results_text += f"\n{i}. ✅ **{tr['tool_name']}** succeeded:\n"
                            tool_results_text += f"   - User message: {tr.get('user_message', 'Tool executed')}\n"
                            tool_results_text += f"   - Data summary: {json.dumps(tr.get('data', {}), indent=2)[:800]}\n"
                        else:
                            tool_results_text += f"\n{i}. ❌ **{tr['tool_name']}** failed:\n"
                            tool_results_text += f"   - Error: {tr.get('error')}\n"
                            tool_results_text += f"   - User message: {tr.get('user_message', 'Tool failed')}\n"
                    
                    final_prompt = f"""{system_prompt}

{tool_results_text}

**CRITICAL: YOU MUST NOW SYNTHESIZE INSIGHTS, NOT JUST DESCRIBE ACTIONS**

The tools have been executed. Your job is NOT to say "I ran a tool." Your job is to BE THE EXPERT ANALYST who interprets the results.

You MUST now:
1. **Find the "So What?"** - What do these results MEAN for the investigation?
2. **Identify Meaningful Correlations** - Not "X has a phone number" but "X and Y are connected because they both appear in communications on the same day about the same topic"
3. **Highlight Significant Patterns** - What's surprising, unusual, or important?
4. **Provide Actionable Insights** - What should the officer investigate next based on these findings?
5. **Use concrete evidence** - Reference specific Evidence IDs, names, dates, amounts

**EXAMPLES OF GOOD VS BAD RESPONSES:**

❌ BAD: "The graph shows Beijing Link is connected to phone number +86..."
✅ GOOD: "Beijing Link appears in 5 communications with Shadow Trader between Mar 15-17, discussing financial transactions. This suggests an active business relationship during the investigation period."

❌ BAD: "I found 10 messages."
✅ GOOD: "10 messages show an escalating pattern: early messages discuss meeting locations, later ones reference 'package delivery' and crypto addresses. This suggests planning followed by execution."

❌ BAD: "The network has 15 nodes and 23 connections."
✅ GOOD: "The network reveals a hub-and-spoke pattern with 'Crypto Manager' at the center, connected to 8 other entities. This person appears to be coordinating the operation."

**YOUR ANALYSIS STRUCTURE:**
## 🔍 Key Findings
[Most important discoveries - what matters most?]

## 📊 Significant Patterns
[Patterns, correlations, connections between different types of evidence]

## ⚠️ Notable Observations
[Anything suspicious, unusual, or worth investigating]

## 🎯 Recommended Next Steps
[What the officer should look into based on these findings]

Now provide your INSIGHTFUL analysis (NOT just tool descriptions):"""
                    
                    # Call Gemini again for final response (without tools this time)
                    final_response = requests.post(
                        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
                        headers={
                            'Content-Type': 'application/json',
                            'X-goog-api-key': self.gemini_key
                        },
                        json={
                            'contents': [{
                                'parts': [{'text': final_prompt}]
                            }],
                            'generationConfig': {
                                'temperature': 0.7,
                            }
                        },
                        timeout=20
                    )
                    
                    if final_response.status_code == 200:
                        final_result = final_response.json()
                        if 'candidates' in final_result and len(final_result['candidates']) > 0:
                            summary = final_result['candidates'][0]['content']['parts'][0]['text'].strip()
                            
                            # Add tool execution summary
                            summary += f"\n\n---\n\n> **Agent Mode:** Used {len(tool_results)} tool(s) to generate this response."
                            
                            # Check if we should offer a proactive summary
                            if hasattr(self, 'conversation_manager') and self.conversation_manager:
                                if self.conversation_manager.should_offer_proactive_summary():
                                    summary += self.conversation_manager.get_proactive_summary_suggestion()
                            
                            confidence = 0.9  # High confidence when tools are used successfully
                            
                            return summary, confidence, embedded_component
                
                # If no function calls or only text response
                if parts and 'text' in parts[0]:
                    summary = parts[0]['text'].strip()
                    
                    # Check if the response is trying to describe a visualization
                    # If so, provide better guidance
                    query_lower = query_text.lower()
                    if any(word in query_lower for word in ['graph', 'network', 'timeline', 'visualiz']):
                        if 'cannot generate' in summary.lower() or 'textual representation' in summary.lower():
                            # AI tried to fallback to text - improve it
                            summary = f"""## 🔍 Analysis Results

I understand you're asking for a visualization. Let me provide what I found:

{summary}

---

> **💡 Tip:** I can generate actual interactive visualizations! Try asking:
> - "Generate a network graph" (for relationship visualization)
> - "Create a timeline" (for chronological view)
> 
> The visualization will appear automatically if I have enough data to work with."""
                    
                    confidence, _ = self._calculate_confidence(summary, evidence_items)
                    
                    # Check if we should offer a proactive summary
                    if hasattr(self, 'conversation_manager') and self.conversation_manager:
                        if self.conversation_manager.should_offer_proactive_summary():
                            summary += self.conversation_manager.get_proactive_summary_suggestion()
                    
                    return summary, confidence, embedded_component
            
            # Fallback if something went wrong
            print("[Agent Mode] Falling back to regular query processing")
            return self.process_natural_language_query(query_text, evidence_items, conversation_history) + (None,)
            
        except Exception as e:
            print(f"[Agent Mode] Error: {e}")
            import traceback
            traceback.print_exc()
            # Fallback to regular processing
            return self.process_natural_language_query(query_text, evidence_items, conversation_history) + (None,)
    
    def _build_conversation_context(self, conversation_history: Optional[List[Dict[str, str]]]) -> str:
        """Helper method to build conversation context string"""
        if not conversation_history or len(conversation_history) == 0:
            return ""
        
        context = "\n\n**PREVIOUS CONVERSATION:**\n"
        for idx, exchange in enumerate(conversation_history[-5:], 1):
            context += f"{idx}. Officer: {exchange.get('query', '')}\n"
            context += f"   You: {exchange.get('response', '')[:200]}...\n"
        
        # Add established facts to avoid redundancy
        if hasattr(self, 'conversation_manager') and self.conversation_manager:
            if self.conversation_manager.established_facts:
                context += "\n\n**ESTABLISHED FACTS (Avoid Repeating):**\n"
                context += "*As we've discussed:*\n"
                for fact in list(self.conversation_manager.established_facts)[:3]:  # Top 3
                    context += f"- {fact[:100]}\n"
                context += "\n*Build on these facts rather than repeating them.*\n"
        
        return context
    
    def _check_query_ambiguity(self, query_text: str, evidence_items: List[Dict]) -> Tuple[bool, bool]:
        """
        Check if query is ambiguous and needs clarification
        Returns: (is_ambiguous, should_clarify)
        """
        query_lower = query_text.lower()
        
        # Broad/vague terms that indicate ambiguous queries
        ambiguous_patterns = [
            'analyze everything', 'analyze the whole', 'analyze all',
            'find any', 'show me everything', 'tell me everything',
            'what can you tell me', 'give me all', 'find correlation',
            'analyze this file', 'analyze the file'
        ]
        
        is_ambiguous = any(pattern in query_lower for pattern in ambiguous_patterns)
        
        # Check if query is very broad
        if len(evidence_items) > 50 and len(query_text.split()) < 5:
            is_ambiguous = True
        
        # Don't clarify if there's very little evidence (nothing to scope)
        should_clarify = is_ambiguous and len(evidence_items) > 20
        
        return is_ambiguous, should_clarify
    
    def _propose_clarification(self, query_text: str, evidence_items: List[Dict]) -> str:
        """
        Propose a clarification plan for ambiguous queries
        """
        # Analyze what's in the evidence
        evidence_types = {}
        entity_types = set()
        has_timestamps = False
        
        for item in evidence_items[:50]:  # Sample
            e_type = item.get('type', 'evidence')
            evidence_types[e_type] = evidence_types.get(e_type, 0) + 1
            
            if item.get('timestamp'):
                has_timestamps = True
            
            for entity in item.get('entities', []):
                entity_types.add(entity.get('type', ''))
        
        # Build clarification response
        clarification = f"""## 🔍 Let's Focus Your Investigation

I understand you want to "{query_text}". That's a broad request, so let me propose a structured approach to get you the most valuable insights.

### 📊 What I Found in the Evidence

I have **{len(evidence_items)} evidence items** to analyze:
"""
        
        # List evidence types
        if evidence_types:
            clarification += "\n**Evidence Types:**\n"
            for e_type, count in sorted(evidence_types.items(), key=lambda x: x[1], reverse=True):
                clarification += f"- {e_type.capitalize()}: {count} items\n"
        
        # List entity types
        if entity_types:
            clarification += "\n**Key Entity Types:**\n"
            for e_type in list(entity_types)[:5]:
                clarification += f"- {e_type}\n"
        
        # Propose investigation plan
        clarification += f"""

### 🎯 Proposed Investigation Plan

I suggest we break this down into focused steps:

1. **First, identify key entities** - Who are the main people/organizations involved?
2. **Then, analyze their connections** - How are they related? What communications exist?
3. **Look for patterns** - Any unusual timing, locations, or financial activity?
4. **Timeline analysis** - When did key events occur?

### 💡 You Can Also Ask Specific Questions Like:

- "Who are the most frequently mentioned entities?"
- "Show me a network graph of connections"
- "Find all financial transactions"
- "What happened on [specific date]?"
- "Show me communications between [person A] and [person B]"

**Would you like me to start with step 1 (identifying key entities), or would you prefer to ask a more specific question?**
"""
        
        return clarification
    
    def _select_relevant_evidence(self, ai_response: str, all_evidence: List[Dict], limit: int = 10) -> List[Dict]:
        """
        Dynamically select the most relevant evidence items based on what the AI actually mentioned
        in its response. Makes the returned evidence contextual and meaningful.
        """
        # Extract entity mentions from AI response
        response_lower = ai_response.lower()
        mentioned_entities = set()
        mentioned_ids = set()
        
        # Extract evidence IDs explicitly mentioned (e.g., "Evidence #123")
        import re
        id_pattern = r'evidence\s*#?(\d+)'
        for match in re.finditer(id_pattern, response_lower):
            mentioned_ids.add(match.group(1))
        
        # Extract entity values mentioned in response
        for item in all_evidence:
            for entity in item.get('entities', []):
                e_value = entity.get('value', '')
                if e_value and len(e_value) > 3 and e_value.lower() in response_lower:
                    mentioned_entities.add(e_value.lower())
        
        # Score each evidence item by relevance
        scored_evidence = []
        for item in all_evidence:
            score = 0
            
            # High priority: explicitly mentioned by ID
            if str(item.get('id', '')) in mentioned_ids:
                score += 100
            
            # High priority: contains mentioned entities
            for entity in item.get('entities', []):
                e_value = entity.get('value', '').lower()
                if e_value in mentioned_entities:
                    score += 50
            
            # Medium priority: content keywords match AI response
            content = item.get('content', '').lower()
            content_words = set(content.split())
            response_words = set(response_lower.split())
            
            # Find significant overlapping words (not common words)
            common_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'}
            significant_overlap = content_words.intersection(response_words) - common_words
            score += len(significant_overlap) * 2
            
            # Low priority: recency/type
            if item.get('timestamp'):
                score += 1
            
            scored_evidence.append((score, item))
        
        # Sort by score descending
        scored_evidence.sort(key=lambda x: x[0], reverse=True)
        
        # If we have high-scoring items (score > 10), prioritize those
        high_score_items = [item for score, item in scored_evidence if score > 10]
        
        if high_score_items:
            # Return high-scoring items first, then fill with others
            result = high_score_items[:limit]
            if len(result) < limit:
                remaining = [item for score, item in scored_evidence if score <= 10]
                result.extend(remaining[:limit - len(result)])
            return result
        else:
            # No high-scoring items, return top scorers
            return [item for score, item in scored_evidence[:limit]]
    
    def process_natural_language_query(
        self, 
        query_text: str, 
        evidence_items: List[Dict[str, Any]],
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> Tuple[str, float]:
        """
        Process a natural language query and return relevant insights
        WITH CACHING for improved performance
        
        Args:
            query_text: The user's natural language query
            evidence_items: List of evidence items to analyze
        
        Returns:
            Tuple of (summary, confidence_score)
        """
        # Generate cache key from query text + evidence items
        evidence_hash = hashlib.md5(
            str(sorted([str(e.get('id', '')) for e in evidence_items])).encode()
        ).hexdigest()[:16]
        
        query_hash = hashlib.md5(query_text.encode()).hexdigest()[:16]
        cache_key = f"nlp_query_{query_hash}_{evidence_hash}"
        
        # Try to get cached result
        cached_result = cache.get(cache_key)
        if cached_result:
            print(f"[CACHE HIT] Returning cached result for: {query_text[:50]}...")
            return cached_result
        
        print(f"[CACHE MISS] Processing query: {query_text[:50]}...")
        
        # Process query normally
        if self.use_gemini:
            result = self._query_gemini(query_text, evidence_items, conversation_history)
        elif self.use_openai:
            result = self._query_openai(query_text, evidence_items, conversation_history)
        else:
            result = self._fallback_query(query_text, evidence_items)
        
        # Cache result for 1 hour (3600 seconds)
        cache.set(cache_key, result, 3600)
        print(f"[CACHE STORED] Cached result for 1 hour")
        
        return result
    
    def _query_gemini(self, query_text: str, evidence_items: List[Dict], conversation_history: Optional[List[Dict[str, str]]] = None) -> Tuple[str, float]:
        """Query using Google Gemini API with enhanced conversation context"""
        try:
            import requests
            
            # Prepare evidence context
            evidence_context = self._format_evidence_for_ai(evidence_items)
            
            # Build enhanced conversation context with entity tracking
            conversation_context = ""
            tracked_entities_summary = ""
            
            if conversation_history and len(conversation_history) > 0:
                conversation_context = "\n\n**PREVIOUS CONVERSATION CONTEXT:**\n"
                conversation_context += "The officer and you have been discussing this case. Here's what was covered:\n\n"
                
                # Format recent exchanges with better structure
                for idx, exchange in enumerate(conversation_history[-5:], 1):
                    query = exchange.get('query', '')
                    response = exchange.get('response', '')[:300]  # More context
                    conversation_context += f"**Exchange {idx}:**\n"
                    conversation_context += f"- Officer asked: \"{query}\"\n"
                    conversation_context += f"- You responded: \"{response}...\"\n\n"
                
                # Extract key entities from conversation history
                all_text = " ".join([ex.get('query', '') + " " + ex.get('response', '') for ex in conversation_history[-3:]])
                
                # Track important mentions
                crypto_addrs = re.findall(r'\b(0x[a-fA-F0-9]{40}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})\b', all_text)
                phone_nums = re.findall(r'\+?\d{10,15}', all_text)
                evidence_refs = re.findall(r'Evidence #(\d+)', all_text)
                
                if crypto_addrs or phone_nums or evidence_refs:
                    tracked_entities_summary = "\n**Entities You've Been Tracking:**\n"
                    if crypto_addrs:
                        tracked_entities_summary += f"- Crypto addresses: {', '.join(set(crypto_addrs[:3]))}\n"
                    if phone_nums:
                        tracked_entities_summary += f"- Phone numbers: {', '.join(set(phone_nums[:3]))}\n"
                    if evidence_refs:
                        tracked_entities_summary += f"- Evidence items: {', '.join(set(evidence_refs[:5]))}\n"
                
                conversation_context += tracked_entities_summary
                conversation_context += "\n**CURRENT QUESTION (use the context above to inform your answer):**\n"
            
            prompt = f"""You are an expert digital forensics AI assistant helping an investigating officer analyze evidence from a UFDR (Universal Forensic Data Report).

**CRITICAL INSTRUCTION:** If the officer's question references previous parts of the conversation (e.g., "those connections", "that address", "the person we discussed"), use the conversation context above to understand what they're referring to. DO NOT ask them to repeat information.
{conversation_context}
The officer has asked: "{query_text}"

Here is the relevant evidence found in the forensic database:

{evidence_context}

Please provide a comprehensive analysis using proper Markdown formatting that:
1. Directly answers the officer's question
2. Highlights key findings and critical evidence
3. Identifies important patterns, connections, or anomalies
4. Lists specific evidence IDs that are most relevant
5. Suggests potential next steps for the investigation

**CRITICAL FORMATTING RULES** - Your response WILL be rendered as Markdown:
- Use ## for main sections (e.g., ## Key Findings, ## Analysis)
- Use ### for subsections
- Use **bold** for critical information (names, dates, amounts)
- Use `code formatting` for phone numbers, addresses, crypto addresses
- **EVIDENCE IDs**: Use format `Evidence #123` or `#EV123` (these will be clickable links)
- Use bullet points (-) for lists
- Use numbered lists (1., 2., 3.) for sequences
- Use > blockquotes for key insights or quotes from evidence
- Use tables (| Col1 | Col2 |) when comparing data
- Use --- for section breaks

**EVIDENCE CITATION RULES:**
- When referencing evidence, ALWAYS include its ID using format: `Evidence #[ID]` or `#EV[ID]`
- Make evidence IDs prominent and clickable by using them outside of code blocks
- Example: "Found in **Evidence #1234** on WhatsApp" NOT "Found in evidence `1234`"

Example structure:
## 🔍 Analysis Results

**Query:** "Show me crypto transactions"

### Key Findings
- Found **5 transactions** totaling `$50,000`
- Primary wallet: `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`
- Timeframe: **March 10-15, 2024**

### Evidence Details
- **Evidence #1234**: Bitcoin transfer of $10,000 on Mar 10
- **Evidence #1235**: Ethereum transfer of $15,000 on Mar 12
- See also: Evidence #1240, Evidence #1241

### Key Communication
Found in **Evidence #1250** - WhatsApp message: "Transfer complete to wallet 0x742..."

> **Critical Insight:** All transactions (Evidence #1234-#1241) occurred within 24 hours of suspect meeting

Keep your response professional, well-structured, and visually scannable."""

            response = requests.post(
                'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
                headers={
                    'Content-Type': 'application/json',
                    'X-goog-api-key': self.gemini_key
                },
                json={
                    'contents': [{
                        'parts': [{'text': prompt}]
                    }]
                },
                timeout=15
            )
            
            if response.status_code == 200:
                result = response.json()
                if 'candidates' in result and len(result['candidates']) > 0:
                    summary = result['candidates'][0]['content']['parts'][0]['text'].strip()
                    
                    # Calculate confidence based on response quality
                    confidence, confidence_explanation = self._calculate_confidence(summary, evidence_items)
                    
                    # Append confidence explanation to summary
                    summary += f"\n\n---\n\n> **Confidence: {int(confidence * 100)}%** — {confidence_explanation}"
                    
                    return summary, confidence
            
            # If API call failed, fall back
            print(f"Gemini API returned status {response.status_code}")
            return self._fallback_query(query_text, evidence_items)
            
        except Exception as e:
            print(f"Gemini API error: {e}")
            return self._fallback_query(query_text, evidence_items)
    
    def _query_openai(self, query_text: str, evidence_items: List[Dict], conversation_history: Optional[List[Dict[str, str]]] = None) -> Tuple[str, float]:
        """Query using OpenAI API with conversation context"""
        try:
            from openai import OpenAI
            client = OpenAI(api_key=self.openai_key)
            
            evidence_context = self._format_evidence_for_ai(evidence_items)
            
            # Build messages list with conversation history
            messages = [
                {
                    "role": "system",
                    "content": "You are an expert digital forensics AI assistant helping investigating officers analyze evidence from UFDRs. Always format your responses using proper Markdown with headers, bold text, code blocks, and bullet points."
                }
            ]
            
            # Add conversation history
            if conversation_history and len(conversation_history) > 0:
                for exchange in conversation_history[-5:]:  # Last 5 exchanges
                    messages.append({
                        "role": "user",
                        "content": exchange.get('query', '')
                    })
                    messages.append({
                        "role": "assistant",
                        "content": exchange.get('response', '')[:500]  # Truncate for token limits
                    })
            
            # Add current question
            messages.append({
                "role": "user",
                "content": f"""Question: {query_text}

Evidence:
{evidence_context}

Provide a comprehensive forensic analysis addressing the question.

**CRITICAL FORMATTING RULES** - Response WILL be rendered as Markdown:
- Use ## for main sections (e.g., ## Key Findings)
- Use ### for subsections
- Use **bold** for critical info (names, dates, amounts)
- Use `code` for phone numbers, addresses, crypto addresses
- **EVIDENCE IDs**: Use format `Evidence #123` or `#EV123` (clickable links)
- Use bullet points (-) for lists
- Use > blockquotes for key insights
- Use tables for comparisons
- Use --- for section breaks

**EVIDENCE CITATION RULES:**
- ALWAYS cite evidence using format: `Evidence #[ID]` or `#EV[ID]`
- Example: "Found in **Evidence #1234**" NOT "Found in evidence `1234`"
- Make citations clickable by keeping them outside code blocks

Structure it like a professional forensic analysis report with clear visual hierarchy."""
            })
            
            response = client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=messages,
                temperature=0.7,
                max_tokens=1000
            )
            
            summary = response.choices[0].message.content
            confidence, confidence_explanation = self._calculate_confidence(summary, evidence_items)
            
            # Append confidence explanation to summary
            summary += f"\n\n---\n\n> **Confidence: {int(confidence * 100)}%** — {confidence_explanation}"
            
            return summary, confidence
            
        except Exception as e:
            print(f"OpenAI API error: {e}")
            return self._fallback_query(query_text, evidence_items)
    
    def _fallback_query(self, query_text: str, evidence_items: List[Dict]) -> Tuple[str, float]:
        """
        Fallback method when AI APIs are not available
        IMPROVED: Provides more insightful analysis instead of dry lists
        """
        # Extract key terms from query
        key_terms = self._extract_keywords(query_text.lower())
        
        # Categorize evidence with relevance scoring
        relevant_items = []
        for item in evidence_items:
            content_lower = item.get('content', '').lower()
            source_lower = item.get('source', '').lower()
            
            # Calculate relevance score
            relevance = sum(1 for term in key_terms if term in content_lower or term in source_lower)
            
            if relevance > 0:
                relevant_items.append((item, relevance))
        
        # Sort by relevance
        relevant_items.sort(key=lambda x: x[1], reverse=True)
        relevant_items = [item for item, _ in relevant_items]
        
        # Generate summary
        if not relevant_items:
            summary = f"""## 🔍 Analysis Results

**Query:** `{query_text}`  
**Found:** **0 relevant evidence items**

---

### ❌ No Direct Matches

No evidence items directly match your search terms. This could mean:

- The specific terms you searched for don't appear in the evidence
- Try using **broader** or **alternative** search terms
- The evidence might use different terminology

---

### 💡 Suggestions

Here are some ways to improve your search:

1. **Try related terms** - Use synonyms or broader categories
2. **Simplify your query** - Use "crypto" instead of "cryptocurrency wallet addresses"
3. **Browse manually** - Check the **Evidence** tab to see all available items
4. **Use different views** - Try **Timeline** or **Network** views for different perspectives

---

> **💡 Tip:** SpectraX works best with natural language queries like "Show me financial transactions" or "Find communications with foreign numbers"

Try one of these example queries:
- "Show me all messages"
- "Find phone numbers"
- "What crypto addresses are in this case?"
"""
            confidence = 0.3
        else:
            summary = self._generate_fallback_summary(query_text, relevant_items)
            confidence = min(0.85, 0.5 + (len(relevant_items) / len(evidence_items)))
        
        return summary, confidence
    
    def _format_evidence_for_ai(self, evidence_items: List[Dict], max_items: int = 50) -> str:
        """Format evidence items for AI context"""
        if not evidence_items:
            return "No evidence items found."
        
        # Limit to most relevant items
        items_to_include = evidence_items[:max_items]
        
        formatted = []
        for idx, item in enumerate(items_to_include, 1):
            entities_str = ", ".join([
                f"{e.get('type', 'Unknown')}: {e.get('value', '')}" 
                for e in item.get('entities', [])
            ])
            
            formatted.append(f"""
Evidence #{idx}:
- ID: {item.get('id', 'N/A')}
- Type: {item.get('type', 'Unknown')}
- Source: {item.get('source', 'Unknown')}
- Device: {item.get('device', 'Unknown')}
- Timestamp: {item.get('timestamp', 'N/A')}
- Content: {item.get('content', '')[:500]}
- Entities: {entities_str}
""")
        
        if len(evidence_items) > max_items:
            formatted.append(f"\n... and {len(evidence_items) - max_items} more items")
        
        return "\n".join(formatted)
    
    def _calculate_confidence(self, summary: str, evidence_items: List[Dict]) -> Tuple[float, str]:
        """
        Calculate confidence score for the analysis with explanation
        
        Returns:
            Tuple of (confidence_score, explanation)
        """
        # Basic confidence calculation
        confidence = 0.7
        reasons = []
        
        # Increase confidence if summary mentions specific evidence
        evidence_mentioned = sum(1 for item in evidence_items if str(item.get('id', '')) in summary)
        if evidence_mentioned > 0:
            confidence += 0.1
            reasons.append(f"references {evidence_mentioned} specific evidence items")
        
        # Increase confidence based on length and detail
        if len(summary) > 200:
            confidence += 0.1
            reasons.append("comprehensive analysis provided")
        
        # Check for pattern analysis
        if len(evidence_items) > 5 and any(word in summary.lower() for word in ['pattern', 'connection', 'relationship']):
            confidence += 0.05
            reasons.append("pattern analysis included")
        
        # Cap at 0.95
        confidence = min(0.95, confidence)
        
        # Build explanation
        if reasons:
            explanation = f"Based on {', '.join(reasons)}"
        else:
            explanation = "Based on general analysis"
        
        return confidence, explanation
    
    def extract_entities_and_relationships(self, evidence_items: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Extract entities and relationships from evidence for network graph generation
        
        Args:
            evidence_items: List of evidence items to analyze
            
        Returns:
            Dict with 'nodes' and 'links' for network graph visualization
        """
        if not evidence_items:
            return {'nodes': [], 'links': []}
        
        # Limit to first 50 items for performance
        items_to_analyze = evidence_items[:50]
        
        if self.use_gemini:
            return self._extract_relationships_gemini(items_to_analyze)
        else:
            return self._extract_relationships_fallback(items_to_analyze)
    
    def _extract_relationships_gemini(self, evidence_items: List[Dict]) -> Dict[str, Any]:
        """Use Gemini to extract entities and relationships"""
        try:
            import requests
            from datetime import datetime
            
            # Format evidence for AI
            evidence_context = ""
            for idx, item in enumerate(evidence_items[:30], 1):
                evidence_context += f"\nEvidence #{idx} (ID: {item.get('id', 'N/A')}):\n"
                evidence_context += f"- Type: {item.get('type', 'Unknown')}\n"
                evidence_context += f"- Source: {item.get('source', 'Unknown')}\n"
                evidence_context += f"- Content: {item.get('content', '')[:300]}\n"
                evidence_context += f"- Timestamp: {item.get('timestamp', 'N/A')}\n"
                
                # Include entities if available
                entities_str = ", ".join([
                    f"{e.get('type', 'Unknown')}: {e.get('value', '')}" 
                    for e in item.get('entities', [])
                ])
                if entities_str:
                    evidence_context += f"- Entities: {entities_str}\n"
            
            prompt = f"""Analyze the following forensic evidence and extract entities and their relationships for a network graph visualization.

EVIDENCE:
{evidence_context}

Your task:
1. Identify all significant entities (people, organizations, locations, devices, accounts, phone numbers, etc.)
2. Determine relationships between entities based on the evidence
3. Return the data in JSON format

Return ONLY valid JSON in this exact format (no markdown, no explanations):
{{
  "nodes": [
    {{"id": "Entity Name", "group": "person|organization|location|device|account|other", "label": "Short description"}},
    ...
  ],
  "links": [
    {{"source": "Entity A", "target": "Entity B", "label": "relationship type", "evidence_ids": ["EV1", "EV2"]}},
    ...
  ]
}}

Important:
- Use clear, concise entity names
- Group similar entities (e.g., all phone numbers as "Phone: +1234...")
- Only include relationships that are clearly evident
- Limit to top 20 most important nodes
- Return valid JSON only, no markdown code blocks"""

            response = requests.post(
                'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
                headers={
                    'Content-Type': 'application/json',
                    'X-goog-api-key': self.gemini_key
                },
                json={
                    'contents': [{
                        'parts': [{'text': prompt}]
                    }],
                    'generationConfig': {
                        'temperature': 0.3,  # Lower for more consistent JSON
                    }
                },
                timeout=20
            )
            
            if response.status_code == 200:
                result = response.json()
                if 'candidates' in result and len(result['candidates']) > 0:
                    text_response = result['candidates'][0]['content']['parts'][0]['text'].strip()
                    
                    # Try to extract JSON from response
                    # Remove markdown code blocks if present
                    text_response = re.sub(r'```json\s*', '', text_response)
                    text_response = re.sub(r'```\s*$', '', text_response)
                    text_response = text_response.strip()
                    
                    try:
                        graph_data = json.loads(text_response)
                        
                        # Validate structure
                        if 'nodes' in graph_data and 'links' in graph_data:
                            print(f"[Network Graph] Extracted {len(graph_data['nodes'])} nodes and {len(graph_data['links'])} links")
                            return graph_data
                    except json.JSONDecodeError as e:
                        print(f"[Network Graph] JSON parse error: {e}")
                        print(f"[Network Graph] Response was: {text_response[:200]}")
            
            # Fallback if AI extraction fails
            return self._extract_relationships_fallback(evidence_items)
            
        except Exception as e:
            print(f"[Network Graph] Gemini extraction error: {e}")
            return self._extract_relationships_fallback(evidence_items)
    
    def _extract_relationships_fallback(self, evidence_items: List[Dict]) -> Dict[str, Any]:
        """
        Fallback: Extract basic relationships from evidence entities
        Enhanced to create meaningful graphs even without AI
        """
        nodes = {}
        links = []
        
        print(f"[Network Graph Fallback] Processing {len(evidence_items)} evidence items")
        
        # Extract entities from evidence
        for item in evidence_items[:30]:
            source_node = item.get('source', 'Unknown')
            device_node = item.get('device', None)
            item_type = item.get('type', 'evidence')
            
            # Add source as node
            if source_node and source_node != 'Unknown':
                # Shorten source name if too long
                label = source_node[:30] + '...' if len(source_node) > 30 else source_node
                nodes[source_node] = {
                    'id': source_node, 
                    'group': item_type if item_type in ['message', 'file', 'call'] else 'source', 
                    'label': label
                }
            
            # Add device as node
            if device_node and device_node != 'Unknown':
                device_label = device_node[:30] + '...' if len(device_node) > 30 else device_node
                nodes[device_node] = {
                    'id': device_node, 
                    'group': 'device', 
                    'label': device_label
                }
                
                # Link device to source
                if source_node != 'Unknown':
                    link_key = f"{device_node}-{source_node}"
                    links.append({
                        'source': device_node,
                        'target': source_node,
                        'label': 'contains',
                        'evidence_ids': [str(item.get('id', ''))]
                    })
            
            # Extract entities from item
            for entity in item.get('entities', []):
                e_type = entity.get('type', 'other')
                e_value = entity.get('value', '')
                
                if e_value and len(e_value) > 2:
                    # Create cleaner node IDs
                    if e_type in ['phone_number', 'email', 'crypto_address']:
                        node_id = e_value
                        node_label = e_value[:30] + '...' if len(e_value) > 30 else e_value
                    else:
                        node_id = f"{e_type}:{e_value}"
                        node_label = e_value[:25] + '...' if len(e_value) > 25 else e_value
                    
                    nodes[node_id] = {
                        'id': node_id,
                        'group': e_type,
                        'label': node_label
                    }
                    
                    # Link entity to source
                    if source_node != 'Unknown':
                        links.append({
                            'source': source_node,
                            'target': node_id,
                            'label': 'mentions',
                            'evidence_ids': [str(item.get('id', ''))]
                        })
        
        # If we have very few nodes, create a basic structure
        if len(nodes) < 2:
            print("[Network Graph Fallback] Too few nodes, creating basic structure")
            # Create basic case structure
            nodes = {
                'Case Evidence': {'id': 'Case Evidence', 'group': 'case', 'label': 'Case Evidence'},
            }
            
            # Add evidence items as nodes
            for idx, item in enumerate(evidence_items[:5]):
                evidence_id = f"Evidence {item.get('id', idx)}"
                nodes[evidence_id] = {
                    'id': evidence_id,
                    'group': item.get('type', 'evidence'),
                    'label': f"Evidence {item.get('id', idx)}"
                }
                links.append({
                    'source': 'Case Evidence',
                    'target': evidence_id,
                    'label': 'includes',
                    'evidence_ids': [str(item.get('id', ''))]
                })
        
        # Limit nodes to avoid overcrowding
        node_list = list(nodes.values())[:20]
        
        # Filter links to only include existing nodes
        node_ids = {n['id'] for n in node_list}
        filtered_links = [
            link for link in links 
            if link['source'] in node_ids and link['target'] in node_ids
        ]
        
        # Remove duplicate links
        unique_links = []
        seen = set()
        for link in filtered_links:
            key = f"{link['source']}-{link['target']}"
            if key not in seen:
                seen.add(key)
                unique_links.append(link)
        
        result = {
            'nodes': node_list,
            'links': unique_links[:30]  # Limit links too
        }
        
        print(f"[Network Graph Fallback] Created {len(result['nodes'])} nodes and {len(result['links'])} links")
        
        return result
    
    def detect_intent(self, evidence_items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Detect intent and classify messages as normal, anomalous, or critical
        
        Returns:
            List of evidence items with added 'intent_flag' and 'anomaly_score'
        """
        intent_keywords = {
            'critical': ['meet', 'send money', 'deliver', 'hide', 'delete', 'destroy', 'plan', 
                        'transaction', 'transfer', 'urgent', 'tonight', 'tomorrow', 'secret'],
            'suspicious': ['unusual', 'weird', 'strange', 'anonymous', 'unknown', 'foreign',
                          'late night', 'midnight', 'cash', 'untraceable']
        }
        
        enriched_items = []
        
        for item in evidence_items:
            content = item.get('content', '').lower()
            item_copy = item.copy()
            
            # Default values
            intent_flag = 'normal'
            anomaly_score = 0.0
            
            # Check for critical keywords
            critical_matches = sum(1 for keyword in intent_keywords['critical'] if keyword in content)
            suspicious_matches = sum(1 for keyword in intent_keywords['suspicious'] if keyword in content)
            
            if critical_matches >= 2:
                intent_flag = 'critical'
                anomaly_score = 0.8 + (critical_matches * 0.05)
            elif critical_matches >= 1:
                intent_flag = 'anomalous'
                anomaly_score = 0.5 + (critical_matches * 0.1)
            elif suspicious_matches >= 2:
                intent_flag = 'anomalous'
                anomaly_score = 0.4 + (suspicious_matches * 0.05)
            
            # Check for generic patterns (likely not important)
            if 'hello, this is message number' in content.lower():
                intent_flag = 'generic'
                anomaly_score = 0.1
            
            # Cap anomaly score
            anomaly_score = min(1.0, anomaly_score)
            
            item_copy['intent_flag'] = intent_flag
            item_copy['anomaly_score'] = anomaly_score
            
            enriched_items.append(item_copy)
        
        return enriched_items
    
    def generate_message_clusters(self, evidence_items: List[Dict[str, Any]]) -> Dict[str, List[Dict]]:
        """
        Cluster related messages together based on timestamp proximity and content similarity
        
        Returns:
            Dict with cluster_id -> list of evidence items
        """
        from datetime import datetime, timedelta
        
        clusters = {}
        cluster_id = 0
        
        # Sort by timestamp
        sorted_items = sorted(
            evidence_items,
            key=lambda x: x.get('timestamp', ''),
            reverse=False
        )
        
        for i, item in enumerate(sorted_items):
            assigned = False
            
            # Try to assign to existing cluster
            for cid, cluster_items in clusters.items():
                if not cluster_items:
                    continue
                    
                last_item = cluster_items[-1]
                
                # Check timestamp proximity (within 1 hour)
                try:
                    current_time = datetime.fromisoformat(item.get('timestamp', '').replace('Z', '+00:00'))
                    last_time = datetime.fromisoformat(last_item.get('timestamp', '').replace('Z', '+00:00'))
                    
                    time_diff = abs((current_time - last_time).total_seconds())
                    
                    # Check content similarity (simple word overlap)
                    current_words = set(item.get('content', '').lower().split())
                    last_words = set(last_item.get('content', '').lower().split())
                    
                    if current_words and last_words:
                        overlap = len(current_words & last_words) / len(current_words | last_words)
                    else:
                        overlap = 0
                    
                    # Cluster if within 1 hour AND similar content (>50% overlap)
                    if time_diff < 3600 and overlap > 0.5:
                        item_copy = item.copy()
                        item_copy['cluster_id'] = cid
                        cluster_items.append(item_copy)
                        assigned = True
                        break
                except:
                    continue
            
            # Create new cluster if not assigned
            if not assigned:
                item_copy = item.copy()
                item_copy['cluster_id'] = cluster_id
                clusters[cluster_id] = [item_copy]
                cluster_id += 1
        
        return clusters
    
    def expand_query_semantically(self, query_text: str) -> List[str]:
        """
        Use Gemini AI to understand query intent and expand it into relevant search terms.
        This enables semantic search - e.g., "suspicious activity" → ["suspicious", "unusual", "anomaly", "fraud", "scam", "irregular", "contact", "communication"]
        
        Args:
            query_text: The user's natural language query
            
        Returns:
            List of expanded search terms including synonyms and related concepts
        """
        if not self.use_gemini:
            # Fallback to basic keyword extraction if Gemini not available
            return self._extract_keywords(query_text)
        
        try:
            import requests
            
            prompt = f"""You are a digital forensics search assistant. Analyze this investigator's query and extract ALL relevant search terms for searching a UFDR evidence database.

Query: "{query_text}"

IMPORTANT - The database contains evidence types like:
- Contacts (phone numbers, names)
- Messages/Chats (WhatsApp, SMS, Telegram)
- Calls (incoming, outgoing, missed)
- Files (documents, images, videos)
- Locations (GPS coordinates, addresses)
- Transactions (financial, cryptocurrency)
- Browser history, App usage

Your task:
1. Identify what TYPE of evidence the query is asking about
2. Include BOTH conceptual terms AND actual data field terms
3. Think about what words would appear in actual evidence content

For example:
- "suspicious activity" → suspicious, unusual, contact, communication, call, message, chat, transfer, transaction, unknown, foreign, late, night, deleted, hidden
- "suspicious contact" → suspicious, unusual, contact, phone, number, call, message, unknown, foreign, unidentified
- "financial transactions" → transaction, transfer, payment, money, bitcoin, crypto, wallet, bank, account, amount, currency, sent, received
- "late night communications" → night, late, midnight, evening, AM, PM, 11, 12, 1, 2, 3, 4, 5, chat, call, message, communication, whatsapp, sms

Focus on words that would actually appear IN the evidence content or metadata.

Return ONLY a comma-separated list of search terms, no explanations. Include 15-25 terms.

Search terms:"""

            response = requests.post(
                'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
                headers={
                    'Content-Type': 'application/json',
                    'X-goog-api-key': self.gemini_key
                },
                json={
                    'contents': [{
                        'parts': [{'text': prompt}]
                    }],
                    'generationConfig': {
                        'temperature': 0.3,  # Lower temperature for more focused results
                        'maxOutputTokens': 200
                    }
                },
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                if 'candidates' in result and len(result['candidates']) > 0:
                    terms_text = result['candidates'][0]['content']['parts'][0]['text'].strip()
                    
                    # Parse comma-separated terms
                    expanded_terms = [
                        term.strip().lower() 
                        for term in terms_text.split(',')
                        if term.strip()
                    ]
                    
                    # Also include original query terms
                    original_keywords = self._extract_keywords(query_text)
                    all_terms = list(set(expanded_terms + original_keywords))
                    
                    print(f"Query expanded: '{query_text}' → {len(all_terms)} terms: {all_terms[:10]}...")
                    return all_terms
            
            # Fallback if API call didn't work
            print(f"Gemini API returned status {response.status_code}, falling back to basic keywords")
            return self._extract_keywords(query_text)
            
        except Exception as e:
            print(f"Query expansion error: {e}, falling back to basic keywords")
            return self._extract_keywords(query_text)
    
    def _extract_keywords(self, text: str) -> List[str]:
        """Extract keywords from query text"""
        # Remove common words
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'show', 'me', 'list', 'all', 'find', 'any'}
        
        words = re.findall(r'\b\w+\b', text.lower())
        keywords = [w for w in words if w not in stop_words and len(w) > 2]
        
        return keywords
    
    def _generate_fallback_summary(self, query: str, items: List[Dict]) -> str:
        """
        Generate an insightful summary without AI using Markdown formatting
        IMPROVED: Provides narrative analysis instead of dry lists
        """
        summary_parts = [
            f"## 🔍 Analysis Results\n",
            f"**Query:** `{query}`\n",
            f"**Found:** **{len(items)} relevant evidence items**\n",
            f"\n---\n"
        ]
        
        # Group by type and collect stats
        by_type = {}
        by_source = {}
        by_device = {}
        timestamps = []
        
        for item in items:
            item_type = item.get('type', 'unknown')
            source = item.get('source', 'Unknown')
            device = item.get('device', 'Unknown')
            
            if item_type not in by_type:
                by_type[item_type] = []
            by_type[item_type].append(item)
        
            by_source[source] = by_source.get(source, 0) + 1
            by_device[device] = by_device.get(device, 0) + 1
            
            if item.get('timestamp'):
                timestamps.append(item.get('timestamp'))
        
        # Generate narrative summary
        summary_parts.append("### 📊 Key Findings\n\n")
        
        # Type distribution
        if by_type:
            summary_parts.append(f"The evidence consists of **{len(by_type)} different types** of data:\n")
            for item_type, type_items in sorted(by_type.items(), key=lambda x: len(x[1]), reverse=True):
                percentage = (len(type_items) / len(items)) * 100
                summary_parts.append(f"- **{item_type.capitalize()}**: {len(type_items)} items ({percentage:.0f}%)\n")
            summary_parts.append("\n")
        
        # Temporal insights
        if timestamps:
            timestamps.sort()
            summary_parts.append(f"**Time Range:** From `{timestamps[0]}` to `{timestamps[-1]}`\n\n")
        
        # Top sources
        if by_source and len(by_source) > 1:
            top_sources = sorted(by_source.items(), key=lambda x: x[1], reverse=True)[:3]
            summary_parts.append("**Most Active Sources:**\n")
            for source, count in top_sources:
                if source != 'Unknown':
                    summary_parts.append(f"- {source}: {count} items\n")
            summary_parts.append("\n")
        
        summary_parts.append("### 📝 Sample Evidence\n\n")
        
        # Show representative samples from each type
        for item_type, type_items in list(by_type.items())[:3]:
            if type_items:
                sample = type_items[0]
                content = sample.get('content', '')[:150]
                source = sample.get('source', 'Unknown')
                item_id = sample.get('id', 'N/A')
                timestamp = sample.get('timestamp', 'No timestamp')
                
                summary_parts.append(f"**Example {item_type.capitalize()}** (Evidence #{item_id}):\n")
                summary_parts.append(f"- Source: {source}\n")
                summary_parts.append(f"- Time: {timestamp}\n")
                summary_parts.append(f"- Content: \"{content}{'...' if len(sample.get('content', '')) > 150 else ''}\"\n\n")
        
        if len(items) > 10:
            summary_parts.append(f"> **Note:** Showing top 10 results. {len(items) - 10} additional items found.\n")
        
        # Add next steps
        summary_parts.extend([
            "### 🎯 Recommended Actions\n",
            "- Review the evidence items above for detailed analysis",
            "- Use the **Timeline** view to see chronological patterns", 
            "- Check the **Network** view for connection analysis",
            "- Generate a detailed **Report** for documentation\n",
            f"> *Analysis completed in fallback mode. For enhanced AI insights, configure Gemini or OpenAI API keys.*"
        ])
        
        # Extract common entities
        all_entities = []
        for item in items:
            all_entities.extend(item.get('entities', []))
        
        if all_entities:
            summary_parts.append("### 🏷️ Key Entities Identified\n")
            entity_types = {}
            for e in all_entities:
                e_type = e.get('type', 'Unknown')
                if e_type not in entity_types:
                    entity_types[e_type] = set()
                entity_types[e_type].add(e.get('value', ''))
            
            for e_type, values in list(entity_types.items())[:5]:
                value_list = ', '.join([f"`{v}`" for v in list(values)[:3]])
                summary_parts.append(f"- **{e_type}**: {value_list}")
        
        return "\n".join(summary_parts)
    
    def generate_insights(self, case_id: str, evidence_items: List[Dict]) -> List[Dict[str, Any]]:
        """
        Generate AI insights about patterns and anomalies in evidence
        """
        insights = []
        
        # Pattern detection
        patterns = self._detect_patterns(evidence_items)
        for pattern in patterns:
            insights.append({
                'type': 'pattern',
                'title': pattern['title'],
                'description': pattern['description'],
                'confidence': pattern['confidence'],
                'metadata': pattern.get('metadata', {})
            })
        
        # Anomaly detection
        anomalies = self._detect_anomalies(evidence_items)
        for anomaly in anomalies:
            insights.append({
                'type': 'anomaly',
                'title': anomaly['title'],
                'description': anomaly['description'],
                'confidence': anomaly['confidence'],
                'metadata': anomaly.get('metadata', {})
            })
        
        return insights
    
    def _detect_patterns(self, evidence_items: List[Dict]) -> List[Dict]:
        """
        Enhanced pattern detection with regex for financial and communication data
        """
        patterns = []
        
        # Regex patterns for detection
        regex_patterns = {
            'crypto_address': {
                'pattern': r'\b(0x[a-fA-F0-9]{40}|[13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,59})\b',
                'description': 'Cryptocurrency wallet address'
            },
            'bank_account': {
                'pattern': r'\b\d{8,18}\b',
                'description': 'Potential bank account number'
            },
            'amount': {
                'pattern': r'\$\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\d{1,3}(?:,\d{3})*(?:\.\d{2})?\s*(?:USD|EUR|BTC|ETH)',
                'description': 'Financial amount'
            },
            'phone': {
                'pattern': r'\+?\d{1,4}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}',
                'description': 'Phone number'
            },
            'email': {
                'pattern': r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
                'description': 'Email address'
            },
            'ip_address': {
                'pattern': r'\b(?:\d{1,3}\.){3}\d{1,3}\b',
                'description': 'IP address'
            },
            'meeting_reference': {
                'pattern': r'\b(meet|meeting|appointment|schedule|tomorrow|tonight|today)\b',
                'description': 'Meeting arrangement'
            }
        }
        
        # Detect regex patterns
        pattern_matches = {}
        for item in evidence_items:
            content = item.get('content', '')
            
            for pattern_name, pattern_info in regex_patterns.items():
                matches = re.findall(pattern_info['pattern'], content, re.IGNORECASE)
                if matches:
                    if pattern_name not in pattern_matches:
                        pattern_matches[pattern_name] = []
                    pattern_matches[pattern_name].extend(matches)
        
        # Create pattern reports for significant findings
        for pattern_name, matches in pattern_matches.items():
            unique_matches = list(set(matches))
            if len(unique_matches) >= 2:  # At least 2 unique occurrences
                pattern_info = regex_patterns[pattern_name]
                patterns.append({
                    'title': f'{pattern_info["description"]} Pattern Detected',
                    'description': f'Found {len(unique_matches)} unique {pattern_info["description"].lower()}s across {len(matches)} instances in the evidence.',
                    'confidence': min(0.9, 0.6 + (len(unique_matches) * 0.05)),
                    'metadata': {
                        'pattern_type': pattern_name,
                        'unique_count': len(unique_matches),
                        'total_count': len(matches),
                        'samples': unique_matches[:3]  # First 3 examples
                    }
                })
        
        # Frequency analysis of entities
        entity_freq = {}
        for item in evidence_items:
            for entity in item.get('entities', []):
                key = f"{entity.get('type')}:{entity.get('value')}"
                entity_freq[key] = entity_freq.get(key, 0) + 1
        
        # Find frequently occurring entities
        for key, freq in entity_freq.items():
            if freq >= 3:
                e_type, e_value = key.split(':', 1)
                patterns.append({
                    'title': f'Frequent {e_type}: {e_value}',
                    'description': f'This {e_type.lower()} appears {freq} times across the evidence, suggesting it may be significant to the investigation.',
                    'confidence': min(0.9, 0.5 + (freq * 0.1)),
                    'metadata': {'frequency': freq, 'type': e_type, 'value': e_value}
                })
        
        # Detect temporal patterns (frequency spikes)
        from datetime import datetime, timedelta
        try:
            timestamps = []
            for item in evidence_items:
                try:
                    ts = datetime.fromisoformat(item.get('timestamp', '').replace('Z', '+00:00'))
                    timestamps.append(ts)
                except:
                    continue
            
            if len(timestamps) > 10:
                # Group by hour windows and find spikes
                hour_windows = {}
                for ts in timestamps:
                    hour_key = ts.strftime('%Y-%m-%d %H:00')
                    hour_windows[hour_key] = hour_windows.get(hour_key, 0) + 1
                
                avg_per_hour = len(timestamps) / max(len(hour_windows), 1)
                spikes = [(k, v) for k, v in hour_windows.items() if v > avg_per_hour * 2]
                
                if spikes:
                    spikes.sort(key=lambda x: x[1], reverse=True)
                    top_spike = spikes[0]
                    patterns.append({
                        'title': 'Unusual Activity Spike Detected',
                        'description': f'Activity spike at {top_spike[0]} with {top_spike[1]} events (avg: {avg_per_hour:.1f} per hour)',
                        'confidence': 0.75,
                        'metadata': {
                            'spike_time': top_spike[0],
                            'event_count': top_spike[1],
                            'average': avg_per_hour
                        }
                    })
        except:
            pass
        
        return patterns[:8]  # Return top 8 patterns
    
    def _detect_anomalies(self, evidence_items: List[Dict]) -> List[Dict]:
        """Detect anomalies in evidence"""
        anomalies = []
        
        # Check for unusual times
        from datetime import datetime
        timestamps = []
        for item in evidence_items:
            try:
                ts = datetime.fromisoformat(item.get('timestamp', '').replace('Z', '+00:00'))
                timestamps.append((ts, item))
            except:
                continue
        
        # Find late night activities (11 PM - 5 AM)
        late_night = [
            (ts, item) for ts, item in timestamps 
            if ts.hour >= 23 or ts.hour <= 5
        ]
        
        if len(late_night) > 3:
            anomalies.append({
                'title': 'Unusual Activity Hours',
                'description': f'Detected {len(late_night)} evidence items from late night hours (11 PM - 5 AM), which may indicate suspicious activity.',
                'confidence': 0.7,
                'metadata': {'count': len(late_night), 'items': [item.get('id') for _, item in late_night[:5]]}
            })
        
        return anomalies
    
    def test_hypothesis(
        self, 
        hypothesis: str, 
        evidence_items: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Test an investigative hypothesis against available evidence
        
        This forensic-specific feature allows investigators to:
        - Frame their theory as a hypothesis
        - Get supporting and contradictory evidence
        - Receive a confidence assessment
        
        Args:
            hypothesis: The investigative hypothesis to test (e.g., "The deal was planned at the warehouse")
            evidence_items: List of evidence items to test against
        
        Returns:
            Dict with structure:
            {
                'hypothesis': str,
                'conclusion': str ('likely', 'unlikely', 'inconclusive'),
                'confidence': float (0-1),
                'supporting_evidence': List[Dict],
                'contradictory_evidence': List[Dict],
                'neutral_evidence': List[Dict],
                'analysis': str (markdown formatted),
            }
        """
        # Extract key terms from hypothesis
        key_terms = self._extract_keywords(hypothesis.lower())
        
        # Categorize evidence
        supporting = []
        contradictory = []
        neutral = []
        
        for item in evidence_items:
            content_lower = item.get('content', '').lower()
            relevance_score = sum(1 for term in key_terms if term in content_lower)
            
            if relevance_score > 0:
                supporting.append({
                    'item': item,
                    'relevance': relevance_score
                })
        
        # Sort by relevance
        supporting.sort(key=lambda x: x['relevance'], reverse=True)
        
        # Use AI to analyze if available
        if self.use_gemini or self.use_openai:
            return self._ai_hypothesis_test(hypothesis, evidence_items, supporting)
        else:
            return self._fallback_hypothesis_test(hypothesis, supporting, evidence_items)
    
    def _ai_hypothesis_test(
        self, 
        hypothesis: str, 
        evidence_items: List[Dict], 
        supporting: List[Dict]
    ) -> Dict[str, Any]:
        """Use AI to test hypothesis"""
        try:
            import requests
            
            evidence_context = self._format_evidence_for_ai(evidence_items[:20])  # Limit to top 20
            
            prompt = f"""You are a forensic expert analyzing evidence to test an investigative hypothesis.

**HYPOTHESIS TO TEST:**
"{hypothesis}"

**AVAILABLE EVIDENCE:**
{evidence_context}

Your task is to rigorously test this hypothesis against the evidence. Provide:

1. **Supporting Evidence**: List evidence that supports the hypothesis with IDs
2. **Contradictory Evidence**: List evidence that contradicts it with IDs  
3. **Analysis**: Detailed reasoning about the hypothesis validity
4. **Conclusion**: State whether the hypothesis is 'likely', 'unlikely', or 'inconclusive'
5. **Confidence Score**: 0-100% confidence in your conclusion

Format your response as markdown with these sections:
## Supporting Evidence
## Contradictory Evidence
## Analysis
## Conclusion

Be objective and critical. Acknowledge limitations and alternative interpretations."""

            if self.use_gemini:
                response = requests.post(
                    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
                    headers={
                        'Content-Type': 'application/json',
                        'x-goog-api-key': self.gemini_key
                    },
                    json={
                        'contents': [{
                            'parts': [{'text': prompt}]
                        }]
                    },
                    timeout=30
                )
                
                if response.status_code == 200:
                    data = response.json()
                    analysis = data['candidates'][0]['content']['parts'][0]['text']
                    
                    # Parse conclusion and confidence from response
                    conclusion = 'inconclusive'
                    confidence = 0.5
                    
                    if 'likely' in analysis.lower() and 'unlikely' not in analysis.lower():
                        conclusion = 'likely'
                        confidence = 0.75
                    elif 'unlikely' in analysis.lower():
                        conclusion = 'unlikely'
                        confidence = 0.25
                    
                    # Try to extract confidence score from response
                    import re
                    conf_match = re.search(r'(\d+)%', analysis)
                    if conf_match:
                        confidence = int(conf_match.group(1)) / 100
                    
                    return {
                        'hypothesis': hypothesis,
                        'conclusion': conclusion,
                        'confidence': confidence,
                        'supporting_evidence': [s['item'] for s in supporting[:5]],
                        'contradictory_evidence': [],
                        'neutral_evidence': [],
                        'analysis': analysis,
                    }
            
            # Fallback if AI fails
            return self._fallback_hypothesis_test(hypothesis, supporting, evidence_items)
            
        except Exception as e:
            print(f"Error in AI hypothesis testing: {e}")
            return self._fallback_hypothesis_test(hypothesis, supporting, evidence_items)
    
    def _fallback_hypothesis_test(
        self, 
        hypothesis: str, 
        supporting: List[Dict], 
        evidence_items: List[Dict]
    ) -> Dict[str, Any]:
        """Fallback hypothesis testing without AI"""
        supporting_items = [s['item'] for s in supporting[:5]]
        
        # Calculate confidence based on evidence count
        total_evidence = len(evidence_items)
        supporting_count = len(supporting_items)
        confidence = min(0.9, supporting_count / max(total_evidence, 1))
        
        if confidence > 0.6:
            conclusion = 'likely'
        elif confidence < 0.3:
            conclusion = 'unlikely'
        else:
            conclusion = 'inconclusive'
        
        analysis = f"""## 🔍 Hypothesis Testing Results

**Hypothesis:** "{hypothesis}"

### Supporting Evidence

Found **{supporting_count}** pieces of evidence that may support this hypothesis:

"""
        
        for idx, item in enumerate(supporting_items, 1):
            analysis += f"{idx}. **Evidence #{item.get('id', 'unknown')}** - {item.get('source', 'Unknown source')}\n"
            analysis += f"   - {item.get('content', '')[:150]}...\n\n"
        
        analysis += f"""
### Analysis

Based on keyword matching, approximately **{confidence*100:.1f}%** of the evidence appears relevant to this hypothesis.

**Limitations:**
- This analysis is based on keyword matching without AI
- For more sophisticated analysis, configure Gemini or OpenAI API keys
- Manual review of evidence is recommended

### Conclusion

**Assessment:** {conclusion.upper()}
**Confidence:** {confidence*100:.0f}%

"""
        
        if conclusion == 'likely':
            analysis += "\n✅ The hypothesis appears to be supported by available evidence."
        elif conclusion == 'unlikely':
            analysis += "\n❌ Limited evidence found to support this hypothesis."
        else:
            analysis += "\n⚠️ Insufficient evidence to make a definitive assessment."
        
        return {
            'hypothesis': hypothesis,
            'conclusion': conclusion,
            'confidence': confidence,
            'supporting_evidence': supporting_items,
            'contradictory_evidence': [],
            'neutral_evidence': [],
            'analysis': analysis,
        }
    
    def generate_chat_title(self, conversation_text: str) -> str:
        """
        Generate a concise, descriptive title for a chat session
        based on the conversation content
        
        Args:
            conversation_text: Combined text from the first few messages
            
        Returns:
            A short, descriptive title (max 50 characters)
        """
        if not conversation_text or len(conversation_text.strip()) < 5:
            return "New Chat Session"
        
        try:
            # Use Google Gemini to generate a concise title
            prompt = f"""Based on the following conversation starter, generate a very concise title (maximum 5 words) that captures the main topic or question. 
Do not use quotes. Just provide the title.

Conversation: {conversation_text[:300]}

Title:"""
            
            model = genai.GenerativeModel('gemini-1.5-flash')
            response = model.generate_content(prompt)
            
            if response and response.text:
                # Clean and limit title
                title = response.text.strip()
                # Remove quotes if present
                title = title.strip('"').strip("'")
                # Limit length
                if len(title) > 60:
                    title = title[:57] + "..."
                return title
            else:
                # Fallback
                return self._fallback_title(conversation_text)
                
        except Exception as e:
            logger.error(f"Error generating chat title: {str(e)}")
            return self._fallback_title(conversation_text)
    
    def _fallback_title(self, text: str) -> str:
        """Generate a simple fallback title from the text"""
        # Extract first meaningful words
        words = text.split()[:5]
        title = " ".join(words)
        if len(title) > 50:
            title = title[:47] + "..."
        return title or "Chat Session"

