import { badRequest } from '../utils/httpError.js';

function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw badRequest('Invalid id');
  return id;
}

export function createVendorController(service) {
  return {
    async update(req, res) {
      const updatedVendor = await service.update(parseId(req.params.id), req.body);
      res.json({ data: updatedVendor });
    },

    async remove(req, res) {
      await service.delete(parseId(req.params.id));
      res.status(204).send(); // 204 No Content
    },

    async getGames(req, res) {
      const games = await service.getGamesByVendorId(parseId(req.params.id));
      res.json({ data: games });
    },
    async getAll(req, res) {
      const vendors = await service.list();
      res.json({ data: vendors });
    },

    async getById(req, res) {
      const vendor = await service.get(parseId(req.params.id));
      res.json({ data: vendor });
    },

    async create(req, res) {
      const newVendor = await service.create(req.body);
      res.status(201).json({ data: newVendor });
    },
  };
}
