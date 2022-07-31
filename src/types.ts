export type WebRTCMeeting = {
  participants: string[];
  date: Date;
  title: string;
  id: string;
};

export interface RTCIceCandidateInit {
  candidate?: string;
  sdpMLineIndex?: number | null;
  sdpMid?: string | null;
  usernameFragment?: string | null;
}

type RTCSdpType = "answer" | "offer" | "pranswer" | "rollback";

export interface RTCSessionDescriptionInit {
  sdp?: string;
  type: RTCSdpType;
}

export interface OfferMessage {
  from: string;
  target: string;
  sessionDescription: RTCSessionDescriptionInit;
}

export interface AnswerMessage {
  from: string;
  target: string;
  sessionDescription: RTCSessionDescriptionInit;
}

export interface IceCandidateMessage {
  candidate: RTCIceCandidateInit;
  target: string;
  from: string;
}

export interface SaveMessage {
  id: string;
}

export interface CreateMeetingMessage {
  meeting: WebRTCMeeting;
}

export interface GetMeetingsByParticipantIdMessage {
  id: string;
}

export interface EnterMeetingMessage {
  id: string;
}

export interface SignalerMessage {
  offer?: OfferMessage;
  answer?: AnswerMessage;
  iceCandidate?: IceCandidateMessage;
  enterMeeting?: EnterMeetingMessage;
  msg?: any;
}

export type SignalerMessageHandlers = {
  [Property in keyof SignalerMessage as `handle${Capitalize<
    string & Property
  >}`]-?: (msg: NonNullable<SignalerMessage[Property]>) => void;
};
