import { useState, useEffect, useCallback } from 'react';
import { fetchInvaders } from '../services/api';

export const useInvaders = () => {
  const [invaders, setInvaders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadInvaders = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await fetchInvaders();
      setInvaders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInvaders();
  }, [loadInvaders]);

  const updateLocalInvader = useCallback((updatedInvader) => {
    setInvaders((prevInvaders) =>
      prevInvaders.map((inv) =>
        inv.id === updatedInvader.id ? updatedInvader : inv
      )
    );
  }, []);

  return { invaders, isLoading, error, updateLocalInvader, refetchInvaders: loadInvaders };
};
