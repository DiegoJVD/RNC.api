module.exports = {
  apps: [{
    name: "RNC_API",
    script: "./app.js",
    autorestart: true,
    env: {
      PORT: 324
    }
  }]
}
