export function createMessageService(messageRepository) {
  return {
    async sendMessage({ senderId, receiverId, content, io }) {
      const cleanContent = typeof content === 'string' ? content.trim() : '';
      const targetId = Number(receiverId);

      if (!targetId || targetId === Number(senderId)) {
        const err = new Error('Người nhận không hợp lệ.');
        err.statusCode = 400;
        throw err;
      }
      if (!cleanContent) {
        const err = new Error('Nội dung tin nhắn không được để trống.');
        err.statusCode = 400;
        throw err;
      }

      const saved = await messageRepository.create({
        senderId: Number(senderId),
        receiverId: targetId,
        content: cleanContent,
      });

      if (io) {
        io.to(`user:${targetId}`).emit('dm:receive', saved);
        io.to(`user:${Number(senderId)}`).emit('dm:receive', saved);
      }

      return saved;
    },

    async getConversation(userId, otherUserId) {
      return messageRepository.getConversation(Number(userId), Number(otherUserId));
    },

    async markRead(userId, otherUserId) {
      await messageRepository.markConversationRead(Number(userId), Number(otherUserId));
      return { success: true };
    },

    async getRecentPartners(userId) {
      return messageRepository.getRecentPartners(Number(userId));
    },
  };
}
