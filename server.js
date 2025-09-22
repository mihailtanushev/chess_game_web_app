// server.js
import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server); // same-origin client, no CORS needed

// Serve everything in /src as the site
app.use(express.static(path.join(__dirname, "src")));

// Default page
app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "src/html/index.html"));
});

// Minimal rooms (max 2 clients) + move relay
io.on("connection", (socket) => {
  socket.on("join", (room) => {
    const r = io.sockets.adapter.rooms.get(room);
    const size = r ? r.size : 0;
    if (size >= 2) return socket.emit("room-full");
    socket.join(room);
    socket.emit("joined", { room, role: size === 0 ? "host" : "guest" });
    socket.to(room).emit("peer-joined");
  });

  // payload = { room, move, fen }
  socket.on("move", ({ room, move, fen }) => {
    socket.to(room).emit("move", { move, fen });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Local: http://localhost:${PORT}`));
