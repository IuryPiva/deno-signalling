import { MeetingStore } from "./meeting.ts";

Deno.test("create meeting", () => {
  const meetingStore = new MeetingStore();
  meetingStore.createMeeting({
    id: Date.now().toString(),
    participants: ["IPBC5042", "IPBC5041"],
    date: new Date(),
    title: "Test" + Date.now(),
  });
});

Deno.test("list meetings", async () => {
  const meetingStore = new MeetingStore();
  await meetingStore.update();
  console.log(meetingStore.meetings);
});

Deno.test("remove meeting", async () => {
  const meetingStore = new MeetingStore();
  await meetingStore.update();
  meetingStore.removeMeeting(meetingStore.meetings[0].id);
});

Deno.test("get meetings by participant id", async () => {
  const meetingStore = new MeetingStore();
  await meetingStore.update();
  console.log(meetingStore.meetings);
  console.log(meetingStore.getMeetingsByParticipantId("IPBC5041"));
});
