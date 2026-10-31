const COMMUNITY_KEYS = {
  posts: "vendorLiftCommunityPosts",
  likes: "vendorLiftDemoLikes",
  savedRestaurants: "vendorLiftDemoSavedRestaurants",
};

const starterPosts = [
  {
    id: "starter-green-kitchen",
    restaurantName: "The Green Kitchen",
    location: "Downtown",
    caption: "Fresh herbs, roasted vegetables, and a little sunshine in every bowl. Come try our seasonal lunch special!",
    photoUrl: "",
    createdAt: "2026-10-30T12:00:00.000Z",
    likes: 12,
    comments: [{ author: "Jamie", text: "That sounds delicious!" }],
  },
  {
    id: "starter-copper-oven",
    restaurantName: "Copper Oven",
    location: "Riverside",
    caption: "Our weekend sourdough is out of the oven. Baked fresh this morning and ready to share.",
    photoUrl: "",
    createdAt: "2026-10-29T09:30:00.000Z",
    likes: 8,
    comments: [],
  },
  {
    id: "starter-little-fig",
    restaurantName: "The Little Fig",
    location: "Old Town",
    caption: "A new seasonal menu is here, with comforting favorites and a few new things to discover.",
    photoUrl: "",
    createdAt: "2026-10-28T15:15:00.000Z",
    likes: 17,
    comments: [{ author: "Sam", text: "Can't wait to visit!" }],
  },
];

function readCommunityData(key, fallback) {
  const raw = localStorage.getItem(key);
  if (raw === null) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error("Stored community data is not a list.");
    }
    return parsed;
  } catch (error) {
    console.error(`Could not read ${key} from browser storage.`, error);
    throw new Error("Saved community data could not be read. Clear this site's saved data and reload.");
  }
}

function writeCommunityData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Could not save ${key} to browser storage.`, error);
    throw new Error("Your browser could not save this change. Check available storage and try again.");
  }
}

function getPosts() {
  const posts = readCommunityData(COMMUNITY_KEYS.posts, null);
  if (posts === null) {
    writeCommunityData(COMMUNITY_KEYS.posts, starterPosts);
    return starterPosts;
  }
  return posts;
}

function getRestaurantName() {
  const details = sessionStorage.getItem("vendorLiftRestaurantDetails");
  if (details) {
    try {
      const restaurant = JSON.parse(details);
      if (typeof restaurant.resturantName === "string" && restaurant.resturantName.trim()) {
        return restaurant.resturantName.trim();
      }
    } catch (error) {
      console.error("Could not read the restaurant profile from this browser session.", error);
    }
  }
  return "The Green Kitchen";
}

function safePhotoUrl(value) {
  if (!value) {
    return "";
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : "";
  } catch {
    return "";
  }
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  if (text !== undefined) {
    element.textContent = text;
  }
  return element;
}

function getDateLabel(value) {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) {
    return "Recently";
  }
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(timestamp);
}

const dashboard = document.querySelector("[data-owner-dashboard]");
if (dashboard) {
  const form = dashboard.querySelector("[data-post-form]");
  const message = dashboard.querySelector("[data-dashboard-message]");
  const restaurantName = getRestaurantName();
  dashboard.querySelector("[data-restaurant-name]").textContent = restaurantName;

  function renderDashboard() {
    const ownPosts = getPosts().filter((post) => post.restaurantName === restaurantName);
    dashboard.querySelector("[data-post-count]").textContent = String(ownPosts.length);
    dashboard.querySelector("[data-like-count]").textContent = String(
      ownPosts.reduce((total, post) => total + (Number(post.likes) || 0), 0)
    );
    dashboard.querySelector("[data-comment-count]").textContent = String(
      ownPosts.reduce((total, post) => total + (Array.isArray(post.comments) ? post.comments.length : 0), 0)
    );

    const recentPosts = dashboard.querySelector("[data-recent-posts]");
    recentPosts.replaceChildren();
    if (ownPosts.length === 0) {
      recentPosts.append(createElement("p", "empty-state", "Your posts will appear here after you share your first update."));
      return;
    }

    for (const post of ownPosts.slice().sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 3)) {
      const item = createElement("article", "recent-post");
      item.append(createElement("p", "", post.caption));
      item.append(createElement("span", "post-meta", `${getDateLabel(post.createdAt)} · ${post.likes || 0} likes · ${(post.comments || []).length} comments`));
      recentPosts.append(item);
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    message.textContent = "";
    message.classList.remove("is-error");

    const formData = new FormData(form);
    const caption = String(formData.get("caption") || "").trim();
    const photoValue = String(formData.get("photoUrl") || "").trim();
    const photoUrl = safePhotoUrl(photoValue);
    if (photoValue && !photoUrl) {
      message.textContent = "Enter a valid http or https image address, or leave the photo field empty.";
      message.classList.add("is-error");
      form.elements.caption.focus();
      return;
    }

    try {
      const posts = getPosts();
      posts.unshift({
        id: `post-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        restaurantName,
        location: "Restaurant",
        caption,
        photoUrl,
        createdAt: new Date().toISOString(),
        likes: 0,
        comments: [],
      });
      writeCommunityData(COMMUNITY_KEYS.posts, posts);
      form.reset();
      message.textContent = "Your update is now visible in the restaurant feed on this browser.";
      renderDashboard();
    } catch (error) {
      message.textContent = error.message;
      message.classList.add("is-error");
    }
  });

  try {
    renderDashboard();
  } catch (error) {
    message.textContent = error.message;
    message.classList.add("is-error");
  }
}

