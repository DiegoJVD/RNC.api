module.exports = {
  apps: [{
    name: "rnc-api",
    script: "./app.js",
    autorestart: true,
    env: {
      PORT: 324
    }
  }]
};

