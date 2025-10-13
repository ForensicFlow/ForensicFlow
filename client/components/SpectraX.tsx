import React, { useState, useRef, useEffect } from 'react';
import { aiApi, evidenceApi, reportItemsApi, chatSessionsApi } from '@/lib/api.ts';
import { EvidenceSnippet, ChatSession, ChatMessage as ChatMessageType } from '../types';
import {
  PaperAirplaneIcon,
  DocumentDownloadIcon,
  ClockIcon,
  ShareIcon,
  SparklesIcon,
  UserIcon,
  CogIcon,
  ExclamationTriangleIcon
} from './icons';
import { useDemo } from '@/contexts/DemoContext.tsx';
import { useToast } from '@/contexts/ToastContext.tsx';
import MiniTimeline from './MiniTimeline';
import ChatBubbleView from './ChatBubbleView';
import MiniMap from './MiniMap';
import MarkdownRenderer from './MarkdownRenderer';
import NetworkGraph from './NetworkGraph';

interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  evidence?: EvidenceSnippet[];
  actions?: ChatAction[];
  loading?: boolean;
  suggested_followups?: string[];
  embedded_component?: {
    type: 'timeline' | 'map' | 'network' | 'chat_bubbles';
    data: any;
  };
}

interface ChatAction {
  type: 'download' | 'timeline' | 'network' | 'evidence';
  label: string;
  data?: any;
}

interface SpectraXProps {
  caseId: string;
  onShowTimeline?: () => void;
  onShowNetwork?: () => void;
  onShowEvidence?: (evidence: EvidenceSnippet[]) => void;
  onHighlightEvidence?: (evidenceId: string) => void; // New: Jump to and highlight specific evidence
  onHypothesisModeChange?: (isActive: boolean) => void; // New: Notify parent of hypothesis mode state
}

