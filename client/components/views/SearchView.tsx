
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { EvidenceSnippet } from '../../types';
import ResultCard from '../ResultCard';
import RightContextPane from '../RightContextPane';
import { FilterIcon } from '../icons';
import AISummaryCard from '../AISummaryCard';
import { aiApi, evidenceApi } from '@/lib/api';
import FilterSidebar, { Filters } from '../FilterSidebar';
import { useDemo } from '@/contexts/DemoContext';

// Simple debounce hook
const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};

const INITIAL_FILTERS: Filters = {
  types: [],
  devices: [],
  dateRange: { start: '', end: '' },
  location: '',
};


interface SearchViewProps {
    onSnippetSelect: (snippet: EvidenceSnippet | null) => void;
    selectedSnippet: EvidenceSnippet | null;
    searchQuery: string;
}

const SearchView: React.FC<SearchViewProps> = ({ onSnippetSelect, selectedSnippet, searchQuery }) => {
  const { isDemoMode, getSampleData } = useDemo();
  const [filteredEvidence, setFilteredEvidence] = useState<EvidenceSnippet[]>([]);
  const [allEvidence, setAllEvidence] = useState<EvidenceSnippet[]>([]);
  const [aiSummary, setAiSummary] = useState<string>('Search for evidence to see an AI-generated summary of the findings.');
  const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(false);
  const [isLoadingEvidence, setIsLoadingEvidence] = useState<boolean>(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // State for filters
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Filters>(INITIAL_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(INITIAL_FILTERS);

  // Load all evidence on mount
  useEffect(() => {
    const loadEvidence = async () => {
      try {
        setIsLoadingEvidence(true);
        let evidenceArray: EvidenceSnippet[] = [];
        
        if (isDemoMode) {
          // Use sample data in demo mode
          const sampleData = getSampleData();
          evidenceArray = sampleData.evidence;
        } else {
          // Fetch real data
          const data = await evidenceApi.list();
          evidenceArray = Array.isArray(data) ? data : [];
        }
        
        setAllEvidence(evidenceArray);
        setFilteredEvidence(evidenceArray);
      } catch (error) {
        console.error('Error loading evidence:', error);
        setAllEvidence([]);
        setFilteredEvidence([]);
      } finally {
        setIsLoadingEvidence(false);
      }
    };
    loadEvidence();
  }, [isDemoMode, getSampleData]);

  const uniqueDevices = useMemo(() => {
    const devices = new Set(allEvidence.map(e => e.device));
    return Array.from(devices);
  }, [allEvidence]);

  const handleApplyFilters = () => {
    setAppliedFilters(activeFilters);
    setIsFilterSidebarOpen(false);
  };
  
  const handleClearFilters = () => {
    setActiveFilters(INITIAL_FILTERS);
    setAppliedFilters(INITIAL_FILTERS);
    setIsFilterSidebarOpen(false);
  };

  const performSearchAndSummarize = useCallback(async (query: string, filters: Filters) => {
    // If we have a search query, use the enhanced backend search API
    if (query) {
      setIsLoadingSummary(true);
      setSummaryError(null);
      try {
        // Use the first case ID if available
        const caseId = allEvidence[0]?.case || '1';
        const searchResponse = await evidenceApi.search(query, caseId);
        
        let results = searchResponse.results || [];
        
        // Apply additional client-side filters
        // 1. Filter by type
        if (filters.types.length > 0) {
          results = results.filter(snippet => filters.types.includes(snippet.type));
        }

        // 2. Filter by device
        if (filters.devices.length > 0) {
          results = results.filter(snippet => filters.devices.includes(snippet.device));
        }

        // 3. Filter by date range
        if (filters.dateRange.start && filters.dateRange.end) {
          try {
            const start = new Date(filters.dateRange.start).getTime();
            const end = new Date(filters.dateRange.end).getTime() + (24 * 60 * 60 * 1000 - 1);
            results = results.filter(snippet => {
                const timestamp = new Date(snippet.timestamp).getTime();
                return timestamp >= start && timestamp <= end;
            });
          } catch (e) { console.error("Invalid date for filtering", e) }
        }
        
        // 4. Filter by location
        if (filters.location) {
          const lowercasedLocation = filters.location.toLowerCase();
          results = results.filter(snippet => 
            snippet.content.toLowerCase().includes(lowercasedLocation) ||
            snippet.entities.some(e => ['Location', 'GPS'].includes(e.type) && e.value.toLowerCase().includes(lowercasedLocation))
          );
        }
        
        setFilteredEvidence(results);
        
        // Use AI summary from backend if available
        if (searchResponse.ai_summary) {
          setAiSummary(searchResponse.ai_summary);
        } else if (results.length > 0) {
          setAiSummary(`Found ${results.length} evidence items matching "${query}". Review the results below for detailed information.`);
        } else {
          setAiSummary('No evidence found matching your query and filters.');
        }
        
      } catch (error) {
        console.error("Error performing search:", error);
        setSummaryError("Could not perform search. Please try again.");
        setAiSummary('Search for evidence to see an AI-generated summary of the findings.');
        setFilteredEvidence([]);
      } finally {
        setIsLoadingSummary(false);
      }
    } else {
      // No search query - apply filters to all evidence
      let results = allEvidence;
      
      // Apply filters
      if (filters.types.length > 0) {
        results = results.filter(snippet => filters.types.includes(snippet.type));
      }

      if (filters.devices.length > 0) {
        results = results.filter(snippet => filters.devices.includes(snippet.device));
      }

      if (filters.dateRange.start && filters.dateRange.end) {
        try {
          const start = new Date(filters.dateRange.start).getTime();
          const end = new Date(filters.dateRange.end).getTime() + (24 * 60 * 60 * 1000 - 1);
          results = results.filter(snippet => {
              const timestamp = new Date(snippet.timestamp).getTime();
              return timestamp >= start && timestamp <= end;
          });
        } catch (e) { console.error("Invalid date for filtering", e) }
      }
      
      if (filters.location) {
        const lowercasedLocation = filters.location.toLowerCase();
        results = results.filter(snippet => 
          snippet.content.toLowerCase().includes(lowercasedLocation) ||
          snippet.entities.some(e => ['Location', 'GPS'].includes(e.type) && e.value.toLowerCase().includes(lowercasedLocation))
        );
      }
      
      setFilteredEvidence(results);
      
      if (results.length > 0) {
        setAiSummary('Search for evidence to see an AI-generated summary of the findings.');
      } else {
        setAiSummary('No evidence found matching your filters.');
      }
      setIsLoadingSummary(false);
      setSummaryError(null);
    }
  }, [allEvidence]);


  useEffect(() => {
      performSearchAndSummarize(debouncedSearchQuery, appliedFilters);
  }, [debouncedSearchQuery, appliedFilters]);


  return (
    <div className="flex h-full">
        <FilterSidebar
          isOpen={isFilterSidebarOpen}
          onClose={() => setIsFilterSidebarOpen(false)}
          filters={activeFilters}
          setFilters={setActiveFilters}
          uniqueDevices={uniqueDevices}
          onApply={handleApplyFilters}
          onClear={handleClearFilters}
        />
        <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
            <AISummaryCard 
              query={debouncedSearchQuery}
              summary={aiSummary}
              isLoading={isLoadingSummary}
              error={summaryError}
            />
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-300">Evidence Snippets ({filteredEvidence.length})</h2>
                 <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setIsFilterSidebarOpen(true)}
                      className="flex items-center gap-2 rounded-md bg-slate-700 px-3 py-1.5 text-sm text-gray-300 hover:bg-slate-600"
                    >
                        <FilterIcon className="h-4 w-4" />
                        <span>Filters</span>
                    </button>
                </div>
            </div>
            {isLoadingEvidence ? (
                <div className="flex items-center justify-center py-20">
                    <div className="text-white">Loading evidence...</div>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredEvidence.length > 0 ? filteredEvidence.map((snippet) => (
                        <ResultCard 
                            key={snippet.id} 
                            snippet={snippet}
                            isSelected={selectedSnippet?.id === snippet.id}
                            onSelect={() => onSnippetSelect(snippet)}
                        />
                    )) : (
                        <div className="text-center py-10 text-slate-400 rounded-lg border border-dashed border-slate-700">
                            <p className="font-semibold">No results found.</p>
                            <p className="text-sm mt-1">Try adjusting your search query or filters.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
        <RightContextPane snippet={selectedSnippet} onClose={() => onSnippetSelect(null)}/>
    </div>
  );
};

export default SearchView;
