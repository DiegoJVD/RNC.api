module.exports = {
  apps: [{
    name: "Empleos API",
    script: "./app.js",
    autorestart: true,
    env: {
      PORT: 324
    }
  }]
}
