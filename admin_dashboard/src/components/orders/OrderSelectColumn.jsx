import React from 'react';

// Header checkbox: select-all / deselect-all across the currently filtered rows.
export function OrderSelectHeader({ visibleIds, selectedIds, onChange }) {
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
    const someSelected = !allSelected && visibleIds.some((id) => selectedIds.includes(id));
    const ref = React.useRef(null);
    React.useEffect(() => {
        if (ref.current) ref.current.indeterminate = someSelected;
    }, [someSelected]);
    return (
        <input
            ref={ref}
            type="checkbox"
            aria-label="Select all visible orders"
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
            checked={allSelected}
            onChange={(e) => onChange(e.target.checked ? visibleIds : [])}
        />
    );
}

// Per-row checkbox. Stops propagation so clicking it doesn't open the order modal.
export function OrderSelectCell({ orderId, selectedIds, onToggle }) {
    const checked = selectedIds.includes(orderId);
    return (
        <input
            type="checkbox"
            aria-label="Select order"
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
            checked={checked}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) =>
                onToggle((prev) =>
                    e.target.checked
                        ? Array.from(new Set([...prev, orderId]))
                        : prev.filter((x) => x !== orderId)
                )
            }
        />
    );
}
