import { notFound } from '../utils/httpError.js';

export function createGameService(repository) {
  return {
    async list(query) {
      const page = Number(query.page) || 1;
      const limit = Math.min(Number(query.limit) || 10, 100);
      const offset = (page - 1) * limit;

      let isActive = undefined;
      if (query.isActive === 'true' || query.isActive === '1') isActive = true;
      if (query.isActive === 'false' || query.isActive === '0') isActive = false;

      const { rows, total } = await repository.findPage({
        search: query.search,
        vendorId: query.vendorId,
        type: query.type,
        isActive: isActive,
        sortBy: query.sortBy,
        order: query.order,
        limit: limit,
        offset: offset,
      });

      return {
        data: rows,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    },

    async get(id) {
      const game = await repository.findById(id);
      if (!game) throw notFound('Game not found');
      return game;
    },

    async create(data) {
      return repository.create(data);
    },

    async update(id, changes) {
      const game = await repository.update(id, changes);
      if (!game) throw notFound('Game not found');
      return game;
    },

    async bulkUpdate({ ids, isActive }) {
      return repository.bulkUpdateActive(ids, isActive);
    },

    async delete(id) {
      const success = await repository.delete(id);
      if (!success) throw notFound('Game not found');
      return success;
    },

    async vendors() {
      return repository.findVendors();
    },

    async stats() {
      return repository.getStats();
    },
  };
}
