import { serveTls } from "https://deno.land/std@0.140.0/http/server.ts";

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

type User = { socket: WebSocket; session: RTCSessionDescriptionInit };

const users: Map<string, User> = new Map();

type Body = {
  videoOffer?: {
    from: string;
    target: string;
    offer: RTCSessionDescriptionInit;
  };
  videoAnswer?: {
    from: string;
    target: string;
    answer: RTCSessionDescriptionInit;
  };
  iceCandidate?: {
    candidate: any;
    target: string;
    from: string;
  };
  save?: {
    id: string;
    session: RTCSessionDescriptionInit;
  };
};

function handler(req: Request) {
  return websocket(req);
}

function websocket(req: Request): Response {
  let response, socket: WebSocket;

  try {
    ({ response, socket } = Deno.upgradeWebSocket(req));
  } catch {
    return new Response("request isn't trying to upgrade to websocket.");
  }

  socket.onopen = () => console.log("socket opened");

  socket.onmessage = (e) => {
    const body: Body = JSON.parse(e.data);

    if (body.save) {
      const { id, session } = body.save;
      users.set(id, { socket, session });
      socket.send(JSON.stringify({ msg: "Saved!" }));
    }

    if (body.videoOffer) {
      const { from, target, offer } = body.videoOffer;
      users.set(from, { socket, session: offer });
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

    console.log("socket message:", e.data.substring(0, 100));
    // socket.send(e.data);
  };

  socket.onerror = (e) => console.log("socket errored:", e);
  socket.onclose = () => console.log("socket closed");

  return response;
}

serveTls(handler, {
  certFile: "./cert.pem",
  keyFile: "./key.pem",
});
