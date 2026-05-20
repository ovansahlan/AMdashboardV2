import { useState, useEffect } from 'react';

export function useSheetData(endpoint) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const abortController = new AbortController();

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Memanggil API Vercel kita
        const response = await fetch(`/api/${endpoint}`, {
          signal: abortController.signal
        });
        
        if (!response.ok) throw new Error('Gagal mengambil data dari server');
        
        const result = await response.json();
        setData(result.data);
        setError(null);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    return () => abortController.abort();
  }, [endpoint]);

  return { data, isLoading, error };
}