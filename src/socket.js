import { io } from "socket.io-client";

const URL =
  import.meta.env.MODE === "production" ? "/" : "http://localhost:3001";

const socket = io(URL, {
  autoConnect: true,
});

export default socket;
