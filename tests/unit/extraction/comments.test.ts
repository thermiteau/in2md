import {
  extractComments,
  extractSingleComment,
  formatCommentAsMarkdown,
  formatCommentsAsMarkdown,
} from "../../../src/extraction/comments";

describe("extractSingleComment", () => {
  it("extracts comment data from classic DOM", () => {
    const article = document.createElement("article");
    article.classList.add("comments-comment-entity");
    article.innerHTML = `
      <div class="comments-comment-meta__description-title">Alice Smith</div>
      <a class="comments-comment-meta__description-container" href="/in/alice-smith/?someParam=1"></a>
      <div class="comments-comment-item__main-content">
        <div class="update-components-text">Great post!</div>
      </div>
    `;

    const result = extractSingleComment({ commentEl: article });
    expect(result).toEqual({
      name: "Alice Smith",
      profileUrl: "https://www.linkedin.com/in/alice-smith/",
      content: "Great post!",
      isReply: false,
      replies: [],
    });
  });

  it("detects reply comments", () => {
    const article = document.createElement("article");
    article.classList.add(
      "comments-comment-entity",
      "comments-comment-entity--reply",
    );
    article.innerHTML = `
      <div class="comments-comment-meta__description-title">Bob</div>
      <a class="comments-comment-meta__description-container" href="/in/bob/"></a>
      <div class="comments-comment-item__main-content">
        <div class="update-components-text">Thanks!</div>
      </div>
    `;

    const result = extractSingleComment({ commentEl: article });
    expect(result?.isReply).toBe(true);
  });

  it("returns null when no name element", () => {
    const article = document.createElement("article");
    article.classList.add("comments-comment-entity");

    const result = extractSingleComment({ commentEl: article });
    expect(result).toBeNull();
  });

  it("strips query params from profile URL", () => {
    const article = document.createElement("article");
    article.classList.add("comments-comment-entity");
    article.innerHTML = `
      <div class="comments-comment-meta__description-title">Test</div>
      <a class="comments-comment-meta__description-container" href="/in/test/?mini=urn"></a>
    `;

    const result = extractSingleComment({ commentEl: article });
    expect(result?.profileUrl).toBe("https://www.linkedin.com/in/test/");
  });
});

describe("extractComments — classic DOM", () => {
  it("extracts top-level comments", () => {
    const container = document.createElement("div");
    container.innerHTML = `
      <div class="comments-comment-list__container">
        <article class="comments-comment-entity">
          <div class="comments-comment-meta__description-title">Alice</div>
          <a class="comments-comment-meta__description-container" href="/in/alice/"></a>
          <div class="comments-comment-item__main-content">
            <div class="update-components-text">First comment</div>
          </div>
        </article>
        <article class="comments-comment-entity">
          <div class="comments-comment-meta__description-title">Bob</div>
          <a class="comments-comment-meta__description-container" href="/in/bob/"></a>
          <div class="comments-comment-item__main-content">
            <div class="update-components-text">Second comment</div>
          </div>
        </article>
      </div>
    `;

    const result = extractComments({ container });
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Alice");
    expect(result[1].name).toBe("Bob");
  });

  it("nests replies under parent comments", () => {
    const container = document.createElement("div");
    container.innerHTML = `
      <div class="comments-comment-list__container">
        <article class="comments-comment-entity">
          <div class="comments-comment-meta__description-title">Alice</div>
          <a class="comments-comment-meta__description-container" href="/in/alice/"></a>
          <div class="comments-comment-item__main-content">
            <div class="update-components-text">Parent comment</div>
          </div>
        </article>
        <article class="comments-comment-entity comments-comment-entity--reply">
          <div class="comments-comment-meta__description-title">Bob</div>
          <a class="comments-comment-meta__description-container" href="/in/bob/"></a>
          <div class="comments-comment-item__main-content">
            <div class="update-components-text">Reply to Alice</div>
          </div>
        </article>
      </div>
    `;

    const result = extractComments({ container });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Alice");
    expect(result[0].replies).toHaveLength(1);
    expect(result[0].replies[0].name).toBe("Bob");
  });

  it("returns empty array when no comments found", () => {
    const container = document.createElement("div");

    const result = extractComments({ container });
    expect(result).toEqual([]);
  });
});

describe("formatCommentAsMarkdown", () => {
  it("formats a single comment", () => {
    const result = formatCommentAsMarkdown({
      comment: {
        name: "Alice",
        profileUrl: "https://www.linkedin.com/in/alice/",
        content: "Great post!",
        isReply: false,
        replies: [],
      },
      indent: "",
    });

    expect(result).toBe(
      "**Alice** ([profile](https://www.linkedin.com/in/alice/))\nGreat post!",
    );
  });

  it("omits profile link when URL is empty", () => {
    const result = formatCommentAsMarkdown({
      comment: {
        name: "Bob",
        profileUrl: "",
        content: "Nice!",
        isReply: false,
        replies: [],
      },
      indent: "",
    });

    expect(result).toBe("**Bob**\nNice!");
  });

  it("indents replies with >", () => {
    const result = formatCommentAsMarkdown({
      comment: {
        name: "Alice",
        profileUrl: "",
        content: "Parent",
        isReply: false,
        replies: [
          {
            name: "Bob",
            profileUrl: "",
            content: "Reply",
            isReply: true,
            replies: [],
          },
        ],
      },
      indent: "",
    });

    expect(result).toContain("> **Bob**");
    expect(result).toContain("> Reply");
  });
});

describe("formatCommentsAsMarkdown", () => {
  it("joins multiple comments with separator", () => {
    const result = formatCommentsAsMarkdown({
      comments: [
        {
          name: "Alice",
          profileUrl: "",
          content: "First",
          isReply: false,
          replies: [],
        },
        {
          name: "Bob",
          profileUrl: "",
          content: "Second",
          isReply: false,
          replies: [],
        },
      ],
    });

    expect(result).toContain("**Alice**");
    expect(result).toContain("\n\n---\n\n");
    expect(result).toContain("**Bob**");
  });
});
