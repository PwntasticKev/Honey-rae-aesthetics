"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  X,
  Clock,
  Filter,
  ArrowUp,
  ArrowDown,
  Command,
} from "lucide-react";
import {
  useGlobalSearch,
  useSearchSuggestions,
  type SearchResult,
} from "@/lib/convexSearchService";
import { useAuth } from "@/hooks/useAuth";

interface GlobalSearchProps {
  className?: string;
  placeholder?: string;
}

export function GlobalSearch({
  className = "",
  placeholder = "Search anything",
}: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { user } = useAuth();

  // Get search results and suggestions from Convex
  // Temporarily disabled until Convex functions are deployed
  const results: SearchResult[] = [];
  const suggestions: string[] = [];

  // Show suggestions when query is empty
  const shouldShowSuggestions = !query.trim() && showSuggestions;

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev <
            (showSuggestions ? suggestions.length - 1 : results.length - 1)
              ? prev + 1
              : prev,
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0) {
            if (showSuggestions) {
              handleSuggestionClick(suggestions[selectedIndex]);
            } else {
              handleResultClick(results[selectedIndex]);
            }
          } else if (query.trim()) {
            handleSearch(query);
          }
          break;
        case "Escape":
          setIsOpen(false);
          setSelectedIndex(-1);
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, suggestions, results, showSuggestions, query]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      setIsOpen(false);
      setSelectedIndex(-1);
      // Navigate to search results page or show results
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    setIsOpen(false);
    setSelectedIndex(-1);
    router.push(result.url);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    handleSearch(suggestion);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    setShowSuggestions(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setSelectedIndex(-1);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "client":
        return "bg-blue-100 text-blue-800";
      case "appointment":
        return "bg-green-100 text-green-800";
      case "workflow":
        return "bg-purple-100 text-purple-800";
      case "message":
        return "bg-orange-100 text-orange-800";
      case "file":
        return "bg-gray-100 text-gray-800";
      case "template":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "client":
        return "Client";
      case "appointment":
        return "Appointment";
      case "workflow":
        return "Workflow";
      case "message":
        return "Message";
      case "file":
        return "File";
      case "template":
        return "Template";
      default:
        return type;
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          className="pl-10 pr-4 w-64 bg-gray-50 border-gray-200"
          data-theme-aware="true"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setQuery("")}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div className="absolute top-full mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
          {/* Header */}
          <div className="p-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">
                {showSuggestions
                  ? "Recent Searches"
                  : `Search Results (${results.length})`}
              </h3>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <span>Use ↑↓ to navigate</span>
                <span>•</span>
                <span>Enter to select</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-2">
            {showSuggestions ? (
              /* Suggestions */
              <div>
                {suggestions.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <p className="text-sm">No recent searches</p>
                  </div>
                ) : (
                  suggestions.map((suggestion: string, index: number) => (
                    <button
                      key={suggestion}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className={`w-full p-3 text-left rounded-lg transition-colors ${
                        index === selectedIndex
                          ? "bg-orange-50 text-orange-900"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{suggestion}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            ) : (
              /* Search Results */
              <div>
                {results.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <p className="text-sm">No results found</p>
                    <p className="text-xs mt-1">Try a different search term</p>
                  </div>
                ) : (
                  results.map((result: SearchResult, index: number) => (
                    <button
                      key={result.id}
                      onClick={() => handleResultClick(result)}
                      className={`w-full p-3 text-left rounded-lg transition-colors ${
                        index === selectedIndex
                          ? "bg-orange-50 text-orange-900"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          <span className="text-lg">{result.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {result.title}
                            </h4>
                            <Badge
                              className={`text-xs ${getTypeColor(result.type)}`}
                            >
                              {getTypeLabel(result.type)}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {result.description}
                          </p>
                          {result.metadata && (
                            <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                              {result.metadata.email && (
                                <span>{result.metadata.email}</span>
                              )}
                              {result.metadata.date && (
                                <span>{result.metadata.date}</span>
                              )}
                              {result.metadata.status && (
                                <span className="capitalize">
                                  {result.metadata.status}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          {!showSuggestions && results.length > 0 && (
            <div className="p-3 border-t border-gray-200">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSearch(query)}
                className="w-full"
              >
                View all results for "{query}"
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
