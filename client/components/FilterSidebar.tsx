
import React from 'react';
import { XIcon } from './icons';

export interface Filters {
  types: ('message' | 'file' | 'log')[];
  devices: string[];
  dateRange: { start: string; end: string };
  location: string;
}

interface FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  filters: Filters;
  setFilters: (filters: Filters) => void;
  uniqueDevices: string[];
  onApply: () => void;
  onClear: () => void;
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({ isOpen, onClose, filters, setFilters, uniqueDevices, onApply, onClear }) => {
  
  const handleTypeChange = (type: 'message' | 'file' | 'log') => {
    const newTypes = filters.types.includes(type)
      ? filters.types.filter(t => t !== type)
      : [...filters.types, type];
    setFilters({ ...filters, types: newTypes as any });
  };
  
  const handleDeviceChange = (device: string) => {
    const newDevices = filters.devices.includes(device)
      ? filters.devices.filter(d => d !== device)
      : [...filters.devices, device];
    setFilters({ ...filters, devices: newDevices });
  };
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>, part: 'start' | 'end') => {
    setFilters({ ...filters, dateRange: { ...filters.dateRange, [part]: e.target.value } });
  };
  
  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, location: e.target.value });
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`
          fixed top-0 left-0 h-full z-40 w-[90vw] max-w-xs 
          lg:relative lg:h-auto lg:max-w-none lg:translate-x-0 lg:transition-all lg:duration-300
          bg-slate-800/50 backdrop-blur-lg border-r border-white/10
          flex-shrink-0 transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          ${isOpen ? 'lg:w-72' : 'lg:w-0'}
          overflow-hidden
        `}
        aria-label="Filter sidebar"
      >
        <div className={`flex flex-col h-full ${isOpen ? '' : 'invisible lg:visible'}`}>
          <div className="flex items-center justify-between h-16 border-b border-white/10 p-4 flex-shrink-0">
            <h3 className="text-lg font-semibold text-gray-200">Filters</h3>
            <button onClick={onClose} className="p-2 rounded-md hover:bg-white/10 text-gray-400 lg:hidden">
              <XIcon className="h-6 w-6" />
            </button>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto space-y-6">
            {/* Type Filter */}
            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-2">Evidence Type</h4>
              <div className="space-y-1">
                {(['message', 'file', 'log'] as const).map(type => (
                  <label key={type} className="flex items-center">
                    <input type="checkbox" checked={filters.types.includes(type)} onChange={() => handleTypeChange(type)} className="h-4 w-4 rounded border-gray-500 text-cyan-600 bg-slate-700 focus:ring-cyan-500"/>
                    <span className="ml-2 text-sm text-slate-300 capitalize">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Device Filter */}
            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-2">Device</h4>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {uniqueDevices.map(device => (
                  <label key={device} className="flex items-center">
                    <input type="checkbox" checked={filters.devices.includes(device)} onChange={() => handleDeviceChange(device)} className="h-4 w-4 rounded border-gray-500 text-cyan-600 bg-slate-700 focus:ring-cyan-500"/>
                    <span className="ml-2 text-sm text-slate-300">{device}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Date Range Filter */}
            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-2">Date Range</h4>
              <div className="space-y-2">
                <input type="date" value={filters.dateRange.start} onChange={(e) => handleDateChange(e, 'start')} className="w-full rounded-md border border-slate-700 bg-slate-800 py-1.5 px-3 text-gray-200 placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"/>
                <input type="date" value={filters.dateRange.end} onChange={(e) => handleDateChange(e, 'end')} className="w-full rounded-md border border-slate-700 bg-slate-800 py-1.5 px-3 text-gray-200 placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"/>
              </div>
            </div>
            
            {/* Location Filter */}
            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-2">Location</h4>
              <input type="text" placeholder="e.g., New York Harbor" value={filters.location} onChange={handleLocationChange} className="w-full rounded-md border border-slate-700 bg-slate-800 py-1.5 px-3 text-gray-200 placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"/>
            </div>
          </div>
          
          <div className="p-4 border-t border-white/10 flex-shrink-0 flex gap-2">
            <button onClick={onApply} className="flex-1 rounded-md bg-cyan-600 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-500 transition-colors">Apply</button>
            <button onClick={onClear} className="flex-1 rounded-md bg-slate-600 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-500 transition-colors">Clear</button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default FilterSidebar;
