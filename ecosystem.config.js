module.exports = {
  apps: [
    {
      name: "herb-backend",
      script: "server.js",
      cwd: "./backend",
      env: {
        NODE_ENV: "production",
        PORT: 5000,
        RAG_SERVICE_URL: "http://localhost:8000"
      },
      restart_delay: 3000,
      max_restarts: 10
    },
    {
      name: "herb-rag",
      script: "uvicorn",
      args: "app.main:app --host 127.0.0.1 --port 8000",
      cwd: "./rag_service",
      interpreter: "./venv/bin/python",
      env: {
        PYTHONUNBUFFERED: "1"
      },
      restart_delay: 3000,
      max_restarts: 10
    }
  ]
};