const SpectraX: React.FC<SpectraXProps> = ({
  caseId,
  onShowTimeline,
  onShowNetwork,
  onShowEvidence,
  onHighlightEvidence,
  onHypothesisModeChange
}) => {
  const { isDemoMode, getSampleCaseEvidence } = useDemo();
  const { success, error } = useToast();
  const [autocompleteOptions, setAutocompleteOptions] = useState<string[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [welcomeSuggestions, setWelcomeSuggestions] = useState<string[]>([]);
  const [conversationHistory, setConversationHistory] = useState<Array<{query: string, response: string}>>([]);
  const [hypothesisMode, setHypothesisMode] = useState(false);
  const [hypothesisText, setHypothesisText] = useState('');
  const [testingHypothesis, setTestingHypothesis] = useState(false);
  const [chatHistoryCollapsed, setChatHistoryCollapsed] = useState(false);
  
  // Chat session state
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [showSessionList, setShowSessionList] = useState(false);
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'bot',
      content: `👋 Hi! I'm **SpectraX**, your AI forensic assistant for this case. I can help you analyze evidence using natural language queries.

Try asking me:
• "Show me all chats containing crypto addresses"
• "Show me a network graph of connections"
• "Create a timeline of events on March 15th"
• "What patterns do you see in the communications?"
${isDemoMode ? `
**Demo Mode Active** 🎭

I'm currently using sample evidence data for demonstration. Try these demo queries:
• "crypto" - Find cryptocurrency-related evidence
• "show network graph" - See entity connections
• "create a timeline" - View events chronologically
• "foreign" - Search for international connections

The demo includes 3 sample cases with realistic forensic evidence for testing!` : `
**Agent Mode Enabled** ✨

With Gemini AI configured, I can use advanced tools to visualize data, analyze patterns, and maintain conversation context throughout our investigation.`}

What would you like to investigate?`,
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Network graph state - track per message
  const [networkGraphStates, setNetworkGraphStates] = useState<Record<string, { showGraph: boolean; isFullScreen: boolean }>>({});

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat sessions on mount
  useEffect(() => {
    loadChatSessions();
  }, [caseId]);

  // Load case analysis for proactive suggestions
  useEffect(() => {
    const loadCaseAnalysis = async () => {
      if (!isDemoMode) {
        try {
          const analysis = await aiApi.analyzeCaseOnLoad(caseId);
          const suggestions = [];

          if (analysis.has_crypto_addresses) {
            suggestions.push('Show me all cryptocurrency transactions');
          }
          if (analysis.has_gps_data) {
            suggestions.push('Plot all device locations on a map');
          }
          if (analysis.has_foreign_numbers) {
            suggestions.push('List all international communications');
          }
          if (analysis.has_time_gaps) {
            suggestions.push('Show me any unusual gaps in activity');
          }
          if (analysis.has_financial_data) {
            suggestions.push('Find all financial transactions');
          }

          setWelcomeSuggestions(suggestions);
        } catch (error) {
          console.error('Error loading case analysis:', error);
        }
      }
    };

    loadCaseAnalysis();
  }, [caseId, isDemoMode]);

  // Chat session management functions
  const loadChatSessions = async () => {
    if (isDemoMode) {
      setLoadingSessions(false);
      return; // Skip in demo mode
    }

    try {
      setLoadingSessions(true);
      const sessionData = await chatSessionsApi.list(caseId);
      setSessions(sessionData);

      // Auto-load most recent session or create new one
      if (sessionData.length > 0) {
        const mostRecent = sessionData[0];
        await loadSession(mostRecent.id);
      } else {
        await createNewSession();
      }
    } catch (err) {
      console.error('Error loading sessions:', err);
      // Create new session as fallback
      await createNewSession();
    } finally {
      setLoadingSessions(false);
    }
  };

  const createNewSession = async () => {
    if (isDemoMode) return;

    try {
      const newSession = await chatSessionsApi.create(caseId, hypothesisMode, hypothesisText);
      setActiveSessionId(newSession.id);
      setSessions(prev => [newSession, ...prev]);
      
      // Keep welcome message but clear chat history
      setMessages([
        {
          id: '1',
          type: 'bot',
          content: `👋 Hi! I'm **SpectraX**, your AI forensic assistant for this case. I can help you analyze evidence using natural language queries.


Try asking me:
• "Show me all chats containing crypto addresses"
• "Show me a network graph of connections"
• "Create a timeline of events"
• "What patterns do you see?"

What would you like to investigate?`,
          timestamp: new Date(),
        }
      ]);
      
      success('New chat session created');
    } catch (err) {
      console.error('Error creating session:', err);
      error('Failed to create new session');
    }
  };

  const loadSession = async (sessionId: string) => {
    if (isDemoMode) return;

    try {
      const session = await chatSessionsApi.get(sessionId);
      setActiveSessionId(sessionId);
      setHypothesisMode(session.hypothesis_mode);
      setHypothesisText(session.hypothesis_text);

      // Convert stored messages to ChatMessage format
      const loadedMessages: ChatMessage[] = session.messages?.map(msg => ({
        id: msg.id,
        type: msg.message_type as 'user' | 'bot',
        content: msg.content,
        timestamp: new Date(msg.created_at),
        // Don't set evidence property for loaded messages as we only have IDs, not full objects
        // The content already includes the evidence information
        ...(msg.metadata || {})
      })) || [];

      // Add welcome message if no messages yet
      if (loadedMessages.length === 0) {
        loadedMessages.unshift({
          id: '1',
          type: 'bot',
          content: `👋 Hi! I'm **SpectraX**, your AI forensic assistant for this case.

**🤖 Enhanced AI Agent:** I can generate visualizations, maintain context, and use specialized tools to help with your investigation.`,
          timestamp: new Date(),
        });
      }

      setMessages(loadedMessages);
    } catch (err) {
      console.error('Error loading session:', err);
      error('Failed to load session');
    }
  };

  const saveMessageToSession = async (message: ChatMessage) => {
    if (isDemoMode || !activeSessionId) return;

    try {
      await chatSessionsApi.addMessage(activeSessionId, {
        message_type: message.type,
        content: message.content,
        metadata: {
          ...(message.embedded_component && { embedded_component: message.embedded_component }),
          ...(message.suggested_followups && { suggested_followups: message.suggested_followups }),
        },
        evidence_ids: message.evidence?.map(e => e.id) || [],
        confidence_score: message.actions?.[0]?.data?.confidence,
        processing_time: message.actions?.[0]?.data?.processing_time,
      });

      // Reload sessions to get updated title
      const sessionData = await chatSessionsApi.list(caseId);
      setSessions(sessionData);
    } catch (err) {
      console.error('Error saving message:', err);
      // Don't show error to user, message is still in UI
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    const loadingMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      type: 'bot',
      content: '🔍 Analyzing evidence...',
      timestamp: new Date(),
      loading: true,
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      console.log('SpectraX: Sending query:', inputValue, 'for case:', caseId, 'in demo mode:', isDemoMode);

      let response, evidence, actions, botResponse;

      if (isDemoMode) {
        // Use demo data instead of API calls
        console.log('SpectraX: Using demo mode response');

        // Get sample evidence for this case
        const sampleEvidence = getSampleCaseEvidence(caseId);
        console.log('SpectraX: Found sample evidence:', sampleEvidence.length, 'items');

        // Filter evidence based on query (simple keyword matching for demo)
        const filteredEvidence = sampleEvidence.filter(item =>
          item.content.toLowerCase().includes(inputValue.toLowerCase()) ||
          item.entities.some(entity =>
            entity.value.toLowerCase().includes(inputValue.toLowerCase())
          )
        );

        console.log('SpectraX: Filtered evidence:', filteredEvidence.length, 'items');

        // Generate demo response
        response = {
          summary: `I found ${filteredEvidence.length} evidence items related to "${inputValue}". This is a demo response based on sample data.`,
          confidence: 0.85,
          evidence: filteredEvidence
        };

        evidence = filteredEvidence;
        actions = generateActions(inputValue, evidence);
        botResponse = formatAIResponse(response, evidence);
      } else {
        // Call AI API with the user's query AND CONVERSATION HISTORY
        response = await aiApi.ask(inputValue, caseId, {
          conversation_history: conversationHistory
        });
        console.log('SpectraX: AI API Response:', response);
        console.log('SpectraX: Sent conversation history:', conversationHistory.length, 'exchanges');

        // Get evidence results
        evidence = response.evidence || [];
        console.log('SpectraX: Evidence found:', evidence.length, 'items');

        // Generate action buttons based on query and results
        actions = generateActions(inputValue, evidence);
        console.log('SpectraX: Generated actions:', actions);

        // Format the AI response
        botResponse = formatAIResponse(response, evidence);
        console.log('SpectraX: Formatted response:', botResponse);
      }

      const botMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        type: 'bot',
        content: botResponse,
        timestamp: new Date(),
        evidence: evidence.slice(0, 3), // Show top 3 results
        actions,
        suggested_followups: response.suggested_followups || [],
        embedded_component: response.embedded_component || undefined  // Add embedded visualization
      };

      setMessages(prev => prev.slice(0, -1).concat([botMessage]));
      
      // Save messages to session
      await saveMessageToSession(userMessage);
      await saveMessageToSession(botMessage);
      
      // Update conversation history (keep last 10 exchanges)
      setConversationHistory(prev => {
        const newHistory = [
          ...prev,
          {
            query: inputValue,
            response: response.summary || botResponse
          }
        ];
        // Keep only last 10 exchanges to manage context window
        return newHistory.slice(-10);
      });
    } catch (error) {
      console.error('SpectraX error:', error);

      // Check for specific error types
      const errorText = error instanceof Error ? error.message : 'Unknown error';
      let userFriendlyMessage = '';

      if (isDemoMode) {
        // Handle demo mode errors differently
        if (errorText.includes('Sample case not found')) {
          userFriendlyMessage = `🔍 **Demo Case Not Found**

The case you're trying to analyze (ID: "${caseId}") doesn't exist in the demo data.

**Available demo cases:**
- **demo-case-1**: Operation Dark Trade
- **demo-case-2**: Corporate Espionage - TechCorp
- **demo-case-3**: Financial Fraud Investigation

Please try one of these case IDs or go back to the Cases tab to select a different case.`;
        } else {
          userFriendlyMessage = `❌ **Demo Mode Error**

I encountered an error while searching the demo evidence.

**Error:** ${errorText}

**Debug Info:**
- Query: "${inputValue}"
- Case ID: "${caseId}"
- Mode: Demo Mode

This is likely a demo data issue. Please try a different query or case.`;
        }
      } else {
        // Handle production mode errors
        if (errorText.includes('Case not found') || errorText.includes('404')) {
          userFriendlyMessage = `🔍 **Case Not Found**

The case you're trying to analyze (ID: "${caseId}") doesn't exist in the database yet.

**To fix this:**
1. Go back to the **Cases** tab
2. Create a new case using the "Create New Case" button
3. Upload some UFDR files to the case
4. Return to this FlowBot tab to analyze the evidence

**Note:** This might happen if the database is empty or if you're using a case ID that hasn't been created yet.`;
        } else if (errorText.includes('500') || errorText.includes('Internal Server Error')) {
          userFriendlyMessage = `⚠️ **Server Error**

There was an internal server error while processing your query.

**Possible causes:**
- The backend server might be having issues
- Database connection problems
- Missing API configuration

**Debug Info:**
- Query: "${inputValue}"
- Case ID: "${caseId}"
- Error: ${errorText}

Please check the server logs for more details.`;
        } else {
          userFriendlyMessage = `❌ Sorry, I encountered an error while analyzing your query. Please try again or rephrase your question.

**Error:** ${errorText}

**Debug Info:**
- Query: "${inputValue}"
- Case ID: "${caseId}"
- Error Type: ${error?.constructor?.name || 'Unknown'}

Please check the browser console for more details.`;
        }
      }
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        type: 'bot',
        content: userFriendlyMessage,
        timestamp: new Date(),
      };
      setMessages(prev => prev.slice(0, -1).concat([errorMessage]));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinResponse = async (message: ChatMessage, query: string) => {
    try {
      // Extract evidence IDs from the message if available
      const evidenceIds = message.evidence?.map(e => e.id) || [];
      
      // Create a title from the first line of the response
      const titleMatch = message.content.match(/^##\s+(.+)$/m) || 
                         message.content.match(/^\*\*(.+?)\*\*$/m);
      const title = titleMatch ? titleMatch[1].substring(0, 100) : `AI Analysis: ${query.substring(0, 50)}...`;
      
      await reportItemsApi.pinAIResponse({
        case_id: caseId,
        title: title,
        content: message.content,
        evidence_ids: evidenceIds,
        section: 'findings',
        metadata: {
          query: query,
          timestamp: message.timestamp.toISOString(),
        },
      });
      
      success('✅ Pinned to report! View it in the Reports tab.');
    } catch (err: any) {
      console.error('Error pinning response:', err);
      error('Failed to pin response to report. Please try again.');
    }
  };

  const handleTestHypothesis = async () => {
    if (!hypothesisText.trim()) {
      error('Please enter a hypothesis to test');
      return;
    }

    if (hypothesisText.length < 10) {
      error('Hypothesis is too short. Please provide a clear statement.');
      return;
    }

    setTestingHypothesis(true);

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: `🧪 **Test Hypothesis:** ${hypothesisText}`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    // Add loading message
    const loadingMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      type: 'bot',
      content: '🔬 Testing your hypothesis against case evidence...',
      timestamp: new Date(),
      loading: true,
    };
    setMessages(prev => [...prev, loadingMessage]);

    try {
      const result = await aiApi.testHypothesis(caseId, hypothesisText);

      // Format the response
      let conclusionEmoji = '⚖️';
      let conclusionColor = 'text-yellow-400';
      
      if (result.conclusion === 'likely') {
        conclusionEmoji = '✅';
        conclusionColor = 'text-green-400';
      } else if (result.conclusion === 'unlikely') {
        conclusionEmoji = '❌';
        conclusionColor = 'text-red-400';
      }

      const responseContent = `## 🧪 Hypothesis Testing Results

**Your Hypothesis:** "${result.hypothesis}"

**Conclusion:** ${conclusionEmoji} <span class="${conclusionColor} font-bold">${result.conclusion.toUpperCase()}</span>  
**Confidence:** ${(result.confidence * 100).toFixed(0)}%

---

${result.analysis}

---

**Evidence Summary:**
- **Total Evidence Analyzed:** ${result.evidence_count.total} items
- **Supporting Evidence:** ${result.evidence_count.supporting} items
- **Contradictory Evidence:** ${result.evidence_count.contradictory} items

${result.supporting_evidence.length > 0 ? `
### 🔍 Key Supporting Evidence

${result.supporting_evidence.map((ev: any, idx: number) => `
${idx + 1}. **Evidence #${ev.id}** - ${ev.source}  
   ${ev.content.substring(0, 150)}...
`).join('\n')}
` : ''}

> **💡 Tip:** Click "Pin to Report" to save this hypothesis test result to your case report.`;

      const botMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        type: 'bot',
        content: responseContent,
        timestamp: new Date(),
        evidence: result.supporting_evidence || [],
      };

      setMessages(prev => prev.slice(0, -1).concat([botMessage]));
      setHypothesisText(''); // Clear the input
      success('✅ Hypothesis testing complete!');
    } catch (err: any) {
      console.error('Error testing hypothesis:', err);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        type: 'bot',
        content: `❌ **Error Testing Hypothesis**

Failed to test your hypothesis: ${err.message || 'Unknown error'}

Please try again or rephrase your hypothesis.`,
        timestamp: new Date(),
      };
      setMessages(prev => prev.slice(0, -1).concat([errorMessage]));
      error('Failed to test hypothesis. Please try again.');
    } finally {
      setTestingHypothesis(false);
    }
  };

  const generateActions = (query: string, evidence: EvidenceSnippet[]): ChatAction[] => {
    const actions: ChatAction[] = [];
    
    if (evidence.length > 0) {
      actions.push({
        type: 'download',
        label: `Download Evidence Report (${evidence.length} items)`,
        data: evidence
      });
      
      actions.push({
        type: 'evidence',
        label: 'View All Evidence',
        data: evidence
      });
    }

    // Add timeline action for time-related queries
    if (query.toLowerCase().includes('time') || 
        query.toLowerCase().includes('when') || 
        query.toLowerCase().includes('date') ||
        query.toLowerCase().includes('chronological')) {
      actions.push({
        type: 'timeline',
        label: 'View in Timeline',
      });
    }

    // Add network action for relationship queries
    if (query.toLowerCase().includes('connect') || 
        query.toLowerCase().includes('link') || 
        query.toLowerCase().includes('relationship') ||
        query.toLowerCase().includes('network') ||
        query.toLowerCase().includes('between')) {
      actions.push({
        type: 'network',
        label: 'Show Network Graph',
      });
    }

    return actions;
  };

  const formatAIResponse = (response: any, evidence: EvidenceSnippet[]): string => {
    const summary = response.summary || response.ai_summary || '';
    const count = evidence.length;
    
    if (count === 0) {
      return `🔍 **No Evidence Found**

${summary || 'No evidence items match your query criteria.'}

Try refining your search or using different keywords.`;
    }

    // Fallback response if no AI summary is available
    const fallbackSummary = summary || `I found ${count} evidence items that match your query. The results include various types of forensic data that may be relevant to your investigation.`;

    return `🔍 **Analysis Complete**

${fallbackSummary}

**Found ${count} relevant evidence items** with confidence score: ${Math.round((response.confidence || 0.8) * 100)}%`;
  };

  const handleAction = (action: ChatAction) => {
    console.log('handleAction called with:', action);
    
    try {
      switch (action.type) {
        case 'download':
          console.log('Download action triggered');
          // Download evidence report
          success('Preparing download...');
          // TODO: Implement actual download functionality
          setTimeout(() => {
            alert('Download feature: This would download the evidence report with 758 items');
          }, 100);
          break;
          
        case 'timeline':
          console.log('Timeline action triggered');
          success('Opening timeline view...');
          if (onShowTimeline) {
            onShowTimeline();
          } else {
            console.warn('onShowTimeline callback not provided');
            alert('Timeline view not available - callback missing');
          }
          break;
          
        case 'network':
          console.log('Network action triggered');
          success('Opening network graph...');
          if (onShowNetwork) {
            onShowNetwork();
          } else {
            console.warn('onShowNetwork callback not provided');
            alert('Network view not available - callback missing');
          }
          break;
          
        case 'evidence':
          console.log('Evidence action triggered with data:', action.data);
          success('Loading evidence...');
          if (onShowEvidence) {
            onShowEvidence(action.data);
          } else {
            console.warn('onShowEvidence callback not provided');
            alert('Evidence view not available - callback missing');
          }
          break;
          
        default:
          console.warn('Unknown action type:', action.type);
          error('Unknown action type');
      }
    } catch (err) {
      console.error('Error handling action:', err);
      error('Failed to perform action');
    }
  };

  const handleInputChange = async (value: string) => {
    setInputValue(value);
    
    // Don't show autocomplete in demo mode or if query is too short
    if (isDemoMode || value.length < 10) {
      setShowAutocomplete(false);
      return;
    }
    
    // Detect query patterns and suggest entities
    const patterns = {
      contact: /show.*(?:chats?|messages?|communications?).*with|find.*(?:messages?|communications?).*(?:to|from)|who.*(?:talked|communicated|messaged)/i,
      transaction: /(?:transactions?|transfers?|payments?).*(?:to|from)|crypto.*(?:to|from)|send.*(?:money|bitcoin|crypto)/i,
      location: /where.*was|location.*of|places.*visited|gps.*data/i,
      crypto: /crypto.*address|wallet.*address|bitcoin.*(?:to|from)/i,
      device: /device|phone|computer|laptop|from.*(?:device|phone)/i,
    };
    
    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(value)) {
        try {
          const data = await aiApi.getAutocompleteEntities(caseId, type === 'contact' ? undefined : type);
          
          const suggestions: string[] = [];
          
          // Build autocomplete suggestions based on entity type
          if (type === 'contact' && data.contacts) {
            data.contacts.forEach((contact: string) => {
              suggestions.push(`${value.trim()} "${contact}"`);
            });
          } else if (type === 'device' && data.devices) {
            data.devices.forEach((device: string) => {
              suggestions.push(`${value.trim()} "${device}"`);
            });
          } else if (data.entities && data.entities.length > 0) {
            data.entities.slice(0, 5).forEach((entity: any) => {
              suggestions.push(`${value.trim()} ${entity.value}`);
            });
          }
          
          if (suggestions.length > 0) {
            setAutocompleteOptions(suggestions);
            setShowAutocomplete(true);
          } else {
            setShowAutocomplete(false);
          }
        } catch (error) {
          console.error('Autocomplete error:', error);
          setShowAutocomplete(false);
        }
        return;
      }
    }
    
    setShowAutocomplete(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    } else if (e.key === 'Escape') {
      setShowAutocomplete(false);
    }
  };

  // Global keyboard handler for ESC to exit hypothesis mode
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && hypothesisMode && !testingHypothesis) {
        e.preventDefault();
        setHypothesisMode(false);
        setHypothesisText('');
        setChatHistoryCollapsed(false);
        onHypothesisModeChange?.(false);
      }
    };

    if (hypothesisMode) {
      window.addEventListener('keydown', handleEscapeKey);
      return () => window.removeEventListener('keydown', handleEscapeKey);
    }
  }, [hypothesisMode, testingHypothesis, onHypothesisModeChange]);

  return (
    <div className="flex h-full bg-slate-900/50 gap-4">
      {/* Session List Sidebar */}
      {showSessionList && !isDemoMode && (
        <div className="w-72 flex-shrink-0 bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden flex flex-col animate-slideIn">
          <div className="p-4 border-b border-slate-700 bg-slate-800 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <ClockIcon className="h-5 w-5 text-cyan-400" />
              <h3 className="font-semibold text-white">Chat History</h3>
            </div>
            <button
              onClick={() => setShowSessionList(false)}
              className="p-1 hover:bg-slate-700 rounded transition-colors"
              title="Hide sessions"
            >
              <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="flex-shrink-0 p-3 border-b border-slate-700">
            <button
              onClick={createNewSession}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white rounded-lg transition-all shadow-lg font-medium"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
            {loadingSessions ? (
              <div className="flex items-center justify-center py-8 text-slate-400">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-400"></div>
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                No chat history yet
              </div>
            ) : (
              sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => loadSession(session.id)}
                  className={`w-full text-left p-3 rounded-lg transition-all group ${
                    activeSessionId === session.id
                      ? 'bg-cyan-600/20 border border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                      : 'bg-slate-800/50 border border-slate-700 hover:bg-slate-700/50 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-medium text-sm truncate ${
                        activeSessionId === session.id ? 'text-cyan-300' : 'text-white'
                      }`}>
                        {session.title || 'New Chat Session'}
                      </h4>
                      {session.message_preview && (
                        <p className="text-xs text-slate-400 mt-1 truncate">
                          {session.message_preview}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                        <span>{session.message_count} messages</span>
                        <span>•</span>
                        <span>{new Date(session.last_message_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {activeSessionId === session.id && (
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
                      </div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-slate-700 p-4">
          {/* Back button - Always visible or only in Hypothesis Mode */}
          {hypothesisMode && (
            <div className="mb-3 flex items-center border-b border-slate-700/50 pb-3">
              <button
                onClick={() => {
                  setHypothesisMode(false);
                  setHypothesisText('');
                  setChatHistoryCollapsed(false);
                  onHypothesisModeChange?.(false);
                }}
                className="flex items-center gap-2 px-4 py-2.5 text-slate-200 hover:text-white bg-slate-800/50 hover:bg-slate-700 rounded-lg transition-all group border border-slate-700 hover:border-slate-600"
                aria-label="Exit Hypothesis Mode"
                title="Exit Hypothesis Mode (or press ESC)"
              >
                <svg className="h-5 w-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="text-sm font-semibold">Exit Hypothesis Mode</span>
                <kbd className="hidden sm:inline-block px-2 py-1 text-xs bg-slate-700 border border-slate-600 rounded ml-2 font-mono">ESC</kbd>
              </button>
            </div>
          )}
          <div className="flex items-center gap-3">
            {!showSessionList && !isDemoMode && (
              <button
                onClick={() => setShowSessionList(true)}
                className="flex-shrink-0 p-2 hover:bg-slate-800 rounded-lg transition-colors"
                title="Show chat history"
              >
                <ClockIcon className="h-5 w-5 text-slate-400" />
              </button>
            )}
            <div className="flex-shrink-0 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 p-2">
              <SparklesIcon className="h-6 w-6 text-cyan-300" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-white">SpectraX AI Assistant</h2>
                {isDemoMode && (
                  <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs font-medium rounded-full">
                    DEMO MODE
                  </span>
                )}
                {!isDemoMode && activeSessionId && (
                  <span className="px-2 py-1 bg-cyan-500/20 text-cyan-300 text-xs font-medium rounded-full">
                    SESSION ACTIVE
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-400">
                {isDemoMode
                  ? "Ask me anything - I'll search demo evidence for you"
                  : "Ask me anything about this case"
                }
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const newMode = !hypothesisMode;
                  setHypothesisMode(newMode);
                  // Auto-collapse chat history when entering hypothesis mode
                  if (newMode) {
                    setChatHistoryCollapsed(true);
                  }
                  // Notify parent component of hypothesis mode change
                  onHypothesisModeChange?.(newMode);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium ${
                  hypothesisMode
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-600'
                }`}
              title="Test an investigative hypothesis"
                aria-pressed={hypothesisMode}
                aria-label="Toggle Hypothesis Testing Mode"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              🧪 Hypothesis Mode
            </button>

              {/* Close button when in hypothesis mode */}
              {hypothesisMode && (
                <button
                  onClick={() => {
                    setHypothesisMode(false);
                    setHypothesisText('');
                    setChatHistoryCollapsed(false);
                    onHypothesisModeChange?.(false);
                  }}
                  className="p-2 text-slate-400 hover:text-white hover:bg-red-500/20 rounded-lg transition-all"
                  aria-label="Close Hypothesis Mode"
                  title="Close Hypothesis Mode"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
        </div>

      </div>

      {/* Hypothesis Mode Banner - Shown prominently at top of messages */}
      {hypothesisMode && (
        <div className="flex-shrink-0 mx-4 mt-4 mb-2">
          <div className="p-4 bg-gradient-to-r from-purple-900/40 to-purple-800/40 border border-purple-500/50 rounded-lg shadow-lg">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="w-6 h-6 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <h3 className="text-purple-200 font-semibold text-base flex items-center gap-2">
                    🧪 Hypothesis Testing Mode Active
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-purple-300/70">
                    <span className="hidden sm:inline">Press</span>
                    <kbd className="px-2 py-0.5 bg-purple-900/50 border border-purple-500/30 rounded text-purple-200 font-mono">ESC</kbd>
                    <span className="hidden sm:inline">to exit</span>
                  </div>
                </div>
                <p className="text-purple-300/90 text-sm mt-1.5 leading-relaxed">
                  Frame your investigative theory below, and I'll analyze the evidence to determine if it's supported, contradicted, or inconclusive.
                </p>
                <p className="text-purple-400/80 text-xs mt-2 font-mono bg-purple-900/30 rounded p-2 border border-purple-500/20">
                  Example: "The suspect planned the meeting at the warehouse" or "Contact A knew about the transaction before it occurred"
                </p>
              </div>
            </div>
          </div>
          
          {/* Toggle Button for Chat History */}
          <button
            onClick={() => setChatHistoryCollapsed(!chatHistoryCollapsed)}
            className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800/70 hover:bg-slate-700/70 border border-slate-600 hover:border-slate-500 rounded-lg text-slate-200 text-sm font-medium transition-all"
          >
            <svg 
              className={`w-4 h-4 transition-transform ${chatHistoryCollapsed ? '' : 'rotate-180'}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            {chatHistoryCollapsed ? '👁️ Show' : '🙈 Hide'} Chat History ({messages.length - 1} messages)
          </button>
        </div>
      )}

      {/* Messages */}
      <div className={`overflow-y-auto space-y-4 transition-all ${
        hypothesisMode 
          ? chatHistoryCollapsed 
            ? 'hidden' 
            : 'flex-shrink-0 max-h-64 opacity-60 p-4'
          : 'flex-1 p-4'
      }`}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.type === 'bot' && (
              <div className="flex-shrink-0 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 p-2">
                <CogIcon className="h-5 w-5 text-cyan-300" />
              </div>
            )}
            
            <div className={`max-w-[80%] ${message.type === 'user' ? 'order-2' : ''}`}>
              <div
                className={`rounded-2xl px-4 py-3 ${
                  message.type === 'user'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-800/50 text-slate-200 border border-slate-700'
                }`}
              >
                {message.type === 'bot' ? (
                  <MarkdownRenderer 
                    content={message.content}
                    onEvidenceClick={onHighlightEvidence}
                  />
                ) : (
                  <div className="text-sm text-white whitespace-pre-wrap">
                    {message.content}
                  </div>
                )}

                {/* Evidence Results */}
                {message.evidence && message.evidence.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-semibold text-cyan-300">Top Results:</p>
                    {message.evidence.map((evidence, index) => (
                      <div
                        key={evidence.id}
                        className="bg-slate-900/50 rounded-lg p-3 border border-slate-600"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white">
                              {index + 1}. {evidence.source}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                              {evidence.device} • {new Date(evidence.timestamp).toLocaleString()}
                            </p>
                            <p className="text-sm text-slate-300 mt-2 bg-slate-800/50 rounded p-2">
                              {evidence.content ? evidence.content.substring(0, 150) : 'No content available'}
                              {evidence.content && evidence.content.length > 150 ? '...' : ''}
                            </p>
                            {evidence.entities && evidence.entities.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {evidence.entities.slice(0, 3).map((entity, i) => (
                                  <span
                                    key={i}
                                    className="px-2 py-1 bg-cyan-500/20 text-cyan-300 text-xs rounded"
                                  >
                                    {entity.type}: {entity.value}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="ml-3 text-right">
                            <span className="text-xs text-green-400">
                              ✅ {Math.round(evidence.confidence * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick Action Buttons - Enhanced */}
                {message.type === 'bot' && message.id !== '1' && !message.loading && message.evidence && message.evidence.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-700/50">
                    <p className="text-xs font-medium text-slate-400 mb-2">Quick Actions:</p>
                    <div className="flex flex-wrap gap-2">
                      {/* Find Related Evidence */}
                      <button
                        onClick={() => {
                          const messageIndex = messages.findIndex(m => m.id === message.id);
                          const userQuery = messageIndex > 0 && messages[messageIndex - 1].type === 'user' 
                            ? messages[messageIndex - 1].content 
                            : '';
                          if (userQuery) {
                            setInputValue(`Find evidence related to: ${userQuery}`);
                          }
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700/50 hover:bg-slate-600/70 text-slate-200 text-xs rounded-lg transition-all border border-slate-600 hover:border-cyan-500"
                        title="Find related evidence"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        🕵️ Find Related
                      </button>
                      
                      {/* Open in Timeline */}
                      <button
                        onClick={() => {
                          if (message.evidence && message.evidence.length > 0 && onHighlightEvidence) {
                            onHighlightEvidence(message.evidence[0].id);
                          }
                          if (onShowTimeline) {
                            onShowTimeline();
                          }
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700/50 hover:bg-slate-600/70 text-slate-200 text-xs rounded-lg transition-all border border-slate-600 hover:border-cyan-500"
                        title="View in timeline"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        🧭 Timeline
                      </button>
                      
                      {/* Open in Network */}
                      <button
                        onClick={() => {
                          if (onShowNetwork) {
                            onShowNetwork();
                          }
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700/50 hover:bg-slate-600/70 text-slate-200 text-xs rounded-lg transition-all border border-slate-600 hover:border-cyan-500"
                        title="View in network graph"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        🔗 Network
                      </button>
                      
                      {/* Add to Report */}
                      <button
                        onClick={() => {
                          const messageIndex = messages.findIndex(m => m.id === message.id);
                          const userQuery = messageIndex > 0 && messages[messageIndex - 1].type === 'user' 
                            ? messages[messageIndex - 1].content 
                            : 'AI Analysis';
                          handlePinResponse(message, userQuery);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-900/40 to-purple-900/40 hover:from-cyan-800/60 hover:to-purple-800/60 text-cyan-300 hover:text-cyan-200 text-xs rounded-lg transition-all border border-cyan-700/30 hover:border-cyan-500/50"
                        title="Pin this analysis to your report"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                        📌 Add to Report
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Pin to Report Button (for messages without evidence) */}
                {message.type === 'bot' && message.id !== '1' && !message.loading && (!message.evidence || message.evidence.length === 0) && (
                  <div className="mt-4 pt-3 border-t border-slate-700/50">
                    <button
                      onClick={() => {
                        const messageIndex = messages.findIndex(m => m.id === message.id);
                        const userQuery = messageIndex > 0 && messages[messageIndex - 1].type === 'user' 
                          ? messages[messageIndex - 1].content 
                          : 'AI Analysis';
                        handlePinResponse(message, userQuery);
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-cyan-900/40 to-purple-900/40 hover:from-cyan-800/60 hover:to-purple-800/60 text-cyan-300 hover:text-cyan-200 text-xs rounded-lg transition-all border border-cyan-700/30 hover:border-cyan-500/50"
                      title="Pin this analysis to your report"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                      Pin to Report
                    </button>
                  </div>
                )}

                {/* Action Buttons */}
                {message.actions && message.actions.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {message.actions.map((action, index) => (
                      <button
                        key={index}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Action button clicked:', action);
                          handleAction(action);
                        }}
                        className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm rounded-lg transition-colors cursor-pointer active:scale-95 hover:shadow-lg"
                        type="button"
                      >
                        {action.type === 'download' && <DocumentDownloadIcon className="h-4 w-4" />}
                        {action.type === 'timeline' && <ClockIcon className="h-4 w-4" />}
                        {action.type === 'network' && <ShareIcon className="h-4 w-4" />}
                        {action.type === 'evidence' && <DocumentDownloadIcon className="h-4 w-4" />}
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Embedded Visualizations */}
                {message.embedded_component && (
                  <div className="mt-4">
                    {message.embedded_component.type === 'timeline' && (
                      <MiniTimeline 
                        events={message.embedded_component.data}
                        height={300}
                        onExpandClick={() => onShowTimeline?.()}
                      />
                    )}
                    
                    {message.embedded_component.type === 'map' && (
                      <MiniMap 
                        locations={message.embedded_component.data}
                        height={300}
                      />
                    )}
                    
                    {message.embedded_component.type === 'chat_bubbles' && (
                      <ChatBubbleView 
                        messages={message.embedded_component.data}
                        height={400}
                      />
                    )}
                    
                    {message.embedded_component.type === 'network' && (
                      <div className="space-y-3">
                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-2">
                          {/* Toggle Inline Graph Button */}
                          <button
                            onClick={() => {
                              setNetworkGraphStates(prev => ({
                                ...prev,
                                [message.id]: {
                                  showGraph: !prev[message.id]?.showGraph,
                                  isFullScreen: false
                                }
                              }));
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg transition-all shadow-lg"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            {networkGraphStates[message.id]?.showGraph ? 'Hide Relationship Graph' : '🔗 View Relationship Graph'}
                          </button>
                          
                          {/* Open in Network Tab Button */}
                          <button
                            onClick={() => {
                              success('Opening Network Graph view...');
                              if (onShowNetwork) {
                                onShowNetwork();
                              }
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-all border border-slate-600 hover:border-cyan-500"
                            title="Open in full Network Graph page"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Open in Network Tab
                          </button>
                        </div>
                        
                        {/* Inline Network Graph */}
                        {networkGraphStates[message.id]?.showGraph && !networkGraphStates[message.id]?.isFullScreen && (
                          <NetworkGraph
                            graphData={message.embedded_component.data}
                            height={400}
                            caseId={caseId}
                            onExpand={() => {
                              setNetworkGraphStates(prev => ({
                                ...prev,
                                [message.id]: {
                                  ...prev[message.id],
                                  isFullScreen: true
                                }
                              }));
                            }}
                          />
                        )}
                        
                        {/* Full-Screen Network Graph */}
                        {networkGraphStates[message.id]?.isFullScreen && (
                          <NetworkGraph
                            graphData={message.embedded_component.data}
                            isFullScreen={true}
                            caseId={caseId}
                            onClose={() => {
                              setNetworkGraphStates(prev => ({
                                ...prev,
                                [message.id]: {
                                  ...prev[message.id],
                                  isFullScreen: false
                                }
                              }));
                            }}
                          />
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Suggested Follow-up Questions */}
                {message.suggested_followups && message.suggested_followups.length > 0 && (
                  <div className="mt-4 p-3 bg-slate-800/30 rounded-lg border border-slate-700">
                    <p className="text-sm font-medium text-cyan-300 mb-2">💡 Try asking:</p>
                    <div className="flex flex-wrap gap-2">
                      {message.suggested_followups.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setInputValue(suggestion);
                            // Auto-send after a brief delay to show the user what was selected
                            setTimeout(() => handleSendMessage(), 100);
                          }}
                          className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-600/50 text-slate-200 text-sm rounded-md transition-colors border border-slate-600 hover:border-cyan-500"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {message.loading && (
                  <div className="mt-2 flex items-center gap-2 text-cyan-300">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-300"></div>
                    <span className="text-sm">Analyzing...</span>
                  </div>
                )}
              </div>
              
              <p className="text-xs text-slate-500 mt-1 px-2">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>

            {message.type === 'user' && (
              <div className="flex-shrink-0 rounded-full bg-slate-700 p-2">
                <UserIcon className="h-5 w-5 text-slate-300" />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className={`border-t border-slate-700 ${
        hypothesisMode 
          ? 'flex-1 bg-gradient-to-b from-slate-800/50 to-slate-900/80 overflow-y-auto flex flex-col justify-center min-h-0' 
          : 'flex-shrink-0 p-4'
      }`}>
        {hypothesisMode ? (
          /* Hypothesis Testing Input - Focused and Prominent */
          <div className="space-y-3 max-w-4xl mx-auto p-6 w-full">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-base font-semibold text-purple-200 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Enter Your Hypothesis
                </label>
                <textarea
                  value={hypothesisText}
                  onChange={(e) => setHypothesisText(e.target.value)}
                  placeholder='e.g., "The suspect planned the deal at the warehouse location" or "Contact A knew about the transaction beforehand"'
                  className="w-full bg-slate-800/80 border-2 border-purple-500/40 rounded-xl px-5 py-4 text-white text-base placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 resize-none shadow-lg transition-all"
                  rows={4}
                  disabled={testingHypothesis}
                  autoFocus
                />
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    {hypothesisText.length}/500 characters
                  </span>
                  {hypothesisText.length >= 10 ? (
                    <span className="text-green-400 font-medium flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Ready to test
                    </span>
                  ) : (
                    <span className="text-slate-500 text-xs">Minimum 10 characters required</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleTestHypothesis}
                disabled={!hypothesisText.trim() || hypothesisText.length < 10 || testingHypothesis}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white text-base font-semibold rounded-xl hover:from-purple-500 hover:to-purple-600 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-purple-500/25 hover:scale-[1.02]"
              >
                {testingHypothesis ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Testing Hypothesis...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Test Hypothesis
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setHypothesisMode(false);
                  setHypothesisText('');
                  setChatHistoryCollapsed(false);
                  // Notify parent component
                  onHypothesisModeChange?.(false);
                }}
                className="px-6 py-3.5 bg-slate-700 text-slate-200 rounded-xl hover:bg-slate-600 transition-all font-medium"
                disabled={testingHypothesis}
                aria-label="Cancel Hypothesis Mode"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* Regular Query Input */
          <div className="flex gap-3">
            <div className="flex-1 relative">
              {/* Autocomplete Dropdown */}
              {showAutocomplete && autocompleteOptions.length > 0 && (
                <div className="absolute bottom-full mb-2 w-full bg-slate-800 border border-slate-600 rounded-lg shadow-xl max-h-48 overflow-y-auto z-10">
                  <div className="px-3 py-2 border-b border-slate-700">
                    <p className="text-xs text-slate-400">💡 Smart suggestions from case data:</p>
                  </div>
                  {autocompleteOptions.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setInputValue(option);
                        setShowAutocomplete(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-slate-700 text-slate-200 text-sm transition-colors flex items-center gap-2"
                    >
                      <span className="text-cyan-400">→</span>
                      <span className="flex-1">{option}</span>
                    </button>
                  ))}
                  <div className="px-3 py-2 border-t border-slate-700">
                    <p className="text-xs text-slate-500">Press ESC to close</p>
                  </div>
                </div>
              )}
              
              <textarea
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask SpectraX about this case... (e.g., 'Show me chats with...')"
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 pr-12 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
                rows={1}
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-cyan-400 hover:text-cyan-300 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
              >
                <PaperAirplaneIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
        
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <span>SpectraX responses are AI-generated and should be verified by investigators</span>
          </div>
          
          {conversationHistory.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded">
              <span>💬</span>
              <span>Conversation memory: {conversationHistory.length} exchanges</span>
            </div>
          )}
        </div>
      </div>
      {/* Close main chat area */}
      </div>
    </div>
  );
};

export default SpectraX;
