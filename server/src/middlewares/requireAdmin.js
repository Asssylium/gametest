const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required before checking permissions.',
    });
  }
  if (req.user.roleId !== 1) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Requires administrator privileges.',
    });
  }
  next();
};

export default requireAdmin;
