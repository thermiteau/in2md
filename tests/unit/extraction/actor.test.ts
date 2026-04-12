import {
  extractActorData,
  extractActorDataClassic,
  formatAsMarkdown,
  parseActorAriaLabel,
} from "../../../src/extraction/actor";

describe("parseActorAriaLabel", () => {
  it("parses standard format with profile type and distance", () => {
    const result = parseActorAriaLabel({
      label: "Robin Oldham Premium Profile 2nd",
    });
    expect(result).toEqual({
      name: "Robin Oldham",
      profileType: "Premium",
      connectionDistance: "2nd",
    });
  });

  it("parses Verified profile type", () => {
    const result = parseActorAriaLabel({
      label: "Jane Doe Verified Profile 1st",
    });
    expect(result).toEqual({
      name: "Jane Doe",
      profileType: "Verified",
      connectionDistance: "1st",
    });
  });

  it("parses Creator profile type without distance", () => {
    const result = parseActorAriaLabel({ label: "Bob Creator Profile" });
    expect(result).toEqual({
      name: "Bob",
      profileType: "Creator",
      connectionDistance: null,
    });
  });

  it("parses fallback format without profile type keyword", () => {
    const result = parseActorAriaLabel({ label: "Some User Profile 2nd" });
    expect(result).toEqual({
      name: "Some User",
      profileType: null,
      connectionDistance: "2nd",
    });
  });

  it("parses Open to work format", () => {
    const result = parseActorAriaLabel({
      label: "Ubaid Ur Rehman, Open to work  3rd+",
    });
    expect(result).toEqual({
      name: "Ubaid Ur Rehman",
      profileType: "Open to work",
      connectionDistance: "3rd+",
    });
  });

  it("parses Open to work without distance", () => {
    const result = parseActorAriaLabel({ label: "Jane Smith, Open to work" });
    expect(result).toEqual({
      name: "Jane Smith",
      profileType: "Open to work",
      connectionDistance: null,
    });
  });

  it("parses bare format with distance only", () => {
    const result = parseActorAriaLabel({ label: "Khalid Ali  3rd+" });
    expect(result).toEqual({
      name: "Khalid Ali",
      profileType: null,
      connectionDistance: "3rd+",
    });
  });

  it("returns null for null label", () => {
    expect(parseActorAriaLabel({ label: null })).toBeNull();
  });

  it("returns null for unrecognized format", () => {
    expect(parseActorAriaLabel({ label: "just some random text" })).toBeNull();
  });

  it("normalizes extra whitespace", () => {
    const result = parseActorAriaLabel({
      label: "  Alice   Smith   Premium   Profile   1st  ",
    });
    expect(result).toEqual({
      name: "Alice Smith",
      profileType: "Premium",
      connectionDistance: "1st",
    });
  });
});

describe("formatAsMarkdown", () => {
  it("formats full actor data", () => {
    const result = formatAsMarkdown({
      data: {
        name: "Alice Smith",
        title: "Software Engineer",
        profileUrl: "https://www.linkedin.com/in/alice",
        profileType: "Premium",
        connectionDistance: "2nd",
        verified: true,
      },
    });
    expect(result).toBe(
      [
        "**Alice Smith**",
        "- Title: Software Engineer",
        "- Profile: [Profile](https://www.linkedin.com/in/alice)",
        "- Profile Type: Premium",
        "- Verified: true",
        "- Distance: 2nd",
      ].join("\n"),
    );
  });

  it("omits optional fields when empty", () => {
    const result = formatAsMarkdown({
      data: {
        name: "Bob",
        title: "",
        profileUrl: "",
        profileType: null,
        connectionDistance: null,
        verified: false,
      },
    });
    expect(result).toBe(["**Bob**", "- Verified: false"].join("\n"));
  });

  it("shows verified false explicitly", () => {
    const result = formatAsMarkdown({
      data: {
        name: "Test",
        title: "",
        profileUrl: "",
        profileType: null,
        connectionDistance: null,
        verified: false,
      },
    });
    expect(result).toContain("- Verified: false");
  });
});

