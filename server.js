import express from "express";
import { randomUUID } from "crypto";

const app = express();
app.use(express.json());

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    if (req.method === "OPTIONS") return res.sendStatus(200);
    next();
});

app.get("/privacy", (req, res) => {
    res.send("Este servidor bridge é de uso pessoal e não coleta dados de usuários.");
});

const queue = [];
const results = new Map();

app.post("/figma/:action", (req, res) => {
    const commandId = randomUUID();
    const cmd = { ...req.body, type: req.params.action, commandId };
    queue.push(cmd);
    console.log("Comando enfileirado:", cmd.type, commandId);

    const start = Date.now();
    const check = setInterval(() => {
        if (results.has(commandId)) {
            clearInterval(check);
            res.json(results.get(commandId));
            results.delete(commandId);
        } else if (Date.now() - start > 60000) {
            clearInterval(check);
            res.status(504).json({ error: "Timeout — plugin não respondeu" });
        }
    }, 300);
});

app.get("/commands/next", (req, res) => {
    if (queue.length > 0) {
        res.json(queue.shift());
    } else {
        res.status(204).end();
    }
});

app.post("/commands/:id/result", (req, res) => {
    results.set(req.params.id, req.body);
    res.json({ ok: true });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => console.log("Bridge rodando na porta " + PORT));