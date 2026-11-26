import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';

// Loads the game list whenever the filters change; exposes reload() and a local row update.
// A newer request aborts the previous one, so a slow old response can never overwrite newer data.
export function useGames(filters) {
  const [games, setGames] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setError(null);
    api
      .getGames(filters, { signal: controller.signal })
      .then((result) => {
        setGames(result.data);
        setMeta(result.meta);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setError(err.message);
        setLoading(false);
      });

    return () => controller.abort();
  }, [filters, reloadCount]);

  const reload = useCallback(() => setReloadCount((count) => count + 1), []);

  const replaceGame = useCallback((updated) => {
    setGames((list) => list.map((game) => (game.id === updated.id ? updated : game)));
  }, []);

  return { games, meta, loading, error, reload, replaceGame };
}
