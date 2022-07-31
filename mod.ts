// import { serveTls } from "https://deno.land/std@0.140.0/http/server.ts";
import { serve } from "https://deno.land/std@0.140.0/http/server.ts";
import { ParticipantStore } from "./src/participant.ts";
import {
  AnswerMessage,
  EnterMeetingMessage,
  IceCandidateMessage,
  OfferMessage,
  SignalerMessage,
  SignalerMessageHandlers,
} from "./src/types.ts";

const participantStore = new ParticipantStore();

function handler(req: Request) {
  return websocket(req);
}

const messageHandlers: (socket: WebSocket) => SignalerMessageHandlers = (
  socket
) => ({
  handleOffer: (msg: OfferMessage): void => {
    participantStore.handleOffer(msg);
  },
  handleAnswer: (msg: AnswerMessage): void => {
    participantStore.handleAnswer(msg);
  },
  handleIceCandidate: (msg: IceCandidateMessage): void => {
    participantStore.handleIceCandidate(msg);
  },
  handleEnterMeeting: (msg: EnterMeetingMessage): void => {
    participantStore.handleEnterMeeting(msg, socket);
  },
  handleMsg: (msg: any): void => {
    console.log({ msg });
  },
});

function websocket(req: Request): Response {
  let response, socket: WebSocket;

  try {
    ({ response, socket } = Deno.upgradeWebSocket(req));
  } catch {
    return new Response("request isn't trying to upgrade to websocket.");
  }

  socket.onopen = () => console.log("socket opened");

  socket.onmessage = (e) => {
    const msg: SignalerMessage = JSON.parse(e.data);
    const keys = Object.keys(msg) as (keyof typeof msg)[];

    for (const key of keys) {
      const handlerKey = ("handle" +
        (key.charAt(0).toUpperCase() +
          key.slice(1))) as keyof SignalerMessageHandlers;
      console.log({ handlerKey });

      if (messageHandlers(socket)[handlerKey])
        messageHandlers(socket)[handlerKey](msg[key] as any);
    }

    console.log("socket message:", e.data.substring(0, 100));
  };

  socket.onerror = (e) => console.log("socket errored:", e);
  socket.onclose = () => console.log("socket closed");

  return response;
}

// serveTls(handler, {
//   certFile: "./cert.pem",
//   keyFile: "./key.pem",
// });
serve(handler);
