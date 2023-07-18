module.exports = {
  apps: [{
    name: "RNC-API",
    script: "./app.js",
    autorestart: true,
    env: {
      PORT: 324
    }
  }]
}
