"""
Views for evidence management
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Count
from django.conf import settings
from .models import Evidence, Entity, Connection
from .serializers import EvidenceSerializer, EntitySerializer, ConnectionSerializer
from cases.models import Case
from authentication.permissions import IsAuthenticatedAndApproved, IsCaseInvestigatorOrAbove
import requests
import json


class EvidenceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing evidence with user-specific access control
    
    Access Rules:
    - Evidence can only be accessed by users who have access to the parent case
    - All queries are automatically filtered by case access
    """
    serializer_class = EvidenceSerializer
    permission_classes = [IsAuthenticatedAndApproved, IsCaseInvestigatorOrAbove]
    
    def get_queryset(self):
        """
        Filter evidence based on user's case access
        Ensures complete data isolation - users only see evidence from cases they have access to
        """
        user = self.request.user
        
        # Base queryset with select_related for performance
        queryset = Evidence.objects.select_related('case').prefetch_related('entities')
        
        # Filter by user's case access
        if user.is_administrator or user.is_supervisor:
            # Admins and supervisors see all evidence
            pass
        else:
            # Investigators see only evidence from assigned cases
            queryset = queryset.filter(case__investigators=user)
        
        # Additional filters
        case_id = self.request.query_params.get('case_id')
        if case_id:
            # Verify user has access to this case
            try:
                case = Case.objects.get(id=case_id)
                if not user.has_case_access(case):
                    # Return empty queryset if user doesn't have access
                    return Evidence.objects.none()
                queryset = queryset.filter(case_id=case_id)
            except Case.DoesNotExist:
                return Evidence.objects.none()
        
        # Filter by type
        evidence_type = self.request.query_params.get('type')
        if evidence_type:
            queryset = queryset.filter(type=evidence_type)
        
        # Filter by device
        device = self.request.query_params.get('device')
        if device:
            queryset = queryset.filter(device__icontains=device)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date and end_date:
            queryset = queryset.filter(timestamp__range=[start_date, end_date])
        
        # Search in content
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(content__icontains=search) |
                Q(source__icontains=search) |
                Q(entities__value__icontains=search)
            ).distinct()
        
        return queryset.distinct()
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """
        Advanced search with AI-powered semantic analysis
        Respects user's case access permissions
        """
        query = request.query_params.get('q', '')
        case_id = request.query_params.get('case_id')
        
        if not query:
            return Response({'results': []})
        
        # Use get_queryset to respect user permissions
        queryset = self.get_queryset()
        
        # If case_id is provided, verify access (already done in get_queryset)
        if case_id:
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
        
        # SEMANTIC SEARCH ENHANCEMENT: Expand query using AI for better results
        from ai_analysis.ai_service import AIService
        ai_service = AIService()
        
        # Get semantically expanded keywords
        expanded_keywords = ai_service.expand_query_semantically(query)
        
        print(f"[Evidence Search] Query: '{query}' → Expanded to {len(expanded_keywords)} terms")
        
        # Search in multiple fields using expanded terms
        q_objects = Q()
        for keyword in expanded_keywords:
            q_objects |= (
                Q(content__icontains=keyword) |
                Q(source__icontains=keyword) |
                Q(device__icontains=keyword) |
                Q(entities__value__icontains=keyword) |
                Q(metadata__icontains=keyword) |
                Q(type__icontains=keyword)
            )
        
        results = queryset.filter(q_objects).distinct().order_by('-timestamp')
        
        serializer = self.get_serializer(results, many=True)
        evidence_data = serializer.data
        
        # Generate AI summary if Gemini API key is available
        ai_summary = None
        if settings.GEMINI_API_KEY and len(evidence_data) > 0:
            try:
                ai_summary = self._generate_ai_summary(query, evidence_data[:10])
            except Exception as e:
                print(f"AI summary generation failed: {e}")
        
        return Response({
            'query': query,
            'total_results': len(evidence_data),
            'results': evidence_data,
            'ai_summary': ai_summary,
            'search_suggestions': self._generate_search_suggestions(query, evidence_data)
        })
    
    def _generate_ai_summary(self, query, evidence_results):
        """Generate AI-powered summary using Gemini API"""
        if not settings.GEMINI_API_KEY:
            return None
        
        # Prepare evidence content for AI analysis
        evidence_content = []
        for item in evidence_results:
            content = f"[{item['type']}] {item['source']}: {item['content'][:200]}"
            if item.get('entities'):
                entities = [f"{e.get('type', e.get('entity_type', 'Unknown'))}:{e.get('value', '')}" for e in item['entities']]
                content += f" | Entities: {', '.join(entities[:5])}"
            evidence_content.append(content)
        
        prompt = f"""You are a digital forensics AI assistant. Analyze the following evidence search results and provide a concise investigative summary.

Search Query: "{query}"

Evidence Found ({len(evidence_content)} items):
{chr(10).join(evidence_content)}

Provide a brief forensic analysis (2-3 sentences) highlighting:
1. Key patterns or connections
2. Important entities (people, locations, crypto addresses, etc.)
3. Potential investigative leads

Focus only on what's present in the evidence. Be precise and professional."""

        try:
            response = requests.post(
                'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
                headers={
                    'Content-Type': 'application/json',
                    'X-goog-api-key': settings.GEMINI_API_KEY
                },
                json={
                    'contents': [{
                        'parts': [{'text': prompt}]
                    }]
                },
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                if 'candidates' in result and len(result['candidates']) > 0:
                    return result['candidates'][0]['content']['parts'][0]['text'].strip()
            
            return None
            
        except Exception as e:
            print(f"Gemini API error: {e}")
            return None
    
    def _generate_search_suggestions(self, query, results):
        """Generate search suggestions based on entities found"""
        suggestions = []
        
        # Extract common entities from results
        entity_counts = {}
        for item in results[:20]:  # Limit to first 20 results
            if item.get('entities'):
                for entity in item['entities']:
                    # The serializer uses 'type' not 'entity_type'
                    entity_type = entity.get('type', entity.get('entity_type', 'Unknown'))
                    entity_value = entity.get('value', '')
                    
                    if entity_type not in entity_counts:
                        entity_counts[entity_type] = {}
                    if entity_value not in entity_counts[entity_type]:
                        entity_counts[entity_type][entity_value] = 0
                    entity_counts[entity_type][entity_value] += 1
        
        # Generate suggestions from most common entities
        for entity_type, values in entity_counts.items():
            # Get top 2 most common values for each type
            top_values = sorted(values.items(), key=lambda x: x[1], reverse=True)[:2]
            for value, count in top_values:
                if count > 1 and value.lower() != query.lower():
                    suggestions.append({
                        'text': value,
                        'type': entity_type,
                        'count': count
                    })
        
        return suggestions[:5]  # Return top 5 suggestions
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get evidence statistics for cases user has access to
        Ensures data isolation - users only see stats for their evidence
        """
        # Use get_queryset to respect user permissions
        queryset = self.get_queryset()
        
        stats = {
            'total': queryset.count(),
            'by_type': dict(queryset.values('type').annotate(count=Count('id')).values_list('type', 'count')),
            'by_device': dict(queryset.values('device').annotate(count=Count('id')).values_list('device', 'count')),
        }
        
        return Response(stats)


class EntityViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing entities with user-specific access control
    """
    serializer_class = EntitySerializer
    permission_classes = [IsAuthenticatedAndApproved, IsCaseInvestigatorOrAbove]
    
    def get_queryset(self):
        """
        Filter entities based on user's case access
        Ensures complete data isolation
        """
        user = self.request.user
        
        # Base queryset with select_related for performance
        queryset = Entity.objects.select_related('evidence', 'evidence__case')
        
        # Filter by user's case access
        if user.is_administrator or user.is_supervisor:
            # Admins and supervisors see all entities
            pass
        else:
            # Investigators see only entities from assigned cases
            queryset = queryset.filter(evidence__case__investigators=user)
        
        # Filter by case
        case_id = self.request.query_params.get('case_id')
        if case_id:
            # Verify user has access to this case
            try:
                case = Case.objects.get(id=case_id)
                if not user.has_case_access(case):
                    return Entity.objects.none()
                queryset = queryset.filter(evidence__case_id=case_id)
            except Case.DoesNotExist:
                return Entity.objects.none()
        
        # Filter by type
        entity_type = self.request.query_params.get('type')
        if entity_type:
            queryset = queryset.filter(entity_type=entity_type)
        
        return queryset.distinct()
    
    @action(detail=False, methods=['get'])
    def types(self, request):
        """
        Get all entity types with counts for cases user has access to
        """
        # Use get_queryset to respect user permissions
        queryset = self.get_queryset()
        
        types = queryset.values('entity_type').annotate(
            count=Count('id')
        ).order_by('-count')
        
        return Response(types)


class ConnectionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing entity connections (for network graph) with user-specific access control
    """
    serializer_class = ConnectionSerializer
    permission_classes = [IsAuthenticatedAndApproved, IsCaseInvestigatorOrAbove]
    
    def get_queryset(self):
        """
        Filter connections based on user's case access
        Ensures complete data isolation
        """
        user = self.request.user
        
        # Base queryset with select_related for performance
        queryset = Connection.objects.select_related(
            'source_entity__evidence__case',
            'target_entity__evidence__case'
        )
        
        # Filter by user's case access
        if user.is_administrator or user.is_supervisor:
            # Admins and supervisors see all connections
            pass
        else:
            # Investigators see only connections from assigned cases
            queryset = queryset.filter(
                source_entity__evidence__case__investigators=user
            )
        
        # Filter by case
        case_id = self.request.query_params.get('case_id')
        if case_id:
            # Verify user has access to this case
            try:
                case = Case.objects.get(id=case_id)
                if not user.has_case_access(case):
                    return Connection.objects.none()
                queryset = queryset.filter(
                    source_entity__evidence__case_id=case_id
                )
            except Case.DoesNotExist:
                return Connection.objects.none()
        
        return queryset.distinct()
    
    @action(detail=False, methods=['get'])
    def graph_data(self, request):
        """
        Get graph data for network visualization
        Respects user's case access permissions
        """
        case_id = request.query_params.get('case_id')
        
        if not case_id:
            return Response({'error': 'case_id is required'}, status=400)
        
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
        
        # Get all entities in the case
        entities = Entity.objects.filter(evidence__case_id=case_id).distinct()
        
        # Get all connections
        connections = Connection.objects.filter(
            source_entity__evidence__case_id=case_id
        ).distinct()
        
        # Build nodes
        nodes = []
        entity_id_map = {}
        for idx, entity in enumerate(entities):
            entity_id_map[entity.id] = idx
            nodes.append({
                'id': idx,
                'label': entity.value,
                'type': entity.entity_type,
                'size': min(10, entity.incoming_connections.count() + entity.outgoing_connections.count() + 5)
            })
        
        # Build edges
        edges = []
        for conn in connections:
            if conn.source_entity.id in entity_id_map and conn.target_entity.id in entity_id_map:
                edges.append({
                    'source': entity_id_map[conn.source_entity.id],
                    'target': entity_id_map[conn.target_entity.id],
                    'type': conn.connection_type,
                    'strength': conn.strength
                })
        
        return Response({
            'nodes': nodes,
            'edges': edges
        })

