const form = document.getElementById("bookmark-form");
const list = document.getElementById("bookmark-list");

async function loadBookmarks() {
  const res = await fetch("/api/bookmarks");
  const bookmarks = await res.json();
  list.innerHTML = "";

  for (const b of bookmarks) {
    const li = document.createElement("li");

    const left = document.createElement("div");
    const link = document.createElement("a");
    link.href = b.url;
    link.target = "_blank";
    link.textContent = b.title;
    link.addEventListener("click", () => registerClick(b.id));

    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = b.tag;

    left.appendChild(link);
    left.appendChild(tag);

    const actions = document.createElement("div");
    actions.className = "actions";

    const clicksSpan = document.createElement("span");
    clicksSpan.className = "tag";
    fetch(`/api/bookmarks/${b.id}/clicks`)
      .then((r) => r.json())
      .then((data) => (clicksSpan.textContent = `${data.clicks} clicks`));

    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", () => deleteBookmark(b.id));

    actions.appendChild(clicksSpan);
    actions.appendChild(delBtn);

    li.appendChild(left);
    li.appendChild(actions);
    list.appendChild(li);
  }
}

async function registerClick(id) {
  await fetch(`/api/bookmarks/${id}/click`, { method: "POST" });
}

async function deleteBookmark(id) {
  await fetch(`/api/bookmarks/${id}`, { method: "DELETE" });
  loadBookmarks();
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = document.getElementById("title").value;
  const url = document.getElementById("url").value;
  const tag = document.getElementById("tag").value;

  await fetch("/api/bookmarks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, url, tag }),
  });

  form.reset();
  loadBookmarks();
});

loadBookmarks();
