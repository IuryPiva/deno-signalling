export type Meeting = {
  participants: string[];
  date: Date;
  title: string;
  id: string;
};

export class MeetingStore {
  meetings: Meeting[] = [];
  usersPerMeeting: Map<string, Set<string>> = new Map();

  otherUsersOnMeeting(meetingId: string, userId: string) {
    const result: string[] = [];
    const targets = this.usersPerMeeting.get(meetingId);

    if (targets) {
      for (const target of targets) {
        if (target != userId) result.push(target);
      }
    }

    return result;
  }

  async update() {
    const json = await Deno.readTextFile("./meetings.json");
    this.meetings = JSON.parse(json);
  }

  createMeeting(meeting: Meeting) {
    this.meetings.push(meeting);
    Deno.writeTextFile("./meetings.json", JSON.stringify(this.meetings));
  }

  removeMeeting(id: string) {
    this.meetings = this.meetings.filter((m) => m.id != id);
    Deno.writeTextFile("./meetings.json", JSON.stringify(this.meetings));
  }

  getMeetingsByParticipantId(id: string) {
    return this.meetings.filter((meeting) => meeting.participants.includes(id));
  }

  enterMeeting(meetingId: string, userId: string) {
    const users = this.usersPerMeeting.get(meetingId);

    if (users) {
      this.usersPerMeeting.set(meetingId, new Set([...users, userId]));
    } else {
      this.usersPerMeeting.set(meetingId, new Set([userId]));
    }
  }

  leaveMeeting(meetingId: string, userId: string) {
    const users = this.usersPerMeeting.get(meetingId);

    if (users) {
      users.delete(userId);
      this.usersPerMeeting.set(meetingId, users);
    }
  }
}