describe("extractActorData", () => {
  it("extracts actor data from feed-style DOM", () => {
    const anchor = document.createElement("a");
    anchor.setAttribute("href", "/in/alice-smith/");

    const ariaDiv = document.createElement("div");
    ariaDiv.setAttribute("aria-label", "Alice Smith Premium Profile 2nd");

    const nameP = document.createElement("p");
    nameP.textContent = "Alice Smith";
    ariaDiv.appendChild(nameP);

    const wrapper = document.createElement("div");
    wrapper.appendChild(ariaDiv);

    const titleP = document.createElement("p");
    titleP.textContent = "Software Engineer at Acme";
    wrapper.appendChild(titleP);

    anchor.appendChild(wrapper);

    const result = extractActorData({ actorAnchor: anchor });
    expect(result).toEqual({
      name: "Alice Smith",
      title: "Software Engineer at Acme",
      profileUrl: "https://www.linkedin.com/in/alice-smith/",
      profileType: "Premium",
      connectionDistance: "2nd",
      verified: false,
    });
  });

  it("makes relative profile URLs absolute", () => {
    const anchor = document.createElement("a");
    anchor.setAttribute("href", "/in/bob/");

    const ariaDiv = document.createElement("div");
    ariaDiv.setAttribute("aria-label", "Bob Profile 1st");

    const nameP = document.createElement("p");
    nameP.textContent = "Bob";
    ariaDiv.appendChild(nameP);
    anchor.appendChild(ariaDiv);

    const result = extractActorData({ actorAnchor: anchor });
    expect(result?.profileUrl).toBe("https://www.linkedin.com/in/bob/");
  });

  it("detects verified SVG", () => {
    const anchor = document.createElement("a");
    anchor.setAttribute("href", "/in/verified-user/");

    const ariaDiv = document.createElement("div");
    ariaDiv.setAttribute("aria-label", "Verified User Basic Profile 1st");

    const nameP = document.createElement("p");
    nameP.textContent = "Verified User";
    ariaDiv.appendChild(nameP);
    anchor.appendChild(ariaDiv);

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.id = "verified-small";
    anchor.appendChild(svg);

    const result = extractActorData({ actorAnchor: anchor });
    expect(result?.verified).toBe(true);
  });

  it("returns null when no name and no aria data", () => {
    const anchor = document.createElement("a");
    anchor.setAttribute("href", "/in/nobody/");

    const result = extractActorData({ actorAnchor: anchor });
    expect(result).toBeNull();
  });
});

describe("extractActorDataClassic", () => {
  it("extracts actor from classic post page DOM", () => {
    const container = document.createElement("div");
    container.innerHTML = `
      <div class="update-components-actor__title">
        <span aria-hidden="true">Jane Doe</span>
      </div>
      <div class="update-components-actor__description">
        <span aria-hidden="true">Product Manager at BigCo</span>
      </div>
      <a class="update-components-actor__image" href="/in/jane-doe/?miniProfileUrn=urn%3Ali"></a>
    `;

    const result = extractActorDataClassic({ postContainer: container });
    expect(result).toEqual({
      name: "Jane Doe",
      title: "Product Manager at BigCo",
      profileUrl: "https://www.linkedin.com/in/jane-doe/",
      profileType: null,
      connectionDistance: null,
      verified: false,
    });
  });

  it("strips query params from profile URL", () => {
    const container = document.createElement("div");
    container.innerHTML = `
      <div class="update-components-actor__title">
        <span aria-hidden="true">Test User</span>
      </div>
      <a class="update-components-actor__image" href="/in/test-user/?miniProfileUrn=abc123"></a>
    `;

    const result = extractActorDataClassic({ postContainer: container });
    expect(result?.profileUrl).toBe("https://www.linkedin.com/in/test-user/");
  });

  it("returns null when no name element", () => {
    const container = document.createElement("div");

    const result = extractActorDataClassic({ postContainer: container });
    expect(result).toBeNull();
  });
});
