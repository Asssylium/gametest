export function createAccountService(repository) {
  return {
    async listAccounts(query) {
      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 10;
      const offset = (page - 1) * limit;

      let isActive;
      if (query.isActive === '1' || query.isActive === 'true') isActive = 1;
      if (query.isActive === '0' || query.isActive === 'false') isActive = 0;

      const { rows, total } = await repository.findPage({
        search: query.search,
        roleId: query.roleId,
        isActive,
        limit,
        offset,
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

    async changeRole(id, newRoleId, currentUserId) {
      if (id === currentUserId) throw new Error('Cannot change your own role.');
      await repository.updateRole(id, newRoleId);
      return { success: true, message: 'Role updated successfully.' };
    },

    async changeStatus(id, isActive, currentUserId) {
      if (id === currentUserId) throw new Error('Cannot change your own active status.');
      await repository.updateStatus(id, isActive);
      return { success: true, message: 'Status updated successfully.' };
    },
  };
}
