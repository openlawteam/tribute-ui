const {createProxyMiddleware} = require('http-proxy-middleware');

/**
 * A proxy to get around CORS in local development.
 *
 * @param {Express App} app
 */
module.exports = (app) => {
  // Proxy for our development Snapshot Hub
  app.use(
    createProxyMiddleware('/snapshot-hub', {
      // Address should match `REACT_APP_SNAPSHOT_HUB_API_URL` address from config
      target: 'http://localhost:8081',
      changeOrigin: true,
      pathRewrite: function (path, _req) {
        // Rewrite any path after `snapshot-hub/` to the root of the `target`.
        return path.replace(/^\/snapshot-hub\/(.*)/, '/$1');
      },
    })
  );
};
