import React, { useState, useRef, useEffect } from 'react';
import { SUGGESTED_COLORS, getColorHex } from '../utils/colorSuggestions';

const MAX_SUGGESTIONS = 12;

/**
 * Color input with dropdown suggestions: swatch + English color name.
 * Value is the color name (e.g. "red"); onChange(name) when user types or selects.
 */
export default function ColorAutocomplete({ value = '', onChange, placeholder = 'e.g. Red', className = '' }) {
    const [open, setOpen] = useState(false);
    const [highlightIndex, setHighlightIndex] = useState(0);
    const wrapperRef = useRef(null);

    const query = (value || '').trim().toLowerCase();
    const suggestions = query.length === 0
        ? SUGGESTED_COLORS.slice(0, MAX_SUGGESTIONS)
        : SUGGESTED_COLORS.filter(({ name }) => name.toLowerCase().includes(query)).slice(0, MAX_SUGGESTIONS);

    const currentHex = getColorHex(value);

    const close = () => {
        setOpen(false);
        setHighlightIndex(0);
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) close();
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleFocus = () => setOpen(true);
    const handleBlur = () => setTimeout(close, 150);

    const handleSelect = (name) => {
        onChange(name);
        close();
    };

    const handleKeyDown = (e) => {
        if (!open) {
            if (e.key === 'ArrowDown' || e.key === 'Enter') setOpen(true);
            return;
        }
        if (e.key === 'Escape') {
            close();
            return;
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightIndex((i) => (i < suggestions.length - 1 ? i + 1 : 0));
            return;
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightIndex((i) => (i > 0 ? i - 1 : suggestions.length - 1));
            return;
        }
        if (e.key === 'Enter' && suggestions[highlightIndex]) {
            e.preventDefault();
            handleSelect(suggestions[highlightIndex].name);
        }
    };

    return (
        <div ref={wrapperRef} className="relative">
            <div className="flex items-center gap-1.5 w-full">
                {currentHex && (
                    <span
                        className="shrink-0 w-5 h-5 rounded border border-gray-300"
                        style={{ backgroundColor: currentHex }}
                        title={value}
                    />
                )}
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className={`flex-1 min-w-0 px-2 py-1 border border-gray-300 rounded text-sm ${className}`}
                    autoComplete="off"
                />
            </div>
            {open && suggestions.length > 0 && (
                <ul
                    className="absolute left-0 right-0 top-full mt-0.5 z-20 bg-white border border-gray-200 rounded-md shadow-lg max-h-56 overflow-auto py-1"
                    role="listbox"
                >
                    {suggestions.map(({ name, hex }, i) => (
                        <li
                            key={name}
                            role="option"
                            aria-selected={i === highlightIndex}
                            className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer text-sm ${i === highlightIndex ? 'bg-indigo-50 text-indigo-800' : 'hover:bg-gray-50'}`}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                handleSelect(name);
                            }}
                            onMouseEnter={() => setHighlightIndex(i)}
                        >
                            <span
                                className="shrink-0 w-5 h-5 rounded border border-gray-300"
                                style={{ backgroundColor: hex }}
                            />
                            <span>{name}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
