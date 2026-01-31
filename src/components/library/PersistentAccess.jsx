import React, { useEffect } from 'react';

const LIBRARY_EMAIL_KEY = 'cratey_library_email';
const LIBRARY_TOKEN_KEY = 'cratey_library_token';

export const saveLibraryAccess = (email) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LIBRARY_EMAIL_KEY, email);
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem(LIBRARY_TOKEN_KEY, token);
  }
};

export const getLibraryAccess = () => {
  if (typeof window !== 'undefined') {
    return {
      email: localStorage.getItem(LIBRARY_EMAIL_KEY),
      token: localStorage.getItem(LIBRARY_TOKEN_KEY)
    };
  }
  return { email: null, token: null };
};

export const clearLibraryAccess = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(LIBRARY_EMAIL_KEY);
    localStorage.removeItem(LIBRARY_TOKEN_KEY);
  }
};

export const hasLibraryAccess = () => {
  const { email, token } = getLibraryAccess();
  return !!(email && token);
};