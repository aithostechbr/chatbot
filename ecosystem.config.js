module.exports = {
  apps: [
    {
      name: "aithos-bot",
      script: "chatbot.js",
      watch: false,
      autorestart: true,
      restart_delay: 5000,
      max_restarts: 10,
      min_uptime: "10s",
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
      },
      error_file: "./logs/error.log",
      out_file: "./logs/output.log",
      log_date_format: "DD-MM-YYYY HH:mm:ss",
      merge_logs: true,
    },
  ],
};
