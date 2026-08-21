import express from "express";
import { randomUUID } from "crypto";

const app = express();
app.use(express.json());

const API_KEY = process.env.API_KEY || "minha-chave-secreta";

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type, x-api-key");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    if (req.method === "OPTIONS") return res.sendStatus(200);
    next();
});

function auth(req, res, next) {
    const key = req.headers["x-api-key"];
    if (key !== API_KEY) return res.status(401).json({ error: "Unauthorized" });
    next();
}

app.get("/privacy", (req, res) => {
    res.send("Este servidor bridge é de uso pessoal e não coleta dados de usuários.");
});

const queue = [];
const results = new Map();

app.post("/figma/:action", auth, (req, res) => {
    const commandId = randomUUID();
    const cmd = { ...req.body, type: req.params.action, commandId };
    queue.push(cmd);
    console.log("Comando enfileirado:", cmd.type, commandId);
    res.json({
        success: true,
        commandId,
        name: req.body.name || "sem nome",
        pageId: commandId,
        status: "executed"
    });
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