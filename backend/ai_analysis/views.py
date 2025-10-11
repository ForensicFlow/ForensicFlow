"""
Views for AI analysis
"""
import time
import re
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle
from django.db.models import Q
from django.utils import timezone
from django.utils.html import escape
from .models import Query, AIInsight, ReportItem, ChatSession, ChatMessage
from .serializers import (
    QuerySerializer, AIInsightSerializer, ReportItemSerializer,
    ChatSessionSerializer, ChatSessionDetailSerializer, ChatMessageSerializer
)
from .ai_service import AIService
from evidence.models import Evidence
from evidence.serializers import EvidenceSerializer
from cases.models import Case
from typing import Tuple


# Rate limiting for AI queries
class AIQueryThrottle(UserRateThrottle):
    """Limit AI queries to 30 per minute per user"""
    rate = '30/minute'


def validate_and_sanitize_query(query_text: str) -> Tuple[bool, str, str]:
    """
    Validate and sanitize user query input
    
    Returns:
        Tuple of (is_valid, sanitized_query_or_error_message, error_type)
    """
    # Check empty
    if not query_text or not query_text.strip():
        return False, "Query cannot be empty", "empty"
    
    # Length limits
    if len(query_text) > 2000:
        return False, "Query too long (max 2000 characters)", "too_long"
    
    if len(query_text.strip()) < 3:
        return False, "Query too short (min 3 characters)", "too_short"
    
    # Block suspicious patterns
    dangerous_patterns = [
        (r'<script[^>]*>.*?</script>', 'script_injection'),
        (r'javascript:', 'javascript_injection'),
        (r'\bDROP\s+TABLE\b', 'sql_injection'),
        (r'\bDELETE\s+FROM\b', 'sql_injection'),
        (r'<iframe', 'iframe_injection'),
    ]
    
    for pattern, error_type in dangerous_patterns:
        if re.search(pattern, query_text, re.IGNORECASE):
            return False, f"Invalid query pattern detected. Please rephrase your question.", error_type
    
    # Sanitize HTML
    sanitized = escape(query_text.strip())
    return True, sanitized, ""


class QueryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for natural language queries
    WITH RATE LIMITING, INPUT VALIDATION, AND USER-SPECIFIC ACCESS CONTROL
    """
    serializer_class = QuerySerializer
    throttle_classes = [AIQueryThrottle]  # Rate limiting: 30 queries/min
    
    def get_permissions(self):
        """Set permissions dynamically"""
        from authentication.permissions import IsAuthenticatedAndApproved, IsCaseInvestigatorOrAbove
        return [IsAuthenticatedAndApproved(), IsCaseInvestigatorOrAbove()]
    
    def get_queryset(self):
        """
        Filter queries based on user's case access
        Ensures complete data isolation - users only see queries from cases they have access to
        """
        user = self.request.user
        
        # Base queryset with select_related for performance
        queryset = Query.objects.select_related('case', 'user')
        
        # Filter by user's case access
        if user.is_administrator or user.is_supervisor:
            # Admins and supervisors see all queries
            pass
        else:
            # Investigators see only queries from assigned cases
            queryset = queryset.filter(case__investigators=user)
        
        # Additional filter by case_id if provided
        case_id = self.request.query_params.get('case_id')
        if case_id:
            # Verify user has access to this case
            try:
                case = Case.objects.get(id=case_id)
                if not user.has_case_access(case):
                    return Query.objects.none()
                queryset = queryset.filter(case_id=case_id)
            except Case.DoesNotExist:
                return Query.objects.none()
        
        return queryset
    
    @action(detail=False, methods=['post'])
    def ask(self, request):
        """
        Process a natural language query
        WITH INPUT VALIDATION AND SANITIZATION
        """
        query_text = request.data.get('query', '')
        case_id = request.data.get('case_id')
        
        # Validate and sanitize input
        is_valid, result, error_type = validate_and_sanitize_query(query_text)
        if not is_valid:
            return Response(
                {
                    'error': result,
                    'error_type': error_type,
                    'suggestion': 'Please rephrase your question using natural language (e.g., "Show me crypto transactions")'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        query_text = result  # Use sanitized version
        
        if not case_id:
            return Response(
                {'error': 'Case ID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get case and verify access
        try:
            case = Case.objects.get(id=case_id)
            # Verify user has access to this case
            if not request.user.has_case_access(case):
                return Response(
                    {'error': 'You do not have access to this case'},
                    status=status.HTTP_403_FORBIDDEN
                )
        except Case.DoesNotExist:
            return Response(
                {'error': 'Case not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        start_time = time.time()
        
        # Initialize AI service for semantic query expansion
        ai_service = AIService()
        
        # SEMANTIC QUERY EXPANSION: Use Gemini AI to understand intent and expand query terms
        # This allows queries like "suspicious activity" to match evidence containing "suspicious", "unusual", "contact", etc.
        expanded_keywords = ai_service.expand_query_semantically(query_text)
        
        print(f"[NLP Enhancement] Original query: '{query_text}'")
        print(f"[NLP Enhancement] Expanded to {len(expanded_keywords)} search terms: {expanded_keywords[:15]}")
        
        # Search evidence based on expanded keywords
        evidence_queryset = Evidence.objects.filter(case=case)
        
        # Build optimized search query with expanded semantic terms
        if expanded_keywords:
            q_objects = Q()
            for keyword in expanded_keywords:
                q_objects |= (  # Use OR (|=) for broad semantic matching
                    Q(content__icontains=keyword) |
                    Q(source__icontains=keyword) |
                    Q(entities__value__icontains=keyword) |
                    Q(type__icontains=keyword) |
                    Q(device__icontains=keyword)
                )
            evidence_queryset = evidence_queryset.filter(q_objects).distinct()
        else:
            evidence_queryset = evidence_queryset.distinct()
        
        # Serialize evidence
        evidence_serializer = EvidenceSerializer(evidence_queryset, many=True)
        evidence_data = evidence_serializer.data
        
        print(f"[NLP Enhancement] Found {len(evidence_data)} evidence items after semantic search")
        
        # Get conversation history from request (for conversational memory)
        conversation_history = request.data.get('conversation_history', [])
        
        # Process with AI to generate comprehensive summary WITH CONVERSATION CONTEXT
        summary, confidence = ai_service.process_natural_language_query(
            query_text, 
            evidence_data,
            conversation_history
        )
        
        processing_time = time.time() - start_time
        
        # Create query record
        # Handle anonymous user case (when authentication is disabled)
        user = request.user if request.user.is_authenticated else None
        
        query_obj = Query.objects.create(
            case=case,
            user=user,
            query_text=query_text,
            ai_summary=summary,
            results_count=len(evidence_data),
            confidence_score=confidence,
            processing_time=processing_time
        )
        
        # Generate follow-up suggestions
        suggested_followups = self._generate_followup_suggestions(query_text, evidence_data, case)
        
        # Determine if we should return an embedded visualization
        embedded_component = self._determine_visualization(query_text, evidence_data)
        
        response_data = {
            'query': QuerySerializer(query_obj).data,
            'summary': summary,
            'evidence': evidence_data,
            'results_count': len(evidence_data),
            'confidence': confidence,
            'processing_time': processing_time,
            'suggested_followups': suggested_followups
        }
        
        # Add embedded component if applicable
        if embedded_component:
            response_data['embedded_component'] = embedded_component
        
        return Response(response_data)
    
    def _generate_followup_suggestions(self, query_text: str, evidence_data: list, case) -> list:
        """Generate smart follow-up questions based on results"""
        suggestions = []
        
        # Extract entity types from evidence
        entity_types = {}
        has_timestamps = False
        
        for item in evidence_data[:20]:  # Sample first 20 items
            # Check for entities
            for entity in item.get('entities', []):
                e_type = entity.get('type')
                e_value = entity.get('value')
                if e_type and e_value:
                    if e_type not in entity_types:
                        entity_types[e_type] = []
                    if len(entity_types[e_type]) < 2:  # Keep max 2 examples
                        entity_types[e_type].append(e_value)
            
            # Check for timestamps
            if item.get('timestamp'):
                has_timestamps = True
        
        # Generate contextual suggestions based on entities found
        if 'phone_number' in entity_types and entity_types['phone_number']:
            sample = entity_types['phone_number'][0]
            suggestions.append(f"Who else communicated with {sample}?")
        
        if 'crypto_address' in entity_types:
            suggestions.append("Show me all cryptocurrency transactions in this case")
        
        if 'email' in entity_types:
            suggestions.append("Find all email communications")
        
        if 'location' in entity_types:
            suggestions.append("Plot all locations on a map")
        
        # Temporal suggestions
        if has_timestamps and len(evidence_data) > 3:
            suggestions.append("Show me a timeline of these events")
        
        # Network suggestions
        if len(evidence_data) > 5:
            suggestions.append("What connections exist between these entities?")
        
        # Generic helpful suggestions
        if not suggestions:  # If no entity-specific suggestions
            suggestions.append("Are there any suspicious patterns in this evidence?")
            suggestions.append("Summarize the key findings")
        
        return suggestions[:5]  # Return max 5 suggestions
    
    def _determine_visualization(self, query_text: str, evidence_data: list) -> dict:
        """
        Determine which embedded visualization to return based on query pattern
        Returns dict with 'type' and 'data', or None
        """
        query_lower = query_text.lower()
        
        # Timeline visualization for time-related queries
        if any(word in query_lower for word in ['timeline', 'when', 'chronological', 'sequence', 'order', 'history']):
            if len(evidence_data) > 0:
                # Format data for timeline
                timeline_events = []
                for item in evidence_data[:20]:  # Limit to 20 events for readability
                    if item.get('timestamp'):
                        timeline_events.append({
                            'id': str(item.get('id', '')),
                            'timestamp': item.get('timestamp'),
                            'source': item.get('source', 'Unknown'),
                            'content': item.get('content', '')[:200],  # Truncate
                            'type': item.get('type', 'evidence'),
                            'device': item.get('device', '')
                        })
                
                if len(timeline_events) > 1:  # Need at least 2 events for timeline
                    return {
                        'type': 'timeline',
                        'data': timeline_events
                    }
        
        # Map visualization for location queries
        if any(word in query_lower for word in ['where', 'location', 'map', 'gps', 'place', 'coordinate']):
            # Check if evidence has location data
            locations = []
            for item in evidence_data[:50]:  # Check up to 50 items
                if item.get('location'):
                    loc = item.get('location')
                    if isinstance(loc, dict) and 'lat' in loc and 'lon' in loc:
                        locations.append({
                            'id': str(item.get('id', '')),
                            'lat': loc['lat'],
                            'lon': loc['lon'],
                            'timestamp': item.get('timestamp', ''),
                            'label': item.get('source', 'Location'),
                            'device': item.get('device', '')
                        })
            
            if len(locations) > 0:
                return {
                    'type': 'map',
                    'data': locations
                }
        
        # Chat bubble view for conversation queries
        if any(word in query_lower for word in ['conversation', 'chat', 'messages between', 'discussion', 'talked']):
            # Check if all evidence is message type
            if all(item.get('type', '').lower() in ['message', 'chat', 'sms', 'whatsapp'] for item in evidence_data):
                if len(evidence_data) > 0:
                    chat_messages = []
                    for item in evidence_data[:30]:  # Limit to 30 messages
                        # Determine if sent or received (simple heuristic)
                        sender = item.get('source', '')
                        message_type = 'received'  # Default
                        
                        # Try to detect if it's sent (you can improve this logic)
                        if 'sent' in sender.lower() or 'me' in sender.lower():
                            message_type = 'sent'
                        
                        chat_messages.append({
                            'id': str(item.get('id', '')),
                            'sender': sender,
                            'content': item.get('content', ''),
                            'timestamp': item.get('timestamp', ''),
                            'type': message_type,
                            'app': item.get('source', '').split()[0] if item.get('source') else 'Chat'
                        })
                    
                    if len(chat_messages) > 0:
                        return {
                            'type': 'chat_bubbles',
                            'data': chat_messages
                        }
        
        # Network graph visualization for relationship queries
        relationship_keywords = ['relation', 'connection', 'network', 'linked', 'between', 
                                'connect', 'who knows', 'associated', 'ties', 'relationship']
        
        if any(word in query_lower for word in relationship_keywords):
            if len(evidence_data) > 1:  # Need at least 2 items for relationships
                # Use AI service to extract entities and relationships
                from .ai_service import AIService
                ai_service = AIService()
                
                print(f"[Network Graph] Detected relationship query: {query_text}")
                graph_data = ai_service.extract_entities_and_relationships(evidence_data)
                
                # Only return if we found meaningful relationships
                if graph_data and len(graph_data.get('nodes', [])) > 1:
                    return {
                        'type': 'network',
                        'data': graph_data
                    }
        
        return None  # No visualization needed
    
    @action(detail=False, methods=['post'])
    def analyze_case_on_load(self, request):
        """
        Quick case analysis for proactive welcome suggestions
        Analyzes case evidence to suggest relevant queries
        """
        case_id = request.data.get('case_id')
        
        if not case_id:
            return Response(
                {'error': 'Case ID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            case = Case.objects.get(id=case_id)
            # Verify user has access to this case
            if not request.user.has_case_access(case):
                return Response(
                    {'error': 'You do not have access to this case'},
                    status=status.HTTP_403_FORBIDDEN
                )
        except Case.DoesNotExist:
            return Response(
                {'error': 'Case not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get evidence for analysis (sample first 100 for speed)
        evidence = Evidence.objects.filter(case=case)[:100]
        
        # Quick entity analysis
        entity_types = set()
        has_gps = False
        foreign_numbers = []
        has_crypto = False
        has_financial = False
        device_types = set()
        
        for item in evidence:
            # Collect device types
            if item.device:
                device_types.add(item.device)
            
            # Check location data
            if item.latitude is not None and item.longitude is not None:
                has_gps = True
            
            # Analyze entities
            for entity in item.entities.all():
                entity_type = entity.entity_type
                entity_types.add(entity_type)
                
                if entity_type in ['Phone', 'Phone Number']:
                    # Check if international (customize based on region)
                    if not entity.value.startswith('+91'):
                        foreign_numbers.append(entity.value)
                
                if entity_type in ['Crypto', 'Cryptocurrency Address']:
                    has_crypto = True
                
                if entity_type in ['Amount', 'Bank Account']:
                    has_financial = True
        
        # Detect time gaps (simplified version)
        has_time_gaps = False
        if evidence.count() > 10:
            timestamps = [item.timestamp for item in evidence if item.timestamp]
            if len(timestamps) > 2:
                timestamps = sorted(timestamps)
                for i in range(1, len(timestamps)):
                    gap = (timestamps[i] - timestamps[i-1]).total_seconds() / 3600
                    if gap > 48:  # 48 hour gap
                        has_time_gaps = True
                        break
        
        return Response({
            'has_crypto_addresses': has_crypto,
            'has_gps_data': has_gps,
            'has_foreign_numbers': len(foreign_numbers) > 0,
            'has_time_gaps': has_time_gaps,
            'has_financial_data': has_financial,
            'entity_summary': {
                'total_types': len(entity_types),
                'types': list(entity_types),
                'device_count': len(device_types),
                'devices': list(device_types)
            },
            'evidence_count': evidence.count()
        })
    
    @action(detail=False, methods=['post'])
    def get_autocomplete_entities(self, request):
        """
        Get entities for smart autocompletion
        Supports different entity types based on query pattern
        """
        case_id = request.data.get('case_id')
        entity_type = request.data.get('entity_type')  # phone_number, crypto_address, email, etc.
        query_pattern = request.data.get('pattern', '')  # Partial query for filtering
        
        if not case_id:
            return Response(
                {'error': 'Case ID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            case = Case.objects.get(id=case_id)
            # Verify user has access to this case
            if not request.user.has_case_access(case):
                return Response(
                    {'error': 'You do not have access to this case'},
                    status=status.HTTP_403_FORBIDDEN
                )
        except Case.DoesNotExist:
            return Response(
                {'error': 'Case not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get entities from evidence
        from evidence.models import Entity
        
        entities_query = Entity.objects.filter(evidence__case=case)
        
        # Filter by type if specified
        if entity_type:
            entities_query = entities_query.filter(entity_type=entity_type)
        
        # Get unique entity values with counts
        from django.db.models import Count
        entities = entities_query.values('entity_type', 'value').annotate(
            count=Count('id')
        ).order_by('-count')[:20]  # Top 20 most frequent
        
        # Also get contact names and device names
        contacts = []
        devices = []
        
        if not entity_type or entity_type == 'contact':
            # Get unique contacts/senders from evidence
            evidence_items = Evidence.objects.filter(case=case).values('source').distinct()[:10]
            contacts = [item['source'] for item in evidence_items if item['source']]
        
        if not entity_type or entity_type == 'device':
            # Get unique devices
            evidence_items = Evidence.objects.filter(case=case).values('device').distinct()[:10]
            devices = [item['device'] for item in evidence_items if item['device']]
        
        return Response({
            'entities': list(entities),
            'contacts': contacts,
            'devices': devices,
            'total_count': entities_query.count()
        })
    
    @action(detail=False, methods=['post'])
    def test_hypothesis(self, request):
        """
        Test an investigative hypothesis against case evidence
        
        This forensic-specific feature allows investigators to:
        - Frame their theory as a hypothesis
        - Get supporting and contradictory evidence
        - Receive an objective confidence assessment
        
        Payload:
        {
            "case_id": "123",
            "hypothesis": "The deal was planned at the warehouse location"
        }
        
        Returns:
        {
            "hypothesis": str,
            "conclusion": "likely" | "unlikely" | "inconclusive",
            "confidence": 0.0-1.0,
            "supporting_evidence": [...],
            "contradictory_evidence": [...],
            "analysis": "markdown formatted analysis"
        }
        """
        hypothesis = request.data.get('hypothesis', '')
        case_id = request.data.get('case_id')
        
        if not hypothesis:
            return Response(
                {'error': 'Hypothesis is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not case_id:
            return Response(
                {'error': 'Case ID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate hypothesis length
        if len(hypothesis) < 10:
            return Response(
                {'error': 'Hypothesis is too short. Please provide a clear statement.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(hypothesis) > 500:
            return Response(
                {'error': 'Hypothesis is too long (max 500 characters)'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Get case evidence
            case = Case.objects.get(id=case_id)
            evidence = Evidence.objects.filter(case=case)
            
            if evidence.count() == 0:
                return Response(
                    {
                        'error': 'No evidence found for this case',
                        'suggestion': 'Upload evidence files before testing hypotheses'
                    },
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Convert evidence to dict format
            evidence_data = []
            for item in evidence:
                evidence_data.append({
                    'id': str(item.id),
                    'content': item.content,
                    'source': item.source,
                    'timestamp': item.timestamp.isoformat() if item.timestamp else None,
                    'device': item.device,
                    'type': item.evidence_type,
                    'entities': [
                        {'type': e.entity_type, 'value': e.value}
                        for e in item.entities.all()
                    ]
                })
            
            # Test hypothesis using AI service
            ai_service = AIService()
            result = ai_service.test_hypothesis(hypothesis, evidence_data)
            
            # Serialize supporting evidence if present
            supporting_evidence_serialized = []
            for evidence_item in result.get('supporting_evidence', [])[:5]:
                evidence_id = evidence_item.get('id')
                try:
                    evidence_obj = Evidence.objects.get(id=evidence_id)
                    supporting_evidence_serialized.append(EvidenceSerializer(evidence_obj).data)
                except Evidence.DoesNotExist:
                    pass
            
            return Response({
                'hypothesis': result['hypothesis'],
                'conclusion': result['conclusion'],
                'confidence': result['confidence'],
                'analysis': result['analysis'],
                'supporting_evidence': supporting_evidence_serialized,
                'contradictory_evidence': [],  # Will be populated by AI in future
                'evidence_count': {
                    'total': len(evidence_data),
                    'supporting': len(supporting_evidence_serialized),
                    'contradictory': 0,
                }
            })
            
        except Case.DoesNotExist:
            return Response(
                {'error': 'Case not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {
                    'error': 'Failed to test hypothesis',
                    'details': str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AIInsightViewSet(viewsets.ModelViewSet):
    """
    ViewSet for AI-generated insights with user-specific access control
    """
    serializer_class = AIInsightSerializer
    
    def get_permissions(self):
        """Set permissions dynamically"""
        from authentication.permissions import IsAuthenticatedAndApproved, IsCaseInvestigatorOrAbove
        return [IsAuthenticatedAndApproved(), IsCaseInvestigatorOrAbove()]
    
    def get_queryset(self):
        """
        Filter insights based on user's case access
        Ensures complete data isolation
        """
        user = self.request.user
        
        # Base queryset with select_related for performance
        queryset = AIInsight.objects.select_related('case')
        
        # Filter by user's case access
        if user.is_administrator or user.is_supervisor:
            # Admins and supervisors see all insights
            pass
        else:
            # Investigators see only insights from assigned cases
            queryset = queryset.filter(case__investigators=user)
        
        # Additional filter by case_id if provided
        case_id = self.request.query_params.get('case_id')
        if case_id:
            # Verify user has access to this case
            try:
                case = Case.objects.get(id=case_id)
                if not user.has_case_access(case):
                    return AIInsight.objects.none()
                queryset = queryset.filter(case_id=case_id)
            except Case.DoesNotExist:
                return AIInsight.objects.none()
        
        return queryset
    
    @action(detail=False, methods=['post'])
    def generate(self, request):
        """
        Generate AI insights for a case
        """
        case_id = request.data.get('case_id')
        
        if not case_id:
            return Response(
                {'error': 'Case ID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            case = Case.objects.get(id=case_id)
            # Verify user has access to this case
            if not request.user.has_case_access(case):
                return Response(
                    {'error': 'You do not have access to this case'},
                    status=status.HTTP_403_FORBIDDEN
                )
        except Case.DoesNotExist:
            return Response(
                {'error': 'Case not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get all evidence for the case
        evidence_queryset = Evidence.objects.filter(case=case)
        evidence_serializer = EvidenceSerializer(evidence_queryset, many=True)
        evidence_data = evidence_serializer.data
        
        # Generate insights
        ai_service = AIService()
        insights_data = ai_service.generate_insights(case_id, evidence_data)
        
        # Save insights
        created_insights = []
        for insight_data in insights_data:
            insight = AIInsight.objects.create(
                case=case,
                insight_type=insight_data['type'],
                title=insight_data['title'],
                description=insight_data['description'],
                confidence=insight_data['confidence'],
                metadata=insight_data.get('metadata', {})
            )
            created_insights.append(insight)
        
        serializer = self.get_serializer(created_insights, many=True)
        return Response({
            'insights': serializer.data,
            'count': len(created_insights)
        })


class ReportItemViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Report Items - Allows pinning insights and evidence to case reports
    With user-specific access control
    """
    serializer_class = ReportItemSerializer
    
    def get_permissions(self):
        """Set permissions dynamically"""
        from authentication.permissions import IsAuthenticatedAndApproved, IsCaseInvestigatorOrAbove
        return [IsAuthenticatedAndApproved(), IsCaseInvestigatorOrAbove()]
    
    def get_queryset(self):
        """
        Filter report items based on user's case access
        Ensures complete data isolation
        """
        user = self.request.user
        
        # Base queryset with select_related for performance
        queryset = ReportItem.objects.select_related('case', 'user')
        
        # Filter by user's case access
        if user.is_administrator or user.is_supervisor:
            # Admins and supervisors see all report items
            pass
        else:
            # Investigators see only report items from assigned cases
            queryset = queryset.filter(case__investigators=user)
        
        # Additional filter by case_id if provided
        case_id = self.request.query_params.get('case_id')
        if case_id:
            # Verify user has access to this case
            try:
                case = Case.objects.get(id=case_id)
                if not user.has_case_access(case):
                    return ReportItem.objects.none()
                queryset = queryset.filter(case_id=case_id)
            except Case.DoesNotExist:
                return ReportItem.objects.none()
        
        return queryset
    
    @action(detail=False, methods=['post'])
    def pin_ai_response(self, request):
        """
        Pin an AI response to the report
        
        Expected payload:
        {
            "case_id": "123",
            "title": "Crypto Transaction Analysis",
            "content": "Found 5 suspicious transactions...",
            "query_id": 456,  # Optional: link to source query
            "evidence_ids": ["EV001", "EV002"],  # Optional: related evidence
            "section": "findings"  # Optional: report section
        }
        """
        case_id = request.data.get('case_id')
        title = request.data.get('title', 'AI Analysis')
        content = request.data.get('content', '')
        query_id = request.data.get('query_id')
        evidence_ids = request.data.get('evidence_ids', [])
        section = request.data.get('section', 'findings')
        
        if not case_id or not content:
            return Response(
                {'error': 'case_id and content are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify user has access to this case
        try:
            case = Case.objects.get(id=case_id)
            if not request.user.has_case_access(case):
                return Response(
                    {'error': 'You do not have access to this case'},
                    status=status.HTTP_403_FORBIDDEN
                )
        except Case.DoesNotExist:
            return Response(
                {'error': 'Case not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get the next order number for this section
        last_item = ReportItem.objects.filter(
            case_id=case_id,
            section=section
        ).order_by('-order').first()
        next_order = (last_item.order + 1) if last_item else 0
        
        # Create report item
        report_item = ReportItem.objects.create(
            case_id=case_id,
            user=request.user if request.user.is_authenticated else None,
            item_type='ai_response',
            title=title,
            content=content,
            source_query_id=query_id if query_id else None,
            evidence_ids=evidence_ids,
            section=section,
            order=next_order,
            metadata=request.data.get('metadata', {})
        )
        
        serializer = self.get_serializer(report_item)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['post'])
    def pin_evidence(self, request):
        """
        Pin an evidence item to the report
        
        Expected payload:
        {
            "case_id": "123",
            "evidence_id": "EV001",
            "title": "WhatsApp Message - Warehouse Meeting",
            "content": "Message content...",
            "section": "evidence"
        }
        """
        case_id = request.data.get('case_id')
        evidence_id = request.data.get('evidence_id')
        title = request.data.get('title', 'Evidence Item')
        content = request.data.get('content', '')
        section = request.data.get('section', 'evidence')
        
        if not case_id or not evidence_id:
            return Response(
                {'error': 'case_id and evidence_id are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify user has access to this case
        try:
            case = Case.objects.get(id=case_id)
            if not request.user.has_case_access(case):
                return Response(
                    {'error': 'You do not have access to this case'},
                    status=status.HTTP_403_FORBIDDEN
                )
        except Case.DoesNotExist:
            return Response(
                {'error': 'Case not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if already pinned
        existing = ReportItem.objects.filter(
            case_id=case_id,
            item_type='evidence',
            evidence_ids__contains=[evidence_id]
        ).first()
        
        if existing:
            return Response(
                {'error': 'This evidence is already pinned to the report', 'item': ReportItemSerializer(existing).data},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get the next order number
        last_item = ReportItem.objects.filter(
            case_id=case_id,
            section=section
        ).order_by('-order').first()
        next_order = (last_item.order + 1) if last_item else 0
        
        # Create report item
        report_item = ReportItem.objects.create(
            case_id=case_id,
            user=request.user if request.user.is_authenticated else None,
            item_type='evidence',
            title=title,
            content=content,
            evidence_ids=[evidence_id],
            section=section,
            order=next_order,
            metadata=request.data.get('metadata', {})
        )
        
        serializer = self.get_serializer(report_item)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['post'])
    def reorder(self, request):
        """
        Reorder report items within a section
        
        Expected payload:
        {
            "case_id": "123",
            "section": "findings",
            "item_orders": [
                {"id": 1, "order": 0},
                {"id": 2, "order": 1},
                {"id": 3, "order": 2}
            ]
        }
        """
        case_id = request.data.get('case_id')
        section = request.data.get('section')
        item_orders = request.data.get('item_orders', [])
        
        if not case_id or not section:
            return Response(
                {'error': 'case_id and section are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update order for each item
        for item_order in item_orders:
            ReportItem.objects.filter(
                id=item_order['id'],
                case_id=case_id,
                section=section
            ).update(order=item_order['order'])
        
        # Return updated items
        updated_items = ReportItem.objects.filter(
            case_id=case_id,
            section=section
        ).order_by('order')
        
        serializer = self.get_serializer(updated_items, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def sections(self, request):
        """
        Get all report items grouped by section for a case
        
        Query params:
        - case_id: Required
        """
        case_id = request.query_params.get('case_id')
        
        if not case_id:
            return Response(
                {'error': 'case_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify user has access to this case
        try:
            case = Case.objects.get(id=case_id)
            if not request.user.has_case_access(case):
                return Response(
                    {'error': 'You do not have access to this case'},
                    status=status.HTTP_403_FORBIDDEN
                )
        except Case.DoesNotExist:
            return Response(
                {'error': 'Case not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        items = ReportItem.objects.filter(case_id=case_id).order_by('section', 'order', '-pinned_at')
        
        # Group by section
        sections = {}
        for item in items:
            if item.section not in sections:
                sections[item.section] = []
            sections[item.section].append(ReportItemSerializer(item).data)
        
        return Response({
            'sections': sections,
            'total_items': items.count()
        })


class ChatSessionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing FlowBot chat sessions with user-specific access control
    """
    serializer_class = ChatSessionSerializer
    
    def get_permissions(self):
        """Set permissions dynamically"""
        from authentication.permissions import IsAuthenticatedAndApproved, IsCaseInvestigatorOrAbove
        return [IsAuthenticatedAndApproved(), IsCaseInvestigatorOrAbove()]
    
    def get_serializer_class(self):
        """Use detailed serializer for retrieve action"""
        if self.action == 'retrieve':
            return ChatSessionDetailSerializer
        return ChatSessionSerializer
    
    def get_queryset(self):
        """
        Filter chat sessions based on user's case access
        Ensures complete data isolation
        """
        user = self.request.user
        
        # Base queryset with select_related for performance
        queryset = ChatSession.objects.select_related('case', 'user').prefetch_related('messages')
        
        # Filter by user's case access
        if user.is_administrator or user.is_supervisor:
            # Admins and supervisors see all chat sessions
            pass
        else:
            # Investigators see only chat sessions from assigned cases
            queryset = queryset.filter(case__investigators=user)
        
        # Additional filter by case_id if provided
        case_id = self.request.query_params.get('case_id')
        if case_id:
            # Verify user has access to this case
            try:
                case = Case.objects.get(id=case_id)
                if not user.has_case_access(case):
                    return ChatSession.objects.none()
                queryset = queryset.filter(case_id=case_id)
            except Case.DoesNotExist:
                return ChatSession.objects.none()
        
        return queryset
    
    def perform_create(self, serializer):
        """Create a new chat session"""
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def add_message(self, request, pk=None):
        """
        Add a message to a chat session
        """
        session = self.get_object()
        message_type = request.data.get('message_type', 'user')
        content = request.data.get('content', '')
        metadata = request.data.get('metadata', {})
        
        if not content:
            return Response(
                {'error': 'Content is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create message
        message = ChatMessage.objects.create(
            session=session,
            message_type=message_type,
            content=content,
            metadata=metadata,
            evidence_ids=request.data.get('evidence_ids', []),
            confidence_score=request.data.get('confidence_score'),
            processing_time=request.data.get('processing_time')
        )
        
        # Update session
        session.message_count += 1
        session.last_message_at = timezone.now()
        session.save()
        
        # Generate title after first few messages
        if session.message_count == 2 and not session.title:
            self._generate_session_title(session)
        
        return Response(
            ChatMessageSerializer(message).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=['post'])
    def generate_title(self, request, pk=None):
        """
        Generate an AI summary title for the chat session
        """
        session = self.get_object()
        title = self._generate_session_title(session)
        
        return Response({
            'title': title,
            'session_id': session.id
        })
    
    def _generate_session_title(self, session):
        """
        Generate a concise title summarizing the conversation
        """
        # Get first few messages
        messages = session.messages.filter(message_type='user')[:3]
        
        if not messages:
            return "New Chat Session"
        
        # Combine messages for summary
        combined_text = " | ".join([msg.content[:100] for msg in messages])
        
        try:
            # Use AI service to generate title
            ai_service = AIService()
            title = ai_service.generate_chat_title(combined_text)
            
            # Save title
            session.title = title
            session.save()
            
            return title
        except Exception as e:
            # Fallback to first message preview
            first_msg = messages.first()
            title = f"{first_msg.content[:50]}..."
            session.title = title
            session.save()
            return title
    
    @action(detail=False, methods=['get'])
    def list_for_case(self, request):
        """
        List all chat sessions for a case
        """
        case_id = request.query_params.get('case_id')
        
        if not case_id:
            return Response(
                {'error': 'case_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify user has access to this case
        try:
            case = Case.objects.get(id=case_id)
            if not request.user.has_case_access(case):
                return Response(
                    {'error': 'You do not have access to this case'},
                    status=status.HTTP_403_FORBIDDEN
                )
        except Case.DoesNotExist:
            return Response(
                {'error': 'Case not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        sessions = ChatSession.objects.filter(
            case_id=case_id
        ).order_by('-last_message_at')
        
        serializer = ChatSessionSerializer(sessions, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['delete'])
    def archive(self, request, pk=None):
        """
        Archive a chat session (soft delete)
        """
        session = self.get_object()
        session.is_active = False
        session.save()
        
        return Response({
            'message': 'Session archived successfully',
            'session_id': session.id
        })

