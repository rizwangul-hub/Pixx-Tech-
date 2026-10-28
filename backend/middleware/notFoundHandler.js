const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint Not Found',
    path: req.originalUrl,
    message: `The endpoint ${req.method} ${req.originalUrl} does not exist on PixxTech Central Portal API.`
  });
};

module.exports = notFoundHandler;
