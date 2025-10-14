import { useState, useCallback } from 'react';

export const useRegions = () => {
  const [regions, setRegions] = useState([]);

  const addRegion = useCallback((region) => {
    setRegions(prev => [...prev, region]);
  }, []);

  const updateRegion = useCallback((id, updates) => {
    setRegions(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  }, []);

  const deleteRegion = useCallback((id) => {
    setRegions(prev => prev.filter(r => r.id !== id));
  }, []);

  const clearRegions = useCallback(() => {
    setRegions([]);
  }, []);

  return {
    regions,
    addRegion,
    updateRegion,
    deleteRegion,
    clearRegions
  };
};