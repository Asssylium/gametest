export function createMessageController(messageService) {
  return {
    async getPartners(req, res, next) {
      try {
        const data = await messageService.getRecentPartners(req.user.id);
        res.json({ success: true, data });
      } catch (err) {
        next(err);
      }
    },

    async getConversation(req, res, next) {
      try {
        const data = await messageService.getConversation(req.user.id, req.params.otherUserId);
        res.json({ success: true, data });
      } catch (err) {
        next(err);
      }
    },

    async send(req, res, next) {
      try {
        const { receiverId, content } = req.body;
        const data = await messageService.sendMessage({
          senderId: req.user.id,
          receiverId,
          content,
          io: req.app.get('io'),
        });
        res.status(201).json({ success: true, data });
      } catch (err) {
        next(err);
      }
    },

    async markRead(req, res, next) {
      try {
        const data = await messageService.markRead(req.user.id, req.params.otherUserId);
        res.json({ success: true, data });
      } catch (err) {
        next(err);
      }
    },
  };
}
