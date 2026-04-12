import { copyToClipboard } from "../../../src/lib/clipboard"

describe("copyToClipboard", () => {
  it("returns true on successful copy", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)

    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      writable: true,
      configurable: true,
    })

    const result = await copyToClipboard({ text: "hello" })
    expect(result).toBe(true)
    expect(writeText).toHaveBeenCalledWith("hello")
  })

  it("returns false when clipboard write fails", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"))

    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      writable: true,
      configurable: true,
    })

    const result = await copyToClipboard({ text: "hello" })
    expect(result).toBe(false)
  })
})
