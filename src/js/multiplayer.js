export const socket = io();
let currentRoom = null;

export function joinRoom(code) {
  currentRoom = (code || "").trim();
  if (!currentRoom) return alert("Enter a room code");
  socket.emit("join", currentRoom);
}

export function onOpponentMove(handler) {
  socket.on("move", ({ move, fen }) => handler(move, fen));
}

export function sendMove(move, fen) {
  if (!currentRoom) return console.warn("Join a room first");
  socket.emit("move", { room: currentRoom, move, fen });
}

const urlRoom = new URLSearchParams(location.search).get("room");
if (urlRoom) joinRoom(urlRoom);

socket.on("room-full", () => alert("Room is full (only 2 players allowed)."));
