"use strict";

const { expect } = require("chai");
const {
  faqMatches,
  normaliseText,
  validateQuestion,
  validateReply,
  escapeHtml,
  questionItemHTML,
  replyListHTML,
  replyAuthorLabel,
  editFormHTML,
  formatHelpDate,
} = require("../../public/js/help");

describe("Help page frontend helpers", () => {
  const faq = {
    category: "reporting",
    question: "Can I add photos to my report?",
    answer: "Yes. You can add up to three photos.",
  };

  it("HP-01: shows every FAQ when there is no search text and All is selected", () => {
    expect(faqMatches(faq, "", "all")).to.equal(true);
  });

  it("HP-02: matches search text in the question or answer, ignoring case", () => {
    expect(faqMatches(faq, "PHOTOS", "all")).to.equal(true);
    expect(faqMatches(faq, "three", "all")).to.equal(true);
  });

  it("HP-03: requires every search word to match", () => {
    expect(faqMatches(faq, "photos report", "all")).to.equal(true);
    expect(faqMatches(faq, "photos drop-off", "all")).to.equal(false);
  });

  it("HP-04: hides FAQs outside the selected category", () => {
    expect(faqMatches(faq, "", "reporting")).to.equal(true);
    expect(faqMatches(faq, "", "managing")).to.equal(false);
  });

  it("HP-05: normalises extra spaces in search text", () => {
    expect(normaliseText("  Add   Photos ")).to.equal("add photos");
    expect(faqMatches(faq, "  add   photos  ", "all")).to.equal(true);
  });
});

describe("Help page question form and list helpers", () => {
  const validInput = {
    title: "Where is Campus Security?",
    body: "Which building is Campus Security in?",
    category: "finding",
  };

  it("HP-06: accepts a valid question and trims the text", () => {
    const result = validateQuestion({ ...validInput, title: "  Where is Campus Security?  " });
    expect(result.valid).to.equal(true);
    expect(result.errors).to.deep.equal({});
    expect(result.values.title).to.equal("Where is Campus Security?");
  });

  it("HP-07: reports missing, short and long fields with the model limits", () => {
    expect(validateQuestion({ ...validInput, title: "   " }).errors.title).to.equal("Title is required.");
    expect(validateQuestion({ ...validInput, title: "Help" }).errors.title)
      .to.equal("Title must be at least 5 characters.");
    expect(validateQuestion({ ...validInput, body: "Too short" }).errors.body)
      .to.equal("Question must be at least 10 characters.");
    expect(validateQuestion({ ...validInput, body: "a".repeat(2001) }).errors.body)
      .to.equal("Question must be 2000 characters or fewer.");
  });

  it('HP-08: defaults a missing category to "other"', () => {
    expect(validateQuestion({ title: validInput.title, body: validInput.body }).values.category)
      .to.equal("other");
  });

  it("HP-09: escapes user text before showing it on the page", () => {
    expect(escapeHtml('<img src=x onerror="alert(1)">'))
      .to.equal("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");

    const html = questionItemHTML({
      id: "q1",
      title: "<script>alert(1)</script>",
      body: "Body",
      category: "finding",
      status: "open",
      createdAt: "2026-09-27T01:00:00.000Z",
    });
    expect(html).to.not.include("<script>");
    expect(html).to.include("&lt;script&gt;");
  });

  it("HP-10: shows the question status and category", () => {
    const base = { id: "q1", title: "Title here", body: "Body", category: "finding" };
    expect(questionItemHTML({ ...base, status: "open" })).to.include(">Open<");
    expect(questionItemHTML({ ...base, status: "answered" })).to.include(">Answered<");
    expect(questionItemHTML({ ...base, status: "open" })).to.include("Finding");
  });

  it('HP-11: labels replies for a student viewing their own question', () => {
    const html = replyListHTML([
      { authorId: "admin1", body: "Building B.", createdAt: "2026-09-27T01:00:00.000Z" },
      { authorId: "owner1", body: "Thanks!", createdAt: "2026-09-27T02:00:00.000Z" },
    ], "owner1", "owner1");

    expect(html.indexOf("Admin")).to.be.lessThan(html.indexOf("You"));
    expect(replyListHTML([], "owner1", "owner1")).to.include("No replies yet");
  });

  it('HP-12: labels replies for an admin viewing a student question', () => {
    expect(replyAuthorLabel("admin1", "admin1", "owner1")).to.equal("You");
    expect(replyAuthorLabel("owner1", "admin1", "owner1")).to.equal("Student");
    expect(replyAuthorLabel("admin2", "admin1", "owner1")).to.equal("Admin");
  });

  it("HP-13: shows who asked the question only in the admin view", () => {
    const question = {
      id: "q1",
      ownerId: "owner1",
      ownerEmail: "alice@deakin.edu.au",
      title: "Title here",
      body: "Body",
      category: "finding",
      status: "open",
    };

    expect(questionItemHTML(question, { isAdmin: true })).to.include("From alice@deakin.edu.au");
    expect(questionItemHTML(question, { isAdmin: true })).to.include("Reply to student");
    expect(questionItemHTML(question)).to.not.include("alice@deakin.edu.au");
    expect(questionItemHTML(question)).to.include("Add a follow-up");
  });

  it("HP-14: checks reply length with the model limits", () => {
    expect(validateReply("  Thanks!  ")).to.deep.equal({ body: "Thanks!", error: "", valid: true });
    expect(validateReply("   ").error).to.equal("Reply is required.");
    expect(validateReply("a").error).to.equal("Reply must be at least 2 characters.");
    expect(validateReply("a".repeat(1001)).error).to.equal("Reply must be 1000 characters or fewer.");
  });

  it("HP-15: shows Edit only to the owner and Delete to owner and admin", () => {
    const question = { id: "q1", ownerId: "o1", title: "Title here", body: "Body", category: "other", status: "open" };
    const studentView = questionItemHTML(question);
    const adminView = questionItemHTML(question, { isAdmin: true });

    expect(studentView).to.include('data-action="edit"');
    expect(studentView).to.include('data-action="delete"');
    expect(adminView).to.not.include('data-action="edit"');
    expect(adminView).to.include('data-action="delete"');
  });

  it("HP-16: prefills the edit form with the saved question, escaped", () => {
    const html = editFormHTML({
      id: "q1",
      title: 'Lost "blue" bag',
      body: "<b>Near library</b>",
      category: "finding",
    });

    expect(html).to.include('value="Lost &quot;blue&quot; bag"');
    expect(html).to.include("&lt;b&gt;Near library&lt;/b&gt;");
    expect(html).to.include('<option value="finding" selected>');
  });

  it("HP-17: shows the date and time of questions and replies", () => {
    const text = formatHelpDate("2026-09-27T05:05:00.000Z");
    expect(text).to.match(/^\d{1,2} \w+ 2026, \d{1,2}:\d{2}\s?(am|pm)$/i);
    expect(formatHelpDate("not-a-date")).to.equal("");
  });
});
