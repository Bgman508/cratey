import React from 'react';

// Simple fuzzy match implementation
const fuzzyMatch = (text, query) => {
  if (!text || !query) return false;
  text = text.toLowerCase();
  query = query.toLowerCase();
  
  let textIndex = 0;
  let queryIndex = 0;
  
  while (textIndex < text.length && queryIndex < query.length) {
    if (text[textIndex] === query[queryIndex]) {
      queryIndex++;
    }
    textIndex++;
  }
  
  return queryIndex === query.length;
};

// Calculate match score (higher is better)
const getMatchScore = (text, query) => {
  if (!text || !query) return 0;
  text = text.toLowerCase();
  query = query.toLowerCase();
  
  // Exact match
  if (text === query) return 1000;
  
  // Starts with
  if (text.startsWith(query)) return 500;
  
  // Contains
  if (text.includes(query)) return 100;
  
  // Fuzzy match
  if (fuzzyMatch(text, query)) return 10;
  
  return 0;
};

export const fuzzyFilter = (items, query, searchFields = ['title', 'name']) => {
  if (!query) return items;
  
  return items
    .map(item => {
      const scores = searchFields.map(field => 
        getMatchScore(item[field], query)
      );
      const maxScore = Math.max(...scores, 0);
      
      return { item, score: maxScore };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item);
};

export default fuzzyFilter;