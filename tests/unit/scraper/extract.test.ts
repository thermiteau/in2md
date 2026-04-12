import { postKey, extractPostData, extractArticleUrl } from "../../../src/scraper/extract"

describe("postKey", () => {
  it("combines name and summary with :: separator", () => {
    expect(postKey({ name: "Alice", summary: "Hello world" })).toBe(
      "Alice::Hello world",
    )
  })

  it("handles empty strings", () => {
    expect(postKey({ name: "", summary: "" })).toBe("::")
  })
})

describe("extractArticleUrl", () => {
  it("extracts pulse article URL", () => {
    const container = document.createElement("div")
    container.innerHTML =
      '<a data-test-app-aware-link href="https://www.linkedin.com/pulse/some-article">Article</a>'

    const result = extractArticleUrl({ container })
    expect(result).toBe("https://www.linkedin.com/pulse/some-article")
  })

  it("makes relative URLs absolute", () => {
    const container = document.createElement("div")
    container.innerHTML =
      '<a data-test-app-aware-link href="/pulse/some-article">Article</a>'

    const result = extractArticleUrl({ container })
    expect(result).toBe("https://www.linkedin.com/pulse/some-article")
  })

  it("excludes links matching exclude patterns", () => {
    const container = document.createElement("div")
    container.innerHTML =
      '<a data-test-app-aware-link href="https://www.linkedin.com/pulse/article.jpg">Image</a>'

    const result = extractArticleUrl({ container })
    expect(result).toBe("")
  })

  it("excludes /in/ links", () => {
    const container = document.createElement("div")
    container.innerHTML =
      '<a data-test-app-aware-link href="https://www.linkedin.com/in/pulse/user">Profile</a>'

    const result = extractArticleUrl({ container })
    expect(result).toBe("")
  })

  it("returns empty string when no matching links", () => {
    const container = document.createElement("div")
    container.innerHTML = '<a href="https://example.com">No match</a>'

    const result = extractArticleUrl({ container })
    expect(result).toBe("")
  })
})

describe("extractPostData", () => {
  const buildPostDOM = (params: {
    name: string
    role: string
    summary: string
    articleHref?: string
  }) => {
    const container = document.createElement("div")

    const titleDiv = document.createElement("div")
    titleDiv.classList.add("update-components-actor__title")

    const titleSpan = document.createElement("span")
    titleSpan.setAttribute("aria-hidden", "true")
    titleSpan.textContent = params.name
    titleDiv.appendChild(titleSpan)
    container.appendChild(titleDiv)

    const descDiv = document.createElement("div")
    descDiv.classList.add("update-components-actor__description")

    const descSpan = document.createElement("span")
    descSpan.setAttribute("aria-hidden", "true")
    descSpan.textContent = params.role
    descDiv.appendChild(descSpan)
    container.appendChild(descDiv)

    const textDiv = document.createElement("div")
    textDiv.classList.add("update-components-text")

    const textSpan = document.createElement("span")
    textSpan.setAttribute("dir", "ltr")
    textSpan.textContent = params.summary
    textDiv.appendChild(textSpan)
    container.appendChild(textDiv)

    if (params.articleHref) {
      const link = document.createElement("a")
      link.setAttribute("data-test-app-aware-link", "")
      link.setAttribute("href", params.articleHref)
      container.appendChild(link)
    }

    return container
  }

  it("extracts post data from DOM", () => {
    const container = buildPostDOM({
      name: "Alice Smith",
      role: "Engineer",
      summary: "Check out this article",
    })

    const result = extractPostData({ container, isReshare: false })
    expect(result).toEqual({
      name: "Alice Smith",
      role: "Engineer",
      summary: "Check out this article",
      articleUrl: "",
      isReshare: false,
    })
  })

  it("extracts article URL when present", () => {
    const container = buildPostDOM({
      name: "Bob",
      role: "Writer",
      summary: "Read my article",
      articleHref: "https://www.linkedin.com/pulse/my-article",
    })

    const result = extractPostData({ container, isReshare: false })
    expect(result?.articleUrl).toBe(
      "https://www.linkedin.com/pulse/my-article",
    )
  })

  it("sets isReshare flag", () => {
    const container = buildPostDOM({
      name: "Carol",
      role: "PM",
      summary: "Resharing this",
    })

    const result = extractPostData({ container, isReshare: true })
    expect(result?.isReshare).toBe(true)
  })

  it("returns null when name is missing", () => {
    const container = buildPostDOM({
      name: "",
      role: "Engineer",
      summary: "Some text",
    })

    const result = extractPostData({ container, isReshare: false })
    expect(result).toBeNull()
  })

  it("returns null when summary is missing", () => {
    const container = buildPostDOM({
      name: "Alice",
      role: "Engineer",
      summary: "",
    })

    const result = extractPostData({ container, isReshare: false })
    expect(result).toBeNull()
  })
})
