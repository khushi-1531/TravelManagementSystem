import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Compass } from 'lucide-react';

export const SearchBar = ({ initialQuery = '', placeholder = 'Where do you want to go?', onSearch, className = '' }) => {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState('destinations');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(query, category);
    } else {
      // Default global routing
      const targetRoute = `/${category}?query=${encodeURIComponent(query.trim())}`;
      navigate(targetRoute);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`bg-white rounded-2xl shadow-xl border border-slate-200/80 p-2 sm:p-2.5 flex flex-col sm:flex-row items-center gap-2 max-w-3xl w-full mx-auto ${className}`}
    >
      <div className="flex items-center gap-2.5 flex-1 px-3 w-full">
        <MapPin className="w-5 h-5 text-teal-600 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full text-slate-800 text-sm sm:text-base placeholder-slate-400 bg-transparent outline-none font-normal"
        />
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto border-t sm:border-t-0 sm:border-l border-slate-100 pt-2 sm:pt-0 sm:pl-3">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="text-xs sm:text-sm font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none cursor-pointer hover:bg-slate-100 transition-colors"
        >
          <option value="destinations">Destinations</option>
          <option value="hotels">Hotels</option>
          <option value="packages">Packages</option>
          <option value="places">Places</option>
        </select>

        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-brand-navy hover:bg-slate-800 text-white font-semibold rounded-xl text-sm transition-all duration-200 shadow-md hover:shadow-lg shrink-0"
        >
          <Search className="w-4 h-4" />
          <span>Search</span>
        </button>
      </div>
    </form>
  );
};

export default SearchBar;
