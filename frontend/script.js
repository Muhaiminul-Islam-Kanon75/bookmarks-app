const form = document.getElementById("bookmark-form");
const list = document.getElementById("bookmark-list");
const searchInput = document.getElementById("bookmark-search");
const tagNavigation = document.getElementById("tag-navigation");
const pageStatus = document.getElementById("page-status");
const formStatus = document.getElementById("form-status");
const allBookmarksButton = document.getElementById("all-bookmarks");
const bookmarkCount = document.getElementById("bookmark-count");
const visibleCount = document.getElementById("visible-count");

let bookmarks = [];
let selectedTag = "all";

document.getElementById("today-date").textContent = new Intl.DateTimeFormat(
  undefined,
  { weekday: "long", month: "long", day: "numeric" }
).format(new Date());

async function request(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }
  return response;
}

async function requestJson(url, options) {
  const response = await request(url, options);
  return response.json();
}

function setPageStatus(message) {
  pageStatus.textContent = message;
}

function getTag(bookmark) {
  return (bookmark.tag || "general").trim() || "general";
}

function renderTagNavigation() {
  tagNavigation.replaceChildren();
  const tags = new Map();

  for (const bookmark of bookmarks) {
    const tag = getTag(bookmark);
    const key = tag.toLocaleLowerCase();
    const current = tags.get(key);
    tags.set(key, { label: current?.label || tag, count: (current?.count || 0) + 1 });
  }

  for (const [key, tag] of [...tags].sort((a, b) => a[1].label.localeCompare(b[1].label))) {
    const button = document.createElement("button");
    button.className = `tag-nav-item${selectedTag === key ? " is-active" : ""}`;
    button.type = "button";
    button.setAttribute("aria-pressed", String(selectedTag === key));

    const dot = document.createElement("span");
    dot.className = "tag-nav-dot";
    dot.setAttribute("aria-hidden", "true");

    const label = document.createElement("span");
    label.textContent = tag.label;

    const count = document.createElement("span");
    count.className = "tag-nav-count";
    count.textContent = String(tag.count);

    button.append(dot, label, count);
    button.addEventListener("click", () => {
      selectedTag = key;
      render();
    });
    tagNavigation.append(button);
  }

  allBookmarksButton.classList.toggle("is-active", selectedTag === "all");
  allBookmarksButton.setAttribute("aria-pressed", String(selectedTag === "all"));
}

function makeEmptyState(isSearching) {
  const item = document.createElement("li");
  item.className = "empty-state";

  const icon = document.createElement("span");
  icon.className = "empty-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = isSearching ? "⌕" : "✳";

  const title = document.createElement("h3");
  title.textContent = isSearching ? "No links found" : "Your collection starts here";

  const message = document.createElement("p");
  message.textContent = isSearching
    ? "Try another search or choose a different tag."
    : "Save your first bookmark above and it will be waiting for you here.";

  item.append(icon, title, message);
  return item;
}

function getDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./i, "");
  } catch {
    return url;
  }
}

function createBookmarkCard(bookmark) {
  const item = document.createElement("li");
  item.className = "bookmark-card";

  const topLine = document.createElement("div");
  topLine.className = "card-topline";

  const siteInfo = document.createElement("div");
  siteInfo.className = "site-info";

  const avatar = document.createElement("span");
  avatar.className = "site-avatar";
  avatar.setAttribute("aria-hidden", "true");
  avatar.textContent = getDomain(bookmark.url).charAt(0) || "?";

  const domain = document.createElement("span");
  domain.className = "site-domain";
  domain.textContent = getDomain(bookmark.url);
  siteInfo.append(avatar, domain);

  const deleteButton = document.createElement("button");
  deleteButton.className = "delete-button";
  deleteButton.type = "button";
  deleteButton.setAttribute("aria-label", `Delete ${bookmark.title}`);
  deleteButton.title = "Delete bookmark";
  deleteButton.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4.5 7h15m-10 0V4.5h5V7m3.5 0-.8 12.2a1.5 1.5 0 0 1-1.5 1.4H8.3a1.5 1.5 0 0 1-1.5-1.4L6 7m4 3.5v6m4-6v6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  deleteButton.addEventListener("click", () => deleteBookmark(bookmark.id, deleteButton));
  topLine.append(siteInfo, deleteButton);

  const link = document.createElement("a");
  link.className = "bookmark-title";
  link.href = bookmark.url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = bookmark.title;
  link.addEventListener("click", () => registerClick(bookmark));

  const url = document.createElement("span");
  url.className = "bookmark-url";
  url.textContent = bookmark.url;

  const bottomLine = document.createElement("div");
  bottomLine.className = "card-bottomline";

  const tag = document.createElement("span");
  tag.className = "bookmark-tag";
  tag.textContent = getTag(bookmark);

  const clicks = document.createElement("span");
  clicks.className = "click-count";
  clicks.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="2.5" stroke="currentColor" stroke-width="1.6"/></svg>';
  const clickLabel = document.createElement("span");
  clickLabel.textContent = `${bookmark.clicks || 0} clicks`;
  clicks.append(clickLabel);
  bottomLine.append(tag, clicks);

  item.append(topLine, link, url, bottomLine);
  return item;
}

