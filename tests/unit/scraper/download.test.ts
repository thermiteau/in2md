import { downloadJSON } from "../../../src/scraper/download"
import type { ScrapedPost } from "../../../src/types"

describe("downloadJSON", () => {
  let clickSpy: ReturnType<typeof vi.fn>
  let createObjectURLSpy: ReturnType<typeof vi.fn>
  let revokeObjectURLSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    clickSpy = vi.fn()

    const originalCreateElement = document.createElement.bind(document)

    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "a") {
        return {
          href: "",
          download: "",
          click: clickSpy,
        } as unknown as HTMLAnchorElement
      }
      return originalCreateElement(tag)
    })

    createObjectURLSpy = vi.fn().mockReturnValue("blob:mock-url")
    revokeObjectURLSpy = vi.fn()
    globalThis.URL.createObjectURL = createObjectURLSpy as typeof URL.createObjectURL
    globalThis.URL.revokeObjectURL = revokeObjectURLSpy as typeof URL.revokeObjectURL
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("creates a download link and clicks it", () => {
    const data: ScrapedPost[] = [
      {
        name: "Alice",
        role: "Engineer",
        summary: "Hello",
        articleUrl: "",
        isReshare: false,
      },
    ]

    downloadJSON({ data })

    expect(createObjectURLSpy).toHaveBeenCalledOnce()
    expect(clickSpy).toHaveBeenCalledOnce()
  })

  it("creates blob with JSON data", () => {
    const data: ScrapedPost[] = [
      {
        name: "Alice",
        role: "Engineer",
        summary: "Hello",
        articleUrl: "",
        isReshare: false,
      },
    ]

    downloadJSON({ data })

    const blobArg = createObjectURLSpy.mock.calls[0][0]
    expect(blobArg).toBeInstanceOf(Blob)
  })
})
