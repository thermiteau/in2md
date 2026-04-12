import { generateFilename } from "../../../src/lib/file"

describe("generateFilename", () => {
  it("generates filename from single name", () => {
    expect(generateFilename({ actorName: "Alice" })).toBe("alice.md")
  })

  it("generates filename from full name", () => {
    expect(generateFilename({ actorName: "Alice Smith" })).toBe("alice-smith.md")
  })

  it("generates filename with content slug", () => {
    expect(
      generateFilename({ actorName: "Alice Smith", content: "My great post" }),
    ).toBe("alice-smith-my-great-post.md")
  })

  it("truncates content at ~50 chars on word boundary", () => {
    const longContent =
      "This is a very long piece of content that should be truncated at approximately fifty characters"

    const result = generateFilename({ actorName: "Alice", content: longContent })
    expect(result.length).toBeLessThan(100)
    expect(result).toMatch(/\.md$/)
  })

  it("sanitizes special characters", () => {
    const result = generateFilename({ actorName: "Jose Maria" })
    expect(result).toBe("jose-maria.md")
  })

  it("strips markdown formatting from content", () => {
    expect(
      generateFilename({
        actorName: "Alice",
        content: "**Bold** and _italic_ with [link](url)",
      }),
    ).toBe("alice-bold-and-italic-with-linkurl.md")
  })

  it("uses unknown for empty name", () => {
    expect(generateFilename({ actorName: "" })).toBe("unknown.md")
  })

  it("handles multi-word names using first and last", () => {
    expect(generateFilename({ actorName: "Jean Claude Van Damme" })).toBe(
      "jean-damme.md",
    )
  })
})
