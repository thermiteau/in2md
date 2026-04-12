import { htmlToMarkdown } from "../../../src/lib/markdown"

describe("htmlToMarkdown", () => {
  it("returns text content from text nodes", () => {
    const text = document.createTextNode("Hello world")
    expect(htmlToMarkdown({ node: text })).toBe("Hello world")
  })

  it("returns empty string for comment nodes", () => {
    const comment = document.createComment("a comment")
    expect(htmlToMarkdown({ node: comment })).toBe("")
  })

  it("converts <br> to newline", () => {
    const div = document.createElement("div")
    div.innerHTML = "line one<br>line two"
    expect(htmlToMarkdown({ node: div })).toBe("line one\nline two")
  })

  it("converts <strong> to bold markdown", () => {
    const div = document.createElement("div")
    div.innerHTML = "some <strong>bold</strong> text"
    expect(htmlToMarkdown({ node: div })).toBe("some **bold** text")
  })

  it("converts <b> to bold markdown", () => {
    const div = document.createElement("div")
    div.innerHTML = "some <b>bold</b> text"
    expect(htmlToMarkdown({ node: div })).toBe("some **bold** text")
  })

  it("converts <em> to italic markdown", () => {
    const div = document.createElement("div")
    div.innerHTML = "some <em>italic</em> text"
    expect(htmlToMarkdown({ node: div })).toBe("some *italic* text")
  })

  it("converts <i> to italic markdown", () => {
    const div = document.createElement("div")
    div.innerHTML = "some <i>italic</i> text"
    expect(htmlToMarkdown({ node: div })).toBe("some *italic* text")
  })

  it("converts <a> to markdown link", () => {
    const div = document.createElement("div")
    div.innerHTML = '<a href="https://example.com">click here</a>'
    expect(htmlToMarkdown({ node: div })).toBe("[click here](https://example.com)")
  })

  it("returns text only for hashtag links", () => {
    const div = document.createElement("div")
    div.innerHTML = '<a href="/feed/hashtag/?keywords=HASH_TAG_FROM_FEED">#javascript</a>'
    expect(htmlToMarkdown({ node: div })).toBe("#javascript")
  })

  it("skips expandable text buttons", () => {
    const div = document.createElement("div")
    div.innerHTML = 'Hello <button data-testid="expandable-text-button">...more</button> world'
    expect(htmlToMarkdown({ node: div })).toBe("Hello  world")
  })

  it("handles nested elements", () => {
    const div = document.createElement("div")
    div.innerHTML = '<a href="https://example.com"><strong>bold link</strong></a>'
    expect(htmlToMarkdown({ node: div })).toBe("[**bold link**](https://example.com)")
  })

  it("passes through unknown elements returning child text", () => {
    const div = document.createElement("div")
    div.innerHTML = "<span>just text</span>"
    expect(htmlToMarkdown({ node: div })).toBe("just text")
  })

  it("returns text for <a> with no href", () => {
    const div = document.createElement("div")
    div.innerHTML = "<a>no link</a>"
    expect(htmlToMarkdown({ node: div })).toBe("no link")
  })

  it("removes emojis without leaving leading whitespace", () => {
    const text = document.createTextNode("👉 Who is guiding the intelligence?")
    expect(htmlToMarkdown({ node: text })).toBe("Who is guiding the intelligence?")
  })

  it("removes emojis in the middle of text without extra space", () => {
    const text = document.createTextNode("Hello 🌍 world")
    expect(htmlToMarkdown({ node: text })).toBe("Hello world")
  })

  it("skips visually-hidden elements", () => {
    const div = document.createElement("div")
    div.innerHTML = '<a href="/search?keywords=HASH_TAG_FROM_FEED"><span class="visually-hidden">hashtag</span><span>#ArtificialIntelligence</span></a>'
    expect(htmlToMarkdown({ node: div })).toBe("#ArtificialIntelligence")
  })
})