function render() {
  renderTagNavigation();

  const query = searchInput.value.trim().toLocaleLowerCase();
  const filteredBookmarks = bookmarks.filter((bookmark) => {
    const matchesTag =
      selectedTag === "all" || getTag(bookmark).toLocaleLowerCase() === selectedTag;
    const searchableText = `${bookmark.title} ${bookmark.url} ${getTag(bookmark)}`.toLocaleLowerCase();
    return matchesTag && searchableText.includes(query);
  });

  bookmarkCount.textContent = String(bookmarks.length);
  visibleCount.textContent = `${filteredBookmarks.length}`;
  list.replaceChildren();

  if (filteredBookmarks.length === 0) {
    list.append(makeEmptyState(Boolean(query) || selectedTag !== "all"));
    return;
  }

  for (const bookmark of filteredBookmarks) {
    list.append(createBookmarkCard(bookmark));
  }
}

async function loadBookmarks() {
  setPageStatus("");
  try {
    const data = await requestJson("/api/bookmarks");
    if (!Array.isArray(data)) {
      throw new Error("Unexpected response from the bookmarks service");
    }

    bookmarks = await Promise.all(
      data.map(async (bookmark) => {
        const clickData = await requestJson(`/api/bookmarks/${bookmark.id}/clicks`);
        return { ...bookmark, clicks: Number(clickData.clicks) || 0 };
      })
    );
    render();
  } catch (error) {
    console.error("Failed to load bookmarks:", error);
    setPageStatus("We couldn't load your bookmarks. Please refresh and try again.");
  }
}

async function registerClick(bookmark) {
  try {
    const data = await requestJson(`/api/bookmarks/${bookmark.id}/click`, {
      method: "POST",
    });
    bookmark.clicks = Number(data.clicks) || bookmark.clicks + 1;
    render();
  } catch (error) {
    console.error("Failed to register bookmark click:", error);
    setPageStatus("Your link opened, but we couldn't update its click count.");
  }
}

async function deleteBookmark(id, button) {
  button.disabled = true;
  try {
    await request(`/api/bookmarks/${id}`, { method: "DELETE" });
    bookmarks = bookmarks.filter((bookmark) => bookmark.id !== id);
    render();
    setPageStatus("");
  } catch (error) {
    console.error("Failed to delete bookmark:", error);
    button.disabled = false;
    setPageStatus("We couldn't delete that bookmark. Please try again.");
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  formStatus.textContent = "";

  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  try {
    const title = document.getElementById("title").value.trim();
    const url = document.getElementById("url").value.trim();
    const tag = document.getElementById("tag").value.trim();

    await requestJson("/api/bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, url, tag }),
    });

    form.reset();
    selectedTag = "all";
    searchInput.value = "";
    await loadBookmarks();
  } catch (error) {
    console.error("Failed to save bookmark:", error);
    formStatus.textContent = "We couldn't save that link. Please check the details and try again.";
  } finally {
    submitButton.disabled = false;
  }
});

allBookmarksButton.addEventListener("click", () => {
  selectedTag = "all";
  render();
});

searchInput.addEventListener("input", render);
document.addEventListener("keydown", (event) => {
  if (
    event.key === "/" &&
    !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)
  ) {
    event.preventDefault();
    searchInput.focus();
  }
});

loadBookmarks();
