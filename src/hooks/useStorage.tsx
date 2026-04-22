import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { SiteCard, AppData } from '../types';
import { extractDomain, stringToColor } from '../lib/utils';
import { nanoid } from 'nanoid';

const STORAGE_KEY = 'site_cards_data_v1';
const CURRENT_VERSION = '1.0';

interface StoreContextType {
  cards: SiteCard[];
  tags: string[];
  addCard: (cardData: Partial<SiteCard>) => void;
  updateCard: (id: string, cardData: Partial<SiteCard>) => void;
  deleteCard: (id: string) => void;
  bulkDeleteCards: (ids: string[]) => void;
  importData: (importedCards: SiteCard[]) => void;
  togglePin: (id: string) => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load data', e);
  }
  return { cards: [], tags: [], version: CURRENT_VERSION };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(loadData);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const extractUniqueTags = (cards: SiteCard[]) => {
    const allTags = cards.flatMap((c) => c.tags);
    return Array.from(new Set(allTags));
  };

  const addCard = (cardData: Partial<SiteCard>) => {
    setData((prev) => {
      const now = new Date().toISOString();
      let domain = cardData.domain;
      if (!domain && cardData.url) {
        domain = extractDomain(cardData.url);
      }
      
      const newCard: SiteCard = {
        id: nanoid(),
        url: cardData.url || '',
        name: cardData.name || domain || 'Unknown',
        domain: domain || 'Unknown',
        desc: cardData.desc || '',
        thumb: cardData.thumb || '',
        thumbType: cardData.thumbType || 'fallback',
        tags: cardData.tags || [],
        color: cardData.color || stringToColor(domain || 'Unknown'),
        order: prev.cards.length,
        createdAt: now,
        updatedAt: now,
        ...cardData,
      } as SiteCard;

      const newCards = [newCard, ...prev.cards];
      return {
        ...prev,
        cards: newCards,
        tags: extractUniqueTags(newCards),
      };
    });
  };

  const updateCard = (id: string, cardData: Partial<SiteCard>) => {
    setData((prev) => {
      let updatedDomain = cardData.domain;
      if (cardData.url && cardData.url !== prev.cards.find(c => c.id === id)?.url) {
        updatedDomain = extractDomain(cardData.url);
      }

      const newCards = prev.cards.map((c) => {
        if (c.id === id) {
          const updated = { ...c, ...cardData, updatedAt: new Date().toISOString() };
          if (!updated.color && updatedDomain) updated.color = stringToColor(updatedDomain);
          return updated;
        }
        return c;
      });
      return { ...prev, cards: newCards, tags: extractUniqueTags(newCards) };
    });
  };

  const deleteCard = (id: string) => {
    setData((prev) => {
      const newCards = prev.cards.filter((c) => c.id !== id);
      return { ...prev, cards: newCards, tags: extractUniqueTags(newCards) };
    });
  };

  const bulkDeleteCards = (ids: string[]) => {
    setData((prev) => {
      const idsSet = new Set(ids);
      const newCards = prev.cards.filter((c) => !idsSet.has(c.id));
      return { ...prev, cards: newCards, tags: extractUniqueTags(newCards) };
    });
  };

  const importData = (importedCards: SiteCard[]) => {
    setData((prev) => {
      // 去重：如果 URL 已经存在，则不再导入
      const existingUrls = new Set(prev.cards.map(c => c.url));
      const validNewCards = importedCards.filter(c => !existingUrls.has(c.url));
      
      const combinedCards = [...validNewCards, ...prev.cards];
      return { 
        ...prev, 
        cards: combinedCards, 
        tags: extractUniqueTags(combinedCards) 
      };
    });
  };

  const togglePin = (id: string) => {
    setData((prev) => {
      const newCards = prev.cards.map((c) =>
        c.id === id ? { ...c, isPinned: !c.isPinned, updatedAt: new Date().toISOString() } : c
      );
      return { ...prev, cards: newCards };
    });
  };

  return (
    <StoreContext.Provider value={{ cards: data.cards, tags: data.tags, addCard, updateCard, deleteCard, bulkDeleteCards, importData, togglePin }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
