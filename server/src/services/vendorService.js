import { badRequest, notFound, conflict } from '../utils/httpError.js';

export function createVendorService(repository) {
  return {
    async update(id, changes) {
      const vendor = await repository.findById(id);
      if (!vendor) throw notFound(`Vendor with id ${id} not found`);

      if (changes.code && changes.code !== vendor.code) {
        const existingVendor = await repository.findByCode(changes.code);
        if (existingVendor) {
          throw conflict(`Vendor code '${changes.code}' is already in use by another vendor`);
        }
      }

      const updatedVendor = await repository.update(id, changes);
      return updatedVendor;
    },

    async delete(id) {
      const vendor = await repository.findById(id);
      if (!vendor) throw notFound(`Vendor with id ${id} not found`);

      const gameCount = await repository.countGames(vendor.id);
      if (gameCount > 0) {
        throw conflict(`không thể xóa '${vendor.name}' vì vendor này có  ${gameCount} games đang bật `);
      }

      await repository.delete(id);
      return true;
    },

    async getGamesByVendorId(id) {
      const vendor = await repository.findById(id);
      if (!vendor) throw notFound(`Vendor with id ${id} not found`);

      const games = await repository.getGames(vendor.id);
      return games;
    },

    async list() {
      return repository.findAll();
    },

    async get(id) {
      const vendor = await repository.findById(id);
      if (!vendor) throw notFound(`Vendor with id ${id} not found`);
      return vendor;
    },

    async create(data) {
      if (!data.code || !data.name) {
        throw badRequest('Vendor code and name are required');
      }

      const existingVendor = await repository.findByCode(data.code);
      if (existingVendor) {
        throw conflict(`Vendor code '${data.code}' already exists`);
      }

      return repository.create(data);
    },
  };
}
