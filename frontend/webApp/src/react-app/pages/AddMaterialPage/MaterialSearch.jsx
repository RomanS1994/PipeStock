import { useMemo } from 'react';
import { getMaterialImage } from './materialImageResolver.js';
import './MaterialSearch.css';

const RESULT_LIMIT = 40;
const CATEGORY_NAMES = { CU: 'Měď', STEEL: 'Uhlíková ocel' };

function normalize(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('cs').replace(/[×]/g, 'x').trim();
}

export function MaterialSearch({ catalog, query, onQueryChange, onSelect }) {
  const matches = useMemo(() => {
    const terms = normalize(query).split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    return catalog.filter(item => {
      const category = CATEGORY_NAMES[String(item.categoryKey).toUpperCase()] || item.categoryLabel;
      const haystack = normalize([category, item.categoryLabel, item.categoryKey, item.name, item.type, item.diameter, item.unit].join(' '));
      return terms.every(term => haystack.includes(term));
    });
  }, [catalog, query]);

  return (
    <div className="materialSearch">
      <label htmlFor="material-search-input">Швидкий пошук матеріалу</label>
      <div className="materialSearchInputWrap">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></svg>
        <input id="material-search-input" type="search" value={query} onChange={event => onQueryChange(event.target.value)} placeholder="Наприклад, PPR 25 koleno" autoComplete="off" spellCheck="false" />
      </div>
      {query.trim() ? (
        <div className="materialSearchResults" aria-live="polite">
          <p>{matches.length ? `Знайдено: ${matches.length}` : 'Матеріалів не знайдено. Спробуйте іншу назву або розмір.'}</p>
          {matches.slice(0, RESULT_LIMIT).map(item => {
            const image = getMaterialImage(item);
            const category = CATEGORY_NAMES[String(item.categoryKey).toUpperCase()] || item.categoryLabel;
            return (
              <button type="button" className="materialSearchResult" key={item.id} onClick={() => onSelect(item)}>
                <span className="materialSearchResultImage">{image ? <img src={image} alt="" loading="lazy" /> : null}</span>
                <span className="materialSearchResultText"><strong>{item.type} · {item.diameter}</strong><small>{category} · {item.name}</small></span>
                <span className="materialSearchResultArrow" aria-hidden="true">›</span>
              </button>
            );
          })}
          {matches.length > RESULT_LIMIT ? <small className="materialSearchMore">Показано перші {RESULT_LIMIT} варіантів. Уточніть пошук за розміром або типом.</small> : null}
        </div>
      ) : null}
    </div>
  );
}
