"use strict";

// Card #120: end-to-end Help CRUD flows across students and an admin.
// The route tests check each endpoint on its own; these follow a question
// through its whole life, the way the Help page uses the API.

const { expect } = require("chai");
const request = require("supertest");
const { app } = require("../../server");
const HelpQuestion = require("../../models/helpQuestion.model");
const HelpReply = require("../../models/helpReply.model");
const db = require("../helpers/db");
const seed = require("../helpers/seed");

describe("Help CRUD integration flows", () => {
  const STUDENT = 0;
  const OTHER_STUDENT = 1;
  const ADMIN = 2;

  before(db.connect);
  beforeEach(async () => {
    await db.clearCollections();
    await seed.seedUsers();
  });
  afterEach(db.clearCollections);
  after(db.disconnect);

  async function login(index) {
    const agent = request.agent(app);
    const response = await agent
      .post("/api/auth/login")
      .send({ email: seed.sampleUsers[index].email });
    expect(response.status).to.equal(200);
    return agent;
  }

  const newQuestion = {
    title: "Where do I collect a dropped-off item?",
    body: "My report says Campus Security. Which building is that in?",
    category: "finding",
  };

  it("HELP-INT-01: a question goes through create, update, reply, follow-up and delete", async () => {
    const student = await login(STUDENT);
    const admin = await login(ADMIN);

    // Create
    const created = await student.post("/api/help/questions").send(newQuestion);
    expect(created.status).to.equal(201);
    const id = created.body.question.id;
    const url = `/api/help/questions/${id}`;
    expect(created.body.question.status).to.equal("open");

    // Read: the student sees it in their own list
    const myList = await student.get("/api/help/questions");
    expect(myList.body.questions.map((q) => q.id)).to.deep.equal([id]);

    // Update: the student rewords the question
    const updated = await student.put(url).send({
      title: "Where is Campus Security at Burwood?",
      category: "other",
    });
    expect(updated.status).to.equal(200);
    expect(updated.body.question).to.include({
      title: "Where is Campus Security at Burwood?",
      body: newQuestion.body,
      category: "other",
    });

    // Read: the admin sees the updated question in the list of all questions
    const allList = await admin.get("/api/help/questions?scope=all");
    expect(allList.status).to.equal(200);
    const seenByAdmin = allList.body.questions.find((q) => q.id === id);
    expect(seenByAdmin.title).to.equal("Where is Campus Security at Burwood?");

    // Create reply: the admin answers, so the question becomes "answered"
    const adminReply = await admin.post(`${url}/replies`)
      .send({ body: "It is in Building B, ground floor." });
    expect(adminReply.status).to.equal(201);
    expect(adminReply.body.questionStatus).to.equal("answered");

    // Create reply: the student follows up, so it opens again
    const followUp = await student.post(`${url}/replies`)
      .send({ body: "Thanks! What time does it open?" });
    expect(followUp.status).to.equal(201);
    expect(followUp.body.questionStatus).to.equal("open");

    // Read: the thread shows both replies, oldest first, with their authors
    const thread = await student.get(url);
    expect(thread.status).to.equal(200);
    expect(thread.body.question.status).to.equal("open");
    expect(thread.body.question.replies.map((r) => r.body)).to.deep.equal([
      "It is in Building B, ground floor.",
      "Thanks! What time does it open?",
    ]);
    expect(thread.body.question.replies.map((r) => r.authorId)).to.deep.equal([
      String(seed.testUserIds.admin),
      String(seed.testUserIds.alice),
    ]);

    // Delete: the question and its replies are removed for everyone
    const deleted = await student.delete(url);
    expect(deleted.status).to.equal(200);
    expect((await student.get(url)).status).to.equal(404);
    expect((await admin.get("/api/help/questions?scope=all")).body.questions).to.deep.equal([]);
    expect(await HelpQuestion.countDocuments()).to.equal(0);
    expect(await HelpReply.countDocuments()).to.equal(0);
  });

  it("HELP-INT-02: questions and replies are still there after logging out and back in", async () => {
    const student = await login(STUDENT);
    const created = await student.post("/api/help/questions").send(newQuestion);
    const url = `/api/help/questions/${created.body.question.id}`;
    await (await login(ADMIN)).post(`${url}/replies`).send({ body: "Building B." });

    expect((await student.post("/api/auth/logout")).status).to.equal(200);
    expect((await student.get("/api/help/questions")).status).to.equal(401);

    const again = await login(STUDENT);
    const thread = await again.get(url);

    expect(thread.status).to.equal(200);
    expect(thread.body.question.status).to.equal("answered");
    expect(thread.body.question.replies).to.have.length(1);
  });

  it("HELP-INT-03: another student cannot see or change the question at any step", async () => {
    const student = await login(STUDENT);
    const other = await login(OTHER_STUDENT);
    const admin = await login(ADMIN);
    const created = await student.post("/api/help/questions").send(newQuestion);
    const url = `/api/help/questions/${created.body.question.id}`;

    expect((await other.get("/api/help/questions")).body.questions).to.deep.equal([]);
    expect((await other.get(url)).status).to.equal(403);
    expect((await other.put(url).send({ title: "Changed by someone else" })).status).to.equal(403);
    expect((await other.post(`${url}/replies`).send({ body: "Not mine" })).status).to.equal(403);
    expect((await other.delete(url)).status).to.equal(403);

    // The admin can moderate: deleting it removes it for the owner as well
    expect((await admin.delete(url)).status).to.equal(200);
    expect((await student.get(url)).status).to.equal(404);
    expect((await student.get("/api/help/questions")).body.questions).to.deep.equal([]);
  });
});
