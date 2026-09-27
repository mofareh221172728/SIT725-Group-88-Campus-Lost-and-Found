"use strict";

const { expect } = require("chai");
const request = require("supertest");
const { app } = require("../../server");
const User = require("../../models/user.model");
const HelpQuestion = require("../../models/helpQuestion.model");
const HelpReply = require("../../models/helpReply.model");
const db = require("../helpers/db");
const seed = require("../helpers/seed");

describe("Help Routes - Authentication and authorization", () => {
  before(db.connect);
  beforeEach(seed.seedAll);
  afterEach(db.clearCollections);
  after(db.disconnect);

  const ALICE = 0;
  const BOB = 1;
  const ADMIN = 2;

  const validQuestion = {
    title: "Where do I collect a dropped-off item?",
    body: "The report says Campus Security. Which building is that in?",
    category: "finding",
  };

  async function login(index) {
    const agent = request.agent(app);
    const response = await agent.post("/api/auth/login")
      .send({ email: seed.sampleUsers[index].email });
    expect(response.status).to.equal(200);
    return agent;
  }

  async function createQuestion(agent, data = validQuestion) {
    const response = await agent.post("/api/help/questions").send(data);
    expect(response.status).to.equal(201);
    return response.body.question;
  }

  describe("[SESSION] Logged-in user must still exist", () => {
    it("HELP-AUTH-01: rejects a session whose user was deleted", async () => {
      const alice = await login(ALICE);
      await User.deleteOne({ _id: seed.testUserIds.alice });

      const list = await alice.get("/api/help/questions");
      const create = await alice.post("/api/help/questions").send(validQuestion);

      expect(list.status).to.equal(401);
      expect(create.status).to.equal(401);
      expect(await HelpQuestion.countDocuments()).to.equal(0);
    });
  });

  describe("[OWNER] Students can only use their own questions", () => {
    it("HELP-AUTH-02: blocks another student from viewing, editing, deleting or replying", async () => {
      const alice = await login(ALICE);
      const bob = await login(BOB);
      const question = await createQuestion(alice);
      const url = `/api/help/questions/${question.id}`;

      expect((await bob.get(url)).status).to.equal(403);
      expect((await bob.put(url).send({ title: "Bob changed this" })).status).to.equal(403);
      expect((await bob.delete(url)).status).to.equal(403);
      expect((await bob.post(`${url}/replies`).send({ body: "Bob reply" })).status).to.equal(403);

      const stored = await HelpQuestion.findById(question.id).lean();
      expect(stored.title).to.equal(validQuestion.title);
      expect(await HelpReply.countDocuments()).to.equal(0);
    });

    it("HELP-AUTH-03: still returns 404 for a missing question before checking access", async () => {
      const bob = await login(BOB);
      const response = await bob.get("/api/help/questions/650000000000000000000999");
      expect(response.status).to.equal(404);
    });
  });

  describe("[ADMIN] Admins can answer and moderate", () => {
    it("HELP-AUTH-04: lets an admin view a student's question with its replies", async () => {
      const alice = await login(ALICE);
      const admin = await login(ADMIN);
      const question = await createQuestion(alice);

      const response = await admin.get(`/api/help/questions/${question.id}`);

      expect(response.status).to.equal(200);
      expect(response.body.question.ownerId).to.equal(String(seed.testUserIds.alice));
    });

    it("HELP-AUTH-05: does not let an admin change the wording of a student's question", async () => {
      const alice = await login(ALICE);
      const admin = await login(ADMIN);
      const question = await createQuestion(alice);

      const response = await admin.put(`/api/help/questions/${question.id}`)
        .send({ title: "Admin changed this" });

      expect(response.status).to.equal(403);
      expect((await HelpQuestion.findById(question.id)).title).to.equal(validQuestion.title);
    });

    it("HELP-AUTH-06: lets an admin delete a student's question and its replies", async () => {
      const alice = await login(ALICE);
      const admin = await login(ADMIN);
      const question = await createQuestion(alice);
      await alice.post(`/api/help/questions/${question.id}/replies`).send({ body: "Any update?" });

      const response = await admin.delete(`/api/help/questions/${question.id}`);

      expect(response.status).to.equal(200);
      expect(await HelpQuestion.countDocuments()).to.equal(0);
      expect(await HelpReply.countDocuments()).to.equal(0);
    });
  });

  describe("[STATUS] Replies update the question status", () => {
    it('HELP-AUTH-07: an admin reply marks the question "answered"', async () => {
      const alice = await login(ALICE);
      const admin = await login(ADMIN);
      const question = await createQuestion(alice);

      const response = await admin.post(`/api/help/questions/${question.id}/replies`)
        .send({ body: "Campus Security is in Building B." });

      expect(response.status).to.equal(201);
      expect(response.body.questionStatus).to.equal("answered");
      expect((await HelpQuestion.findById(question.id)).status).to.equal("answered");
    });

    it('HELP-AUTH-08: a follow-up from the owner opens the question again', async () => {
      const alice = await login(ALICE);
      const admin = await login(ADMIN);
      const question = await createQuestion(alice);
      const url = `/api/help/questions/${question.id}/replies`;
      await admin.post(url).send({ body: "Campus Security is in Building B." });

      const response = await alice.post(url).send({ body: "What time does it open?" });

      expect(response.status).to.equal(201);
      expect(response.body.questionStatus).to.equal("open");
      expect((await HelpQuestion.findById(question.id)).status).to.equal("open");
    });
  });

  describe("[SCOPE] Listing all questions", () => {
    it("HELP-AUTH-09: lets an admin list every student's questions", async () => {
      const alice = await login(ALICE);
      const bob = await login(BOB);
      const admin = await login(ADMIN);
      await createQuestion(alice);
      await createQuestion(bob, { ...validQuestion, title: "Bob's own question" });

      const all = await admin.get("/api/help/questions?scope=all");
      const mine = await admin.get("/api/help/questions");

      expect(all.status).to.equal(200);
      expect(all.body.questions).to.have.length(2);
      expect(mine.body.questions).to.have.length(0);
    });

    it("HELP-AUTH-11: shows admins who asked each question", async () => {
      const alice = await login(ALICE);
      const admin = await login(ADMIN);
      await createQuestion(alice);

      const all = await admin.get("/api/help/questions?scope=all");
      const mine = await alice.get("/api/help/questions");

      expect(all.body.questions[0].ownerEmail).to.equal(seed.sampleUsers[ALICE].email);
      expect(mine.body.questions[0]).to.not.have.property("ownerEmail");
    });

    it("HELP-AUTH-10: rejects scope=all for a student and an unknown scope", async () => {
      const alice = await login(ALICE);
      await createQuestion(alice);

      expect((await alice.get("/api/help/questions?scope=all")).status).to.equal(403);
      expect((await alice.get("/api/help/questions?scope=everyone")).status).to.equal(400);
      expect((await alice.get("/api/help/questions?scope=mine")).body.questions).to.have.length(1);
    });
  });
});
