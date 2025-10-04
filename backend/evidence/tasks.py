"""
Celery tasks for evidence processing
"""
from celery import shared_task
from django.core.files.storage import default_storage
from .ufdr_parser import UFDRParser
from .models import Evidence, Entity
from cases.models import CaseFile
import hashlib
import os


@shared_task
def process_ufdr_file(case_file_id):
    """
    Process a UFDR file asynchronously
    """
    case_file = None
    try:
        case_file = CaseFile.objects.get(id=case_file_id)
        case_file.processing_status = 'processing'
        case_file.save()
        
        # Get the file path
        file_path = case_file.file.path
        
        # Parse the UFDR file
        parser = UFDRParser(file_path)
        evidence_items = parser.parse()
        
        # Create Evidence objects
        for idx, item_data in enumerate(evidence_items):
            # Generate stable ID using critical fields only
            timestamp = item_data.get('timestamp', '')
            content = item_data.get('content', '')
            sha256 = item_data.get('sha256', '')
            stable_str = f"{timestamp}{content}{sha256}{idx}"
            evidence_id = f"{case_file.case.id}_ev_{hashlib.md5(stable_str.encode()).hexdigest()[:12]}"
            
            # Extract entity data
            entities_data = item_data.pop('entities', [])
            
            # Extract location
            latitude = item_data.pop('latitude', None)
            longitude = item_data.pop('longitude', None)
            
            # Extract device info
            device = item_data.pop('device', case_file.original_filename)
            
            # Create Evidence (skip if already exists)
            evidence, created = Evidence.objects.get_or_create(
                id=evidence_id,
                defaults={
                    'case': case_file.case,
                    'device': device,
                    'latitude': latitude,
                    'longitude': longitude,
                    **item_data
                }
            )
            
            # Create Entities only if evidence was newly created
            if created:
                for entity_data in entities_data:
                    Entity.objects.create(
                        evidence=evidence,
                        entity_type=entity_data.get('type', 'Unknown'),
                        value=entity_data.get('value', ''),
                        confidence=entity_data.get('confidence', 1.0)
                    )
        
        # Mark as processed
        case_file.processed = True
        case_file.processing_status = 'completed'
        case_file.save()
        
        return f"Processed {len(evidence_items)} evidence items"
        
    except CaseFile.DoesNotExist:
        error_msg = f"CaseFile with id {case_file_id} not found"
        print(error_msg)
        raise Exception(error_msg)
    except Exception as e:
        import traceback
        error_msg = f'failed: {str(e)}'
        print(f"Exception in process_ufdr_file: {error_msg}")
        print(f"Full traceback:\n{traceback.format_exc()}")
        if case_file:
            case_file.processing_status = error_msg[:250]
            case_file.save()
        raise e


@shared_task
def analyze_entity_connections(case_id):
    """
    Analyze connections between entities in a case
    """
    from .models import Connection
    from cases.models import Case
    
    case = Case.objects.get(id=case_id)
    evidence_items = case.evidence_items.all()
    
    # Build entity graph
    entity_map = {}  # Map of entity value to entity object
    
    for evidence in evidence_items:
        entities = evidence.entities.all()
        
        # Map entities by their value
        for entity in entities:
            key = f"{entity.entity_type}:{entity.value}"
            if key not in entity_map:
                entity_map[key] = entity
        
        # Create connections between entities in the same evidence
        entities_list = list(entities)
        for i, source in enumerate(entities_list):
            for target in entities_list[i+1:]:
                # Don't connect entities of the same type
                if source.entity_type != target.entity_type:
                    connection, created = Connection.objects.get_or_create(
                        source_entity=source,
                        target_entity=target,
                        connection_type='co_occurred',
                        defaults={'strength': 0.5}
                    )
                    if not created:
                        # Increase strength if connection already exists
                        connection.strength = min(1.0, connection.strength + 0.1)
                        connection.save()
                    
                    connection.evidence_items.add(evidence)
    
    return f"Analyzed connections for {len(entity_map)} unique entities"

