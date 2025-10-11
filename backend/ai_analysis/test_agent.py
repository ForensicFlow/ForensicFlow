"""
Manual test script for FlowBot Agent Framework
Run this to test the agent's tool-use capabilities

Usage:
    python manage.py shell < ai_analysis/test_agent.py
"""

from ai_analysis.ai_service import AIService, ConversationManager
from ai_analysis.tools import ToolRegistry
from evidence.models import Evidence
from cases.models import Case
import json


def test_conversation_manager():
    """Test ConversationManager context tracking"""
    print("\n" + "="*60)
    print("TEST 1: Conversation Manager")
    print("="*60)
    
    conv_manager = ConversationManager(max_exchanges=5)
    
    # Add some exchanges
    conv_manager.add_exchange(
        "Find crypto transactions",
        "I found 3 crypto transactions involving wallet 0x742d35..."
    )
    conv_manager.add_exchange(
        "Show me those",
        "Here are the crypto transactions: Evidence #123, #124, #125"
    )
    
    # Get context summary
    context = conv_manager.get_context_summary()
    print("\n📝 Context Summary:")
    print(context)
    
    # Check entity tracking
    print("\n🏷️ Tracked Entities:")
    for entity_id, data in conv_manager.tracked_entities.items():
        print(f"  - {data['type']}: {data['value']} (mentioned {data['mentions']}x)")
    
    print("\n✅ Conversation Manager test passed!\n")


def test_tool_registry():
    """Test ToolRegistry with sample data"""
    print("\n" + "="*60)
    print("TEST 2: Tool Registry")
    print("="*60)
    
    # Sample evidence data
    sample_evidence = [
        {
            'id': '1',
            'content': 'WhatsApp message: Meet at warehouse',
            'source': 'WhatsApp',
            'timestamp': '2024-03-15T14:30:00Z',
            'device': 'iPhone 12',
            'type': 'message',
            'entities': [
                {'type': 'location', 'value': 'warehouse'}
            ]
        },
        {
            'id': '2',
            'content': 'Call to +1234567890',
            'source': 'Call Log',
            'timestamp': '2024-03-15T15:00:00Z',
            'device': 'iPhone 12',
            'type': 'call',
            'entities': [
                {'type': 'phone', 'value': '+1234567890'}
            ]
        },
        {
            'id': '3',
            'content': 'Bitcoin transfer: 0.5 BTC to 0x742d35Cc',
            'source': 'Crypto Wallet',
            'timestamp': '2024-03-15T16:00:00Z',
            'device': 'Desktop PC',
            'type': 'transaction',
            'entities': [
                {'type': 'crypto', 'value': '0x742d35Cc'}
            ]
        }
    ]
    
    tool_registry = ToolRegistry(evidence_data=sample_evidence, case_id='test-case')
    
    # Test 1: Search Evidence
    print("\n🔍 Testing search_evidence tool:")
    search_result = tool_registry.execute_tool('search_evidence', {
        'query': 'bitcoin',
        'limit': 10
    })
    print(f"  Success: {search_result['success']}")
    print(f"  Found: {search_result['data']['count']} items")
    
    # Test 2: Generate Timeline
    print("\n📅 Testing generate_timeline tool:")
    timeline_result = tool_registry.execute_tool('generate_timeline', {})
    print(f"  Success: {timeline_result['success']}")
    print(f"  Events: {timeline_result['data']['event_count']}")
    
    # Test 3: Generate Network Graph
    print("\n🕸️ Testing generate_network_graph tool:")
    graph_result = tool_registry.execute_tool('generate_network_graph', {})
    print(f"  Success: {graph_result['success']}")
    print(f"  Nodes: {graph_result['data']['node_count']}")
    print(f"  Edges: {graph_result['data']['edge_count']}")
    
    # Test 4: Analyze Pattern
    print("\n📊 Testing analyze_pattern tool:")
    pattern_result = tool_registry.execute_tool('analyze_pattern', {
        'evidence_ids': ['1', '2', '3'],
        'analysis_type': 'frequency'
    })
    print(f"  Success: {pattern_result['success']}")
    print(f"  Findings: {len(pattern_result['data']['findings'])}")
    
    # Test 5: Get Entity Details
    print("\n🏷️ Testing get_entity_details tool:")
    entity_result = tool_registry.execute_tool('get_entity_details', {
        'entity_type': 'crypto',
        'entity_value': '0x742d35Cc'
    })
    print(f"  Success: {entity_result['success']}")
    print(f"  Mentions: {entity_result['data']['mentions']}")
    
    print("\n✅ Tool Registry test passed!\n")
    
    # Print execution log
    print("\n📋 Execution Log:")
    for log_entry in tool_registry.execution_log:
        print(f"  - {log_entry['tool']}: success={log_entry['success']}")


def test_agent_with_real_data():
    """Test agent with real database data (if available)"""
    print("\n" + "="*60)
    print("TEST 3: Agent with Real Data")
    print("="*60)
    
    # Try to get a real case
    try:
        case = Case.objects.first()
        if not case:
            print("\n⚠️ No cases found in database. Skipping real data test.")
            return
        
        print(f"\n📁 Using case: {case.name} (ID: {case.id})")
        
        # Get evidence
        evidence_qs = Evidence.objects.filter(case=case)[:20]
        evidence_data = []
        
        for item in evidence_qs:
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
        
        print(f"📊 Loaded {len(evidence_data)} evidence items")
        
        # Test agent
        ai_service = AIService()
        
        # Test query 1: Simple search
        print("\n🤖 Testing query: 'Find all messages'")
        summary, confidence, embedded = ai_service.process_query_with_agent(
            "Find all messages",
            evidence_data,
            case_id=str(case.id)
        )
        print(f"  Confidence: {confidence:.2f}")
        print(f"  Embedded component: {embedded['type'] if embedded else 'None'}")
        print(f"  Response preview: {summary[:200]}...")
        
        # Test query 2: Network graph request
        print("\n🤖 Testing query: 'Show me a network graph'")
        summary2, confidence2, embedded2 = ai_service.process_query_with_agent(
            "Show me a network graph of connections",
            evidence_data,
            case_id=str(case.id)
        )
        print(f"  Confidence: {confidence2:.2f}")
        print(f"  Embedded component: {embedded2['type'] if embedded2 else 'None'}")
        if embedded2 and embedded2.get('type') == 'network':
            data = embedded2.get('data', {})
            print(f"  Graph nodes: {len(data.get('nodes', []))}")
            print(f"  Graph edges: {len(data.get('links', []))}")
        
        print("\n✅ Agent with real data test completed!\n")
        
    except Exception as e:
        print(f"\n❌ Error testing with real data: {e}")
        import traceback
        traceback.print_exc()


def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("🧪 FLOWBOT AGENT FRAMEWORK TEST SUITE")
    print("="*60)
    
    try:
        test_conversation_manager()
    except Exception as e:
        print(f"❌ ConversationManager test failed: {e}")
    
    try:
        test_tool_registry()
    except Exception as e:
        print(f"❌ ToolRegistry test failed: {e}")
    
    try:
        test_agent_with_real_data()
    except Exception as e:
        print(f"❌ Agent test failed: {e}")
    
    print("\n" + "="*60)
    print("✅ TEST SUITE COMPLETED")
    print("="*60 + "\n")


if __name__ == '__main__':
    main()