const feed = document.querySelector("[data-community-feed]");
if (feed) {
  const list = feed.querySelector("[data-feed-list]");
  const search = feed.querySelector("[data-feed-search]");
  const savedFilter = feed.querySelector("[data-saved-filter]");
  const message = feed.querySelector("[data-feed-message]");

  function renderFeed() {
    const posts = getPosts().slice().sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    const likes = readCommunityData(COMMUNITY_KEYS.likes, []);
    const savedRestaurants = readCommunityData(COMMUNITY_KEYS.savedRestaurants, []);
    const query = search.value.trim().toLowerCase();
    const filteredPosts = posts.filter((post) => {
      const matchesQuery = `${post.restaurantName} ${post.location} ${post.caption}`.toLowerCase().includes(query);
      const matchesSaved = !savedFilter.getAttribute("aria-pressed") ||
        savedFilter.getAttribute("aria-pressed") !== "true" ||
        savedRestaurants.includes(post.restaurantName);
      return matchesQuery && matchesSaved;
    });

    list.replaceChildren();
    if (filteredPosts.length === 0) {
      list.append(createElement("p", "empty-state", savedFilter.getAttribute("aria-pressed") === "true"
        ? "No saved restaurants match this view yet. Save a restaurant from the feed to find it here."
        : "No restaurants match your search."));
      return;
    }

    for (const post of filteredPosts) {
      const card = createElement("article", "community-card feed-post");
      card.dataset.postId = post.id;

      const header = createElement("header", "post-header");
      header.append(createElement("span", "post-avatar", post.restaurantName.trim().charAt(0).toUpperCase() || "R"));
      const nameBlock = createElement("div", "post-restaurant");
      nameBlock.append(createElement("strong", "", post.restaurantName));
      nameBlock.append(createElement("span", "post-meta", `${post.location || "Restaurant"} · ${getDateLabel(post.createdAt)}`));
      header.append(nameBlock);
      card.append(header);

      const photoUrl = safePhotoUrl(post.photoUrl);
      if (photoUrl) {
        const image = document.createElement("img");
        image.className = "post-photo";
        image.src = photoUrl;
        image.alt = `Photo shared by ${post.restaurantName}`;
        image.loading = "lazy";
        image.addEventListener("error", () => image.remove(), { once: true });
        card.append(image);
      } else {
        card.append(createElement("div", "post-photo-placeholder", "🍽️"));
      }

      const content = createElement("div", "post-content");
      content.append(createElement("p", "post-caption", post.caption));
      card.append(content);

      const actions = createElement("div", "post-actions");
      const isLiked = likes.includes(post.id);
      const likeButton = createElement("button", "post-action", `${isLiked ? "♥ Liked" : "♡ Like"} · ${Number(post.likes) || 0}`);
      likeButton.type = "button";
      likeButton.dataset.action = "like";
      likeButton.setAttribute("aria-pressed", String(isLiked));
      likeButton.setAttribute("aria-label", `${isLiked ? "Unlike" : "Like"} ${post.restaurantName}'s post`);
      actions.append(likeButton);

      const isSaved = savedRestaurants.includes(post.restaurantName);
      const saveButton = createElement("button", "post-action", isSaved ? "✓ Saved" : "＋ Save restaurant");
      saveButton.type = "button";
      saveButton.dataset.action = "save";
      saveButton.setAttribute("aria-pressed", String(isSaved));
      saveButton.setAttribute("aria-label", `${isSaved ? "Remove" : "Save"} ${post.restaurantName} ${isSaved ? "from" : "to"} saved restaurants`);
      actions.append(saveButton);
      card.append(actions);

      const commentsSection = createElement("section", "post-comments");
      commentsSection.setAttribute("aria-label", `Comments on ${post.restaurantName}'s post`);
      const comments = createElement("div", "comment-list");
      for (const comment of Array.isArray(post.comments) ? post.comments : []) {
        const commentElement = createElement("p", "comment");
        commentElement.append(createElement("strong", "", `${comment.author || "Customer"}: `));
        commentElement.append(document.createTextNode(comment.text));
        comments.append(commentElement);
      }
      commentsSection.append(comments);

      const commentForm = document.createElement("form");
      commentForm.className = "comment-form";
      commentForm.dataset.action = "comment";
      const commentInput = document.createElement("input");
      commentInput.type = "text";
      commentInput.name = "comment";
      commentInput.maxLength = 400;
      commentInput.placeholder = "Write a comment";
      commentInput.setAttribute("aria-label", `Write a comment on ${post.restaurantName}'s post`);
      commentInput.required = true;
      const commentButton = createElement("button", "", "Comment");
      commentButton.type = "submit";
      commentForm.append(commentInput, commentButton);
      commentsSection.append(commentForm);
      card.append(commentsSection);

      list.append(card);
    }
  }

  feed.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) {
      return;
    }

    const postCard = button.closest("[data-post-id]");
    const postId = postCard.dataset.postId;
    try {
      const post = getPosts().find((item) => item.id === postId);
      if (!post) {
        throw new Error("This post is no longer available. Refresh the feed and try again.");
      }

      if (button.dataset.action === "like") {
        const likes = readCommunityData(COMMUNITY_KEYS.likes, []);
        if (likes.includes(postId)) {
          writeCommunityData(COMMUNITY_KEYS.likes, likes.filter((id) => id !== postId));
          post.likes = Math.max(0, (Number(post.likes) || 0) - 1);
        } else {
          likes.push(postId);
          writeCommunityData(COMMUNITY_KEYS.likes, likes);
          post.likes = (Number(post.likes) || 0) + 1;
        }
      } else if (button.dataset.action === "save") {
        const saved = readCommunityData(COMMUNITY_KEYS.savedRestaurants, []);
        const nextSaved = saved.includes(post.restaurantName)
          ? saved.filter((name) => name !== post.restaurantName)
          : [...saved, post.restaurantName];
        writeCommunityData(COMMUNITY_KEYS.savedRestaurants, nextSaved);
      }

      if (button.dataset.action === "like") {
        writeCommunityData(COMMUNITY_KEYS.posts, getPosts().map((item) => item.id === postId ? post : item));
      }
      message.textContent = "";
      renderFeed();
    } catch (error) {
      message.textContent = error.message;
      message.classList.add("is-error");
    }
  });

  feed.addEventListener("submit", (event) => {
    const form = event.target.closest('form[data-action="comment"]');
    if (!form) {
      return;
    }
    event.preventDefault();
    const postId = form.closest("[data-post-id]").dataset.postId;
    const commentText = String(new FormData(form).get("comment") || "").trim();
    if (!commentText) {
      return;
    }

    try {
      const posts = getPosts();
      const post = posts.find((item) => item.id === postId);
      if (!post) {
        throw new Error("This post is no longer available. Refresh the feed and try again.");
      }
      post.comments = Array.isArray(post.comments) ? post.comments : [];
      post.comments.push({ author: "You (demo)", text: commentText });
      writeCommunityData(COMMUNITY_KEYS.posts, posts);
      message.textContent = "";
      renderFeed();
    } catch (error) {
      message.textContent = error.message;
      message.classList.add("is-error");
    }
  });

  search.addEventListener("input", renderFeed);
  savedFilter.addEventListener("click", () => {
    const showSaved = savedFilter.getAttribute("aria-pressed") !== "true";
    savedFilter.setAttribute("aria-pressed", String(showSaved));
    savedFilter.textContent = showSaved ? "Show all restaurants" : "Saved restaurants";
    try {
      renderFeed();
    } catch (error) {
      message.textContent = error.message;
      message.classList.add("is-error");
    }
  });

  try {
    renderFeed();
  } catch (error) {
    message.textContent = error.message;
    message.classList.add("is-error");
  }
}
