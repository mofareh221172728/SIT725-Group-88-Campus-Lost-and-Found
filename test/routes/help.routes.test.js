"use strict";

const { expect } = require("chai");
const request = require("supertest");
const { app } = require("../../server");
const HelpQuestion = require("../../models/helpQuestion.model");
const HelpReply = require("../../models/helpReply.model");
const db = require("../helpers/db");
const seed = require("../helpers/seed");

describe("Help Routes - Question and reply CRUD", () => {
  before(db.connect);
  beforeEach(seed.seedAll);
  afterEach(db.clearCollections);
  after(db.disconnect);

  const validQuestion = {
    title: "Where do I collect a dropped-off item?",
    body: "The report says Campus Security. Which building is that in?",
    category: "finding",
  };

  async function login(index = 0) {
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

  describe("Authentication", () => {
    it("HELP-01: rejects every Help endpoint without a session", async () => {
      const id = "650000000000000000000999";
      const responses = await Promise.all([
        request(app).get("/api/help/questions"),
        request(app).post("/api/help/questions").send(validQuestion),
        request(app).get(`/api/help/questions/${id}`),
        request(app).put(`/api/help/questions/${id}`).send({ title: "Updated title" }),
        request(app).delete(`/api/help/questions/${id}`),
        request(app).post(`/api/help/questions/${id}/replies`).send({ body: "Hello" }),
      ]);

      responses.forEach((response) => expect(response.status).to.equal(401));
      expect(await HelpQuestion.countDocuments()).to.equal(0);
    });
  });

  describe("POST /api/help/questions", () => {
    it("HELP-02: creates a question owned by the logged-in user", async () => {
      const agent = await login();
      const question = await createQuestion(agent);

      expect(question).to.include({
        ownerId: String(seed.testUserIds.alice),
        title: validQuestion.title,
        body: validQuestion.body,
        category: "finding",
        status: "open",
      });
      expect(await HelpQuestion.countDocuments()).to.equal(1);
    });

    it('HELP-03: defaults the category to "other" when it is not given', async () => {
      const agent = await login();
      const question = await createQuestion(agent, {
        title: validQuestion.title,
        body: validQuestion.body,
      });
      expect(question.category).to.equal("other");
    });

    it("HELP-04: rejects missing, invalid and unsupported fields", async () => {
      const agent = await login();
      const invalidBodies = [
        { body: validQuestion.body },
        { ...validQuestion, title: "Help" },
        { ...validQuestion, category: "billing" },
        { ...validQuestion, title: 12345 },
        { ...validQuestion, status: "answered" },
        { ...validQuestion, ownerId: String(seed.testUserIds.bob) },
      ];

      for (const body of invalidBodies) {
        const response = await agent.post("/api/help/questions").send(body);
        expect(response.status, JSON.stringify(body)).to.equal(400);
      }
      expect(await HelpQuestion.countDocuments()).to.equal(0);
    });
  });

  describe("GET /api/help/questions", () => {
    it("HELP-05: lists only the current user's questions, newest first", async () => {
      const alice = await login(0);
      const bob = await login(1);
      const first = await createQuestion(alice);
      const second = await createQuestion(alice, { ...validQuestion, title: "How do I edit a report?" });
      await createQuestion(bob, { ...validQuestion, title: "Bob's own question" });

      const response = await alice.get("/api/help/questions");

      expect(response.status).to.equal(200);
      expect(response.body.questions.map((q) => q.id)).to.deep.equal([second.id, first.id]);
    });

    it("HELP-06: returns an empty list when the user has no questions", async () => {
      const response = await (await login()).get("/api/help/questions");
      expect(response.status).to.equal(200);
      expect(response.body.questions).to.deep.equal([]);
    });
  });

  describe("GET /api/help/questions/:id", () => {
    it("HELP-07: returns a question with its replies, oldest first", async () => {
      const agent = await login();
      const question = await createQuestion(agent);
      await agent.post(`/api/help/questions/${question.id}/replies`).send({ body: "First reply" });
      await agent.post(`/api/help/questions/${question.id}/replies`).send({ body: "Second reply" });

      const response = await agent.get(`/api/help/questions/${question.id}`);

      expect(response.status).to.equal(200);
      expect(response.body.question.title).to.equal(validQuestion.title);
      expect(response.body.question.replies.map((r) => r.body))
        .to.deep.equal(["First reply", "Second reply"]);
    });

    it("HELP-08: returns 400 for an invalid ID and 404 for a missing question", async () => {
      const agent = await login();
      expect((await agent.get("/api/help/questions/not-an-id")).status).to.equal(400);
      expect((await agent.get("/api/help/questions/650000000000000000000999")).status).to.equal(404);
    });
  });

  describe("PUT /api/help/questions/:id", () => {
    it("HELP-09: updates the title, body and category", async () => {
      const agent = await login();
      const question = await createQuestion(agent);

      const response = await agent.put(`/api/help/questions/${question.id}`)
        .send({ title: "  Where is Campus Security?  ", category: "other" });

      expect(response.status).to.equal(200);
      expect(response.body.question).to.include({
        title: "Where is Campus Security?",
        body: validQuestion.body,
        category: "other",
      });
    });

    it("HELP-10: rejects empty, invalid and unsupported updates", async () => {
      const agent = await login();
      const question = await createQuestion(agent);
      const url = `/api/help/questions/${question.id}`;

      for (const body of [{}, { title: "Hi" }, { status: "answered" }, { ownerId: "x" }]) {
        const response = await agent.put(url).send(body);
        expect(response.status, JSON.stringify(body)).to.equal(400);
      }

      const stored = await HelpQuestion.findById(question.id).lean();
      expect(stored.title).to.equal(validQuestion.title);
      expect(stored.status).to.equal("open");
    });

    it("HELP-11: returns 404 when updating a missing question", async () => {
      const response = await (await login())
        .put("/api/help/questions/650000000000000000000999")
        .send({ title: "Updated title" });
      expect(response.status).to.equal(404);
    });
  });

  describe("DELETE /api/help/questions/:id", () => {
    it("HELP-12: deletes the question and its replies", async () => {
      const agent = await login();
      const question = await createQuestion(agent);
      await agent.post(`/api/help/questions/${question.id}/replies`).send({ body: "A reply" });

      const response = await agent.delete(`/api/help/questions/${question.id}`);

      expect(response.status).to.equal(200);
      expect(await HelpQuestion.countDocuments()).to.equal(0);
      expect(await HelpReply.countDocuments()).to.equal(0);
    });

    it("HELP-13: returns 404 when deleting a missing question", async () => {
      const response = await (await login()).delete("/api/help/questions/650000000000000000000999");
      expect(response.status).to.equal(404);
    });
  });

  describe("POST /api/help/questions/:id/replies", () => {
    it("HELP-14: adds a reply written by the logged-in user", async () => {
      const alice = await login(0);
      const admin = await login(2);
      const question = await createQuestion(alice);

      const response = await admin.post(`/api/help/questions/${question.id}/replies`)
        .send({ body: "  Campus Security is in Building B.  " });

      expect(response.status).to.equal(201);
      expect(response.body.reply).to.include({
        questionId: question.id,
        authorId: String(seed.testUserIds.admin),
        body: "Campus Security is in Building B.",
      });
    });

    it("HELP-15: rejects an invalid reply and a reply to a missing question", async () => {
      const agent = await login();
      const question = await createQuestion(agent);
      const url = `/api/help/questions/${question.id}/replies`;

      expect((await agent.post(url).send({})).status).to.equal(400);
      expect((await agent.post(url).send({ body: "a" })).status).to.equal(400);
      expect((await agent.post(url).send({ body: "Hi", authorId: "x" })).status).to.equal(400);
      expect((await agent.post("/api/help/questions/650000000000000000000999/replies")
        .send({ body: "Hello" })).status).to.equal(404);
      expect(await HelpReply.countDocuments()).to.equal(0);
    });
  });
});
