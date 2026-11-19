"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Result = {
  category: string;
  id: string;
  label: string;
  description: string;
  href: string;
};
export function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Result[]>([]);
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState(0);
  useEffect(() => {
    if (query.trim().length < 2) return;
    const abort = new AbortController();
    const timer = setTimeout(async () => {
      setStatus("Searching");
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(query.trim())}`,
          { signal: abort.signal, cache: "no-store" },
        );
        const body = (await response.json()) as { items?: Result[] };
        if (!response.ok) throw new Error();
        setItems(body.items ?? []);
        setSelected(0);
        setStatus(`${body.items?.length ?? 0} results`);
      } catch {
        if (!abort.signal.aborted) setStatus("Search unavailable");
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      abort.abort();
    };
  }, [query]);
  return (
    <div className="global-search">
      <label>
        <span className="sr-only">Global search</span>
        <input
          className="search"
          type="search"
          value={query}
          onChange={(event) => {
            const value = event.target.value;
            setQuery(value);
            if (value.trim().length < 2) {
              setItems([]);
              setStatus("");
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setItems([]);
              setStatus("Search closed");
            } else if (event.key === "ArrowDown" && items.length) {
              event.preventDefault();
              setSelected((value) => (value + 1) % items.length);
            } else if (event.key === "ArrowUp" && items.length) {
              event.preventDefault();
              setSelected((value) => (value - 1 + items.length) % items.length);
            } else if (event.key === "Enter" && items[selected]) {
              event.preventDefault();
              router.push(items[selected].href);
              setItems([]);
            }
          }}
          placeholder="Search the platform"
          autoComplete="off"
          aria-controls="global-results"
          aria-describedby="search-status"
          role="combobox"
          aria-expanded={items.length > 0}
          aria-activedescendant={
            items[selected]
              ? `search-${items[selected].category}-${items[selected].id}`
              : undefined
          }
        />
      </label>
      <span id="search-status" className="sr-only" aria-live="polite">
        {status}
      </span>
      {items.length > 0 && (
        <ul id="global-results" className="card search-results" role="listbox">
          {items.map((item, index) => (
            <li
              key={`${item.category}:${item.id}`}
              id={`search-${item.category}-${item.id}`}
              role="option"
              aria-selected={selected === index}
            >
              <a href={item.href}>
                <strong>{item.label}</strong>
                <small>
                  {item.category} · {item.description}
                </small>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
