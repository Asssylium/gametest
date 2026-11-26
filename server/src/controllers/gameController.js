import { badRequest } from '../utils/httpError.js';

export function createGameController(service) {
  return {
    async getAll(req, res) {
      res.json(await service.list(req.query));
    },

    async getById(req, res) {
      res.json({ data: await service.get(parseId(req.params.id)) });
    },

    async create(req, res) {
      res.status(201).json({ data: await service.create(req.body ?? {}) });
    },

    async update(req, res) {
      res.json({ data: await service.update(parseId(req.params.id), req.body ?? {}) });
    },
    async bulkUpdate(req, res) {
      res.json({ data: await service.bulkUpdate(req.body ?? {}) });
    },

    async remove(req, res) {
      await service.delete(parseId(req.params.id));
      res.status(204).send();
    },

    async vendors(req, res) {
      res.json({ data: await service.vendors() });
    },
    async stats(req, res) {
      res.json({ data: await service.stats() });
    },
  };
}

function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw badRequest('Invalid id');
  return id;
}
