// import { serveTls } from "https://deno.land/std@0.140.0/http/server.ts";
import { serve } from "https://deno.land/std@0.140.0/http/server.ts";
import { MeetingStore, Meeting } from "./meeting.ts";
import { SignalingWebSocket } from "./signaling-websocket.ts";

const answer = (data: any) => {
  const body = JSON.stringify(data, null, 2);

  return new Response(body, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-headers":
        "Origin, X-Requested-With, Content-Type, Accept, Range",
    },
  });
};

type RTCSessionDescriptionInit = {
  type?: string;
  sdp?: string;
};

type User = { socket: SignalingWebSocket; session?: RTCSessionDescriptionInit };

const users: Map<string, User> = new Map();
const meetingStore = new MeetingStore();

export type Body = {
  videoOffer?: {
    from: string;
    target: string;
    offer: RTCSessionDescriptionInit;
    meetingId: string;
  };
  videoAnswer?: {
    from: string;
    target: string;
    answer: RTCSessionDescriptionInit;
    meetingId: string;
  };
  iceCandidate?: {
    candidate: any;
    target: string;
    from: string;
  };
  save?: {
    id: string;
  };
  createMeeting?: {
    meeting: Meeting;
  };
  getMeetingsByParticipantId?: {
    id: string;
  };
  enterMeeting?: {
    userId: string;
    meetingId: string;
  };
};

function handler(req: Request) {
  return websocket(req);
}

function websocket(req: Request): Response {
  let response, socket: SignalingWebSocket;

  try {
    ({ response, socket } = Deno.upgradeWebSocket(req));
  } catch {
    return new Response("request isn't trying to upgrade to websocket.");
  }

  socket.onopen = () => console.log("socket opened");

  socket.onmessage = async (e) => {
    const body: Body = JSON.parse(e.data);

    if (body.createMeeting) {
      meetingStore.createMeeting(body.createMeeting.meeting);
      socket.send(JSON.stringify({ msg: "Saved!" }));
    }

    if (body.getMeetingsByParticipantId) {
      await meetingStore.update();

      socket.send(
        JSON.stringify({
          meetings: meetingStore.getMeetingsByParticipantId(
            body.getMeetingsByParticipantId.id
          ),
        })
      );
    }

    if (body.save) {
      const { id } = body.save;
      if (socket.id) users.delete(socket.id);
      socket.id = id;
      users.set(id, { socket });
      socket.send(JSON.stringify({ msg: "Saved!" }));
    }

    if (body.videoOffer) {
      const { from, target, offer, meetingId } = body.videoOffer;
      users.set(from, { socket, session: offer });

      if (meetingId) {
        const targets = meetingStore.usersPerMeeting.get(meetingId);

        if (targets) {
          for (const target of targets) {
            const newBody = { videoOffer: { ...body.videoOffer, target } };
            users.get(target)?.socket.send(JSON.stringify(newBody));
          }
        }

        return;
      }

      const targetUser = users.get(target);

      if (targetUser) {
        socket.send(JSON.stringify({ msg: "target found" }));
        targetUser.socket.send(JSON.stringify(body));
      } else {
        console.log([...users.keys()]);
        socket.send(JSON.stringify({ msg: "target not found" }));
      }
    }

    if (body.videoAnswer) {
      const { from, target, answer } = body.videoAnswer;
      users.set(from, { socket, session: answer });
      const targetUser = users.get(target);

      if (targetUser) {
        socket.send(JSON.stringify({ msg: "target found" }));
        targetUser.socket.send(JSON.stringify(body));
      } else {
        console.log([...users.keys()]);
        socket.send(JSON.stringify({ msg: "target not found" }));
      }
    }

    if (body.iceCandidate) {
      const { target } = body.iceCandidate;
      const targetUser = users.get(target);

      if (targetUser) {
        targetUser.socket.send(JSON.stringify(body));
      }
    }

    if (body.enterMeeting) {
      const { meetingId, userId } = body.enterMeeting;
      const meeting = meetingStore.meetings.find((m) => m.id == meetingId);

      if (meeting) {
        meetingStore.enterMeeting(meetingId, userId);

        const usersOnline = meetingStore.usersPerMeeting.get(meetingId);
        if (usersOnline && usersOnline.size > 1) {
          socket.send(JSON.stringify({ msg: [...usersOnline] }));
        }
      }
    }

    console.log("socket message:", e.data.substring(0, 100));
    // socket.send(e.data);
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
