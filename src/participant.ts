import {
  AnswerMessage,
  EnterMeetingMessage,
  IceCandidateMessage,
  OfferMessage,
  RTCSessionDescriptionInit,
  SignalerMessage,
} from "./types.ts";

export type Participant = {
  socket: WebSocket;
  sessionDescription?: RTCSessionDescriptionInit;
};

export class ParticipantStore {
  participants: Map<string, Participant> = new Map();

  private sendTo(target: string, message: SignalerMessage) {
    const targetParticipant = this.participants.get(target);

    if (
      targetParticipant &&
      targetParticipant.socket.readyState == targetParticipant.socket.OPEN
    ) {
      targetParticipant.socket.send(JSON.stringify(message));
    }
  }

  save(id: string, socket: WebSocket) {
    this.participants.set(id, { socket });
  }

  handleOffer(offer: OfferMessage) {
    this.sendTo(offer.target, { offer });
  }

  handleAnswer(answer: AnswerMessage) {
    this.sendTo(answer.target, { answer });
  }

  handleIceCandidate(iceCandidate: IceCandidateMessage) {
    this.sendTo(iceCandidate.target, { iceCandidate });
  }

  handleEnterMeeting(
    enterMeeting: EnterMeetingMessage,
    socket: WebSocket
  ): void {
    this.save(enterMeeting.id, socket);

    for (const target of this.participants.keys()) {
      if (target === enterMeeting.id) continue;
      this.sendTo(target, { enterMeeting });
    }

    this.sendTo(enterMeeting.id, { msg: "Entered" });
  }
}
