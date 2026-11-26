export function createAccountController(service) {
  return {
    async getList(req, res, next) {
      try {
        const result = await service.listAccounts(req.query);
        res.json({ success: true, data: result.data, meta: result.meta });
      } catch (error) {
        next(error);
      }
    },

    async updateRole(req, res, next) {
      try {
        const accountId = Number(req.params.id);
        const roleId = Number(req.body.roleId);
        if (!roleId || ![1, 2, 3].includes(roleId)) {
          return res.status(400).json({ success: false, message: 'Invalid role ID.' });
        }

        const result = await service.changeRole(accountId, roleId, req.user.id);
        res.json(result);
      } catch (error) {
        next(error);
      }
    },

    async updateStatus(req, res, next) {
      try {
        const accountId = Number(req.params.id);
        const isActive = req.body.isActive === true ? 1 : 0;

        const result = await service.changeStatus(accountId, isActive, req.user.id);
        res.json(result);
      } catch (error) {
        next(error);
      }
    },
  };
}
