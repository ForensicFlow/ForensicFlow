import React, { forwardRef } from 'react';
import { SearchIcon } from './icons';

interface SearchBarProps {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(({ value, onChange }, ref) => {
  return (
    <div className="relative w-full max-w-xl">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <SearchIcon className="h-5 w-5 text-gray-400" />
      </div>
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={onChange}
        placeholder="Show chats mentioning 'wallet' near 'Pier 4'..."
        className="w-full rounded-md border border-slate-700 bg-slate-800 py-2 pl-10 pr-4 text-gray-200 placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
      />
    </div>
  );
});

SearchBar.displayName = 'SearchBar';

export default SearchBar;