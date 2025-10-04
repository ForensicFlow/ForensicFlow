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


class AIService:
    """
    Service for AI-powered evidence analysis and natural language queries
    """
    
    def __init__(self):
        self.gemini_key = settings.GEMINI_API_KEY
        self.openai_key = settings.OPENAI_API_KEY
        self.use_gemini = bool(self.gemini_key)
        self.use_openai = bool(self.openai_key)
    
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
        """Query using Google Gemini API with conversation context"""
        try:
            import requests
            
            # Prepare evidence context
            evidence_context = self._format_evidence_for_ai(evidence_items)
            
            # Build conversation context if available
            conversation_context = ""
            if conversation_history and len(conversation_history) > 0:
                conversation_context = "\n\n**PREVIOUS CONVERSATION:**\n"
                for exchange in conversation_history[-5:]:  # Last 5 exchanges
                    conversation_context += f"\nOfficer: {exchange.get('query', '')}"
                    conversation_context += f"\nAssistant: {exchange.get('response', '')[:200]}...\n"
                conversation_context += "\n**CURRENT QUESTION:**\n"
            
            prompt = f"""You are an expert digital forensics AI assistant helping an investigating officer analyze evidence from a UFDR (Universal Forensic Data Report).
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
                    confidence = self._calculate_confidence(summary, evidence_items)
                    
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
            confidence = self._calculate_confidence(summary, evidence_items)
            
            return summary, confidence
            
        except Exception as e:
            print(f"OpenAI API error: {e}")
            return self._fallback_query(query_text, evidence_items)
    
    def _fallback_query(self, query_text: str, evidence_items: List[Dict]) -> Tuple[str, float]:
        """Fallback method when AI APIs are not available"""
        # Extract key terms from query
        key_terms = self._extract_keywords(query_text.lower())
        
        # Categorize evidence
        relevant_items = []
        for item in evidence_items:
            content_lower = item.get('content', '').lower()
            if any(term in content_lower for term in key_terms):
                relevant_items.append(item)
        
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

> **💡 Tip:** FlowBot works best with natural language queries like "Show me financial transactions" or "Find communications with foreign numbers"

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
    
    def _calculate_confidence(self, summary: str, evidence_items: List[Dict]) -> float:
        """Calculate confidence score for the analysis"""
        # Basic confidence calculation
        confidence = 0.7
        
        # Increase confidence if summary mentions specific evidence
        if any(item.get('id', '') in summary for item in evidence_items):
            confidence += 0.1
        
        # Increase confidence based on length and detail
        if len(summary) > 200:
            confidence += 0.1
        
        # Cap at 0.95
        return min(0.95, confidence)
    
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
        """Generate a basic summary without AI using Markdown formatting"""
        summary_parts = [
            f"## 🔍 Analysis Results\n",
            f"**Query:** `{query}`\n",
            f"**Found:** **{len(items)} relevant evidence items**\n",
            f"\n---\n"
        ]
        
        # Group by type
        by_type = {}
        for item in items[:10]:  # Limit to 10 items
            item_type = item.get('type', 'unknown')
            if item_type not in by_type:
                by_type[item_type] = []
            by_type[item_type].append(item)
        
        summary_parts.append("### 📋 Evidence Summary\n")
        
        for item_type, type_items in by_type.items():
            summary_parts.append(f"#### {item_type.capitalize()} Evidence ({len(type_items)} items)\n")
            for item in type_items[:3]:
                content = item.get('content', '')[:100]
                source = item.get('source', 'Unknown')
                item_id = item.get('id', 'N/A')
                summary_parts.append(f"- **{source}**: {content}{'...' if len(item.get('content', '')) > 100 else ''}")
                summary_parts.append(f"  - *Evidence ID:* `{item_id}`\n")
        
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
        """Detect patterns in evidence"""
        patterns = []
        
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
        
        return patterns[:5]  # Return top 5 patterns
    
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

