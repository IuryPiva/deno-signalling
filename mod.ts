// import { serveTls } from "https://deno.land/std@0.140.0/http/server.ts";
import { serve } from "https://deno.land/std@0.140.0/http/server.ts";
import { MeetingStore } from "./src/meeting.ts";
import {
  AnswerMessage,
  EnterMeetingMessage,
  IceCandidateMessage,
  OfferMessage,
  SignalerEventData,
  SignalerMessageHandlers,
} from "./src/types.ts";

const meetingStore = new MeetingStore();

function handler(req: Request) {
  return websocket(req);
}

const messageHandlers: (
  socket: WebSocket,
  meetingId: string
) => SignalerMessageHandlers = (socket, meetingId) => ({
  handleOffer: (msg: OfferMessage): void => {
    meetingStore.getOrCreate(meetingId).handleOffer(msg);
  },
  handleAnswer: (msg: AnswerMessage): void => {
    meetingStore.getOrCreate(meetingId).handleAnswer(msg);
  },
  handleIceCandidate: (msg: IceCandidateMessage): void => {
    meetingStore.getOrCreate(meetingId).handleIceCandidate(msg);
  },
  handleEnterMeeting: (msg: EnterMeetingMessage): void => {
    meetingStore.getOrCreate(meetingId).handleEnterMeeting(msg, socket);
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
    const { message, meetingId }: SignalerEventData = JSON.parse(e.data);
    const keys = Object.keys(message) as (keyof typeof message)[];

    for (const key of keys) {
      const handlerKey = ("handle" +
        (key.charAt(0).toUpperCase() +
          key.slice(1))) as keyof SignalerMessageHandlers;

      if (messageHandlers(socket, meetingId)[handlerKey])
        messageHandlers(socket, meetingId)[handlerKey](message[key] as any);
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
