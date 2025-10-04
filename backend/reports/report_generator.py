"""
Report generation utilities
"""
from typing import Dict, Any
from datetime import datetime
from evidence.models import Evidence, Entity


class ReportGenerator:
    """
    Generates various types of forensic reports
    """
    
    def __init__(self, case):
        self.case = case
    
    def generate(self, report_type: str, format_type: str = 'pdf') -> Dict[str, Any]:
        """
        Generate a report of the specified type
        """
        if report_type == 'summary':
            return self.generate_summary()
        elif report_type == 'evidence':
            return self.generate_evidence_report()
        elif report_type == 'timeline':
            return self.generate_timeline_report()
        elif report_type == 'network':
            return self.generate_network_report()
        elif report_type == 'final':
            return self.generate_final_report()
        else:
            return self.generate_summary()
    
    def generate_summary(self) -> Dict[str, Any]:
        """Generate a case summary report"""
        evidence_count = self.case.evidence_items.count()
        evidence_by_type = {}
        
        for evidence in self.case.evidence_items.all():
            evidence_by_type[evidence.type] = evidence_by_type.get(evidence.type, 0) + 1
        
        investigators = ", ".join([inv.get_full_name() for inv in self.case.investigators.all()])
        
        content = f"""
CASE SUMMARY REPORT
{'=' * 80}

Case Information:
- Case Number: {self.case.case_number}
- Case Name: {self.case.name}
- Status: {self.case.status}
- Created: {self.case.created_at.strftime('%Y-%m-%d %H:%M:%S')}
- Last Modified: {self.case.updated_at.strftime('%Y-%m-%d %H:%M:%S')}
- Investigators: {investigators}

Evidence Overview:
- Total Evidence Items: {evidence_count}

Evidence by Type:
"""
        for ev_type, count in evidence_by_type.items():
            content += f"  - {ev_type.title()}: {count}\n"
        
        # Key entities
        entities = Entity.objects.filter(evidence__case=self.case).distinct()
        entity_types = {}
        for entity in entities:
            entity_types[entity.entity_type] = entity_types.get(entity.entity_type, 0) + 1
        
        content += "\nKey Entities Identified:\n"
        for e_type, count in entity_types.items():
            content += f"  - {e_type}: {count}\n"
        
        content += f"\n\nReport Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
        
        return {
            'content': content,
            'metadata': {
                'evidence_count': evidence_count,
                'evidence_by_type': evidence_by_type,
                'entity_types': entity_types
            }
        }
    
    def generate_evidence_report(self) -> Dict[str, Any]:
        """Generate detailed evidence analysis report"""
        content = f"""
EVIDENCE ANALYSIS REPORT
{'=' * 80}

Case: {self.case.case_number} - {self.case.name}
Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

EVIDENCE ITEMS:
{'=' * 80}

"""
        evidence_items = self.case.evidence_items.all().order_by('-timestamp')
        
        for idx, evidence in enumerate(evidence_items, 1):
            entities_str = ", ".join([f"{e.entity_type}: {e.value}" for e in evidence.entities.all()])
            
            content += f"""
{idx}. Evidence ID: {evidence.id}
   Type: {evidence.type}
   Source: {evidence.source}
   Device: {evidence.device}
   Timestamp: {evidence.timestamp}
   Content: {evidence.content[:200]}{'...' if len(evidence.content) > 200 else ''}
   Entities: {entities_str}
   Confidence: {evidence.confidence * 100:.1f}%
   {'—' * 40}
"""
        
        return {
            'content': content,
            'metadata': {
                'total_items': evidence_items.count()
            }
        }
    
    def generate_timeline_report(self) -> Dict[str, Any]:
        """Generate timeline analysis report"""
        content = f"""
TIMELINE ANALYSIS REPORT
{'=' * 80}

Case: {self.case.case_number} - {self.case.name}
Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

CHRONOLOGICAL TIMELINE:
{'=' * 80}

"""
        evidence_items = self.case.evidence_items.all().order_by('timestamp')
        
        for evidence in evidence_items:
            content += f"{evidence.timestamp} | {evidence.type.upper():10} | {evidence.source:30} | {evidence.content[:80]}\n"
        
        return {
            'content': content,
            'metadata': {
                'item_count': evidence_items.count(),
                'date_range': {
                    'start': str(evidence_items.first().timestamp) if evidence_items.exists() else None,
                    'end': str(evidence_items.last().timestamp) if evidence_items.exists() else None
                }
            }
        }
    
    def generate_network_report(self) -> Dict[str, Any]:
        """Generate network graph analysis report"""
        from evidence.models import Connection
        
        connections = Connection.objects.filter(
            source_entity__evidence__case=self.case
        ).distinct()
        
        entities = Entity.objects.filter(evidence__case=self.case).distinct()
        
        content = f"""
NETWORK GRAPH ANALYSIS REPORT
{'=' * 80}

Case: {self.case.case_number} - {self.case.name}
Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

Network Statistics:
- Total Entities: {entities.count()}
- Total Connections: {connections.count()}

Key Entities (by connection count):
"""
        # Find entities with most connections
        entity_connections = {}
        for entity in entities:
            conn_count = entity.outgoing_connections.count() + entity.incoming_connections.count()
            if conn_count > 0:
                entity_connections[entity] = conn_count
        
        sorted_entities = sorted(entity_connections.items(), key=lambda x: x[1], reverse=True)
        
        for entity, count in sorted_entities[:10]:
            content += f"  - {entity.entity_type}: {entity.value} ({count} connections)\n"
        
        content += "\nTop Connections:\n"
        for conn in connections.order_by('-strength')[:20]:
            content += f"  - {conn.source_entity.value} → {conn.target_entity.value} ({conn.connection_type}, strength: {conn.strength:.2f})\n"
        
        return {
            'content': content,
            'metadata': {
                'entity_count': entities.count(),
                'connection_count': connections.count(),
                'top_entities': [(e.value, c) for e, c in sorted_entities[:10]]
            }
        }
    
    def generate_final_report(self) -> Dict[str, Any]:
        """Generate comprehensive final report"""
        summary = self.generate_summary()
        evidence = self.generate_evidence_report()
        timeline = self.generate_timeline_report()
        network = self.generate_network_report()
        
        content = f"""
FINAL INVESTIGATION REPORT
{'=' * 80}

{summary['content']}

{'-' * 80}

{evidence['content']}

{'-' * 80}

{timeline['content']}

{'-' * 80}

{network['content']}

{'=' * 80}
END OF REPORT
"""
        
        return {
            'content': content,
            'metadata': {
                'summary': summary['metadata'],
                'evidence': evidence['metadata'],
                'timeline': timeline['metadata'],
                'network': network['metadata']
            }
        }

