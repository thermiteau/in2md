import {
  formatPostAsMarkdown,
  extractPostContent,
  extractPostContentClassic,
} from "../../../src/extraction/post"

describe("formatPostAsMarkdown", () => {
  it("formats complete post data", () => {
    const result = formatPostAsMarkdown({
      data: {
        actor: {
          name: "Alice Smith",
          title: "Engineer",
          profileUrl: "https://www.linkedin.com/in/alice",
          profileType: "Premium",
          connectionDistance: "2nd",
          verified: false,
        },
        content: "This is my post content.",
        hashtags: ["#tech", "#coding"],
        postUrl: "https://www.linkedin.com/feed/update/urn:li:activity:123/",
      },
    })

    expect(result).toBe(
      [
        "**Alice Smith**",
        "- Title: Engineer",
        "- Profile: [Profile](https://www.linkedin.com/in/alice)",
        "- Profile Type: Premium",
        "- Verified: false",
        "- Distance: 2nd",
        "- Post: [Link](https://www.linkedin.com/feed/update/urn:li:activity:123/)",
        "",
        "---",
        "",
        "This is my post content.",
        "",
        "#tech #coding",
      ].join("\n"),
    )
  })

  it("omits hashtags section when empty", () => {
    const result = formatPostAsMarkdown({
      data: {
        actor: {
          name: "Bob",
          title: "",
          profileUrl: "",
          profileType: null,
          connectionDistance: null,
          verified: false,
        },
        content: "Just some text.",
        hashtags: [],
        postUrl: null,
      },
    })

    expect(result).not.toContain("#")
    expect(result).toContain("Just some text.")
  })

  it("omits post URL when null", () => {
    const result = formatPostAsMarkdown({
      data: {
        actor: {
          name: "Test",
          title: "",
          profileUrl: "",
          profileType: null,
          connectionDistance: null,
          verified: false,
        },
        content: "Content.",
        hashtags: [],
        postUrl: null,
      },
    })

    expect(result).not.toContain("Post:")
  })
})

describe("extractPostContent", () => {
  it("extracts content from feed DOM with expandable text box", () => {
    const container = document.createElement("div")

    const textBox = document.createElement("div")
    textBox.setAttribute("data-testid", "expandable-text-box")
    textBox.textContent = "Hello world, this is a post."
    container.appendChild(textBox)

    const result = extractPostContent({ postContainer: container })
    expect(result).toEqual({
      content: "Hello world, this is a post.",
      hashtags: [],
    })
  })

  it("extracts and removes hashtags from content", () => {
    const container = document.createElement("div")

    const textBox = document.createElement("div")
    textBox.setAttribute("data-testid", "expandable-text-box")

    textBox.innerHTML =
      'Great post about coding <a href="/feed/hashtag/?keywords=HASH_TAG_FROM_FEED">#coding</a>'

    container.appendChild(textBox)

    const result = extractPostContent({ postContainer: container })
    expect(result?.hashtags).toEqual(["#coding"])
    expect(result?.content).not.toContain("#coding")
  })

  it("returns null when no text box found", () => {
    const container = document.createElement("div")

    const result = extractPostContent({ postContainer: container })
    expect(result).toBeNull()
  })

  it("cleans up excessive blank lines", () => {
    const container = document.createElement("div")

    const textBox = document.createElement("div")
    textBox.setAttribute("data-testid", "expandable-text-box")
    textBox.innerHTML = "Line one<br><br><br><br>Line two"
    container.appendChild(textBox)

    const result = extractPostContent({ postContainer: container })
    expect(result?.content).toBe("Line one\n\nLine two")
  })
})

describe("extractPostContentClassic", () => {
  it("extracts content from classic post page DOM", () => {
    const container = document.createElement("div")
    container.innerHTML = `
      <div class="update-components-text">
        <span class="break-words">This is a classic post.</span>
      </div>
    `

    const result = extractPostContentClassic({ postContainer: container })
    expect(result).toEqual({
      content: "This is a classic post.",
      hashtags: [],
    })
  })

  it("returns null when no text container", () => {
    const container = document.createElement("div")

    const result = extractPostContentClassic({ postContainer: container })
    expect(result).toBeNull()
  })
})
