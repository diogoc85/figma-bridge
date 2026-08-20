import express from "express";
import { randomUUID } from "crypto";

const app = express();
app.use(express.json());

const queue = [];
const results = new Map();

// GPT envia comando aqui
app.post("/figma/:action", (req, res) => {
  const commandId = randomUUID();
  const cmd = { ...req.body, type: req.params.action, commandId };
  queue.push(cmd);

  // aguarda resultado por até 30s
  const start = Date.now();
  const check = setInterval(() => {
    if (results.has(commandId)) {
      clearInterval(check);
      res.json(results.get(commandId));
      results.delete(commandId);
    } else if (Date.now() - start > 30000) {
      clearInterval(check);
      res.status(504).json({ error: "Timeout — plugin não respondeu" });
    }
  }, 300);
});

// Plugin consome fila
app.get("/commands/next", (req, res) => {
  if (queue.length > 0) {
    res.json(queue.shift());
  } else {
    res.status(204).end();
  }
});

// Plugin devolve resultado
app.post("/commands/:id/result", (req, res) => {
  results.set(req.params.id, req.body);
  res.json({ ok: true });
});

app.listen(3000, () => console.log("Bridge rodando na porta 3000"));