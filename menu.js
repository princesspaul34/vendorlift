const dishList = document.querySelector("#dish-list");
const dishTemplate = document.querySelector("#dish-template");
const addDishButton = document.querySelector("#add-dish");
const dishForm = document.querySelector("#dish-form");
let nextDishId = 1;

function updateDishControls() {
  const dishCards = dishList.querySelectorAll(".dish-card");

  dishCards.forEach((card, index) => {
    card.querySelector(".dish-legend").textContent = `Dish ${index + 1}`;
    card.querySelector(".remove-dish").disabled = dishCards.length === 1;
  });
}

function addDish() {
  const dishId = nextDishId++;
  const fragment = dishTemplate.content.cloneNode(true);
  const dishCard = fragment.querySelector(".dish-card");

  for (const field of dishCard.querySelectorAll("[data-field]")) {
    const fieldName = field.dataset.field;
    const fieldId = `dish-${dishId}-${fieldName}`;
    field.id = fieldId;
    field.name = `dishes[${dishId}][${fieldName}]`;
    dishCard.querySelector(`[data-label="${fieldName}"]`).htmlFor = fieldId;
  }

  dishList.append(fragment);
  updateDishControls();
}

addDishButton.addEventListener("click", addDish);

dishForm.addEventListener("submit", (event) => {
  event.preventDefault();
  window.location.href = "feed.html";
});

dishList.addEventListener("click", (event) => {
  const removeButton = event.target.closest(".remove-dish");
  if (!removeButton) {
    return;
  }

  const dishCard = removeButton.closest(".dish-card");
  const preview = dishCard.querySelector(".image-preview");
  if (preview.dataset.objectUrl) {
    URL.revokeObjectURL(preview.dataset.objectUrl);
  }

  dishCard.remove();
  updateDishControls();
});

dishList.addEventListener("change", (event) => {
  const imageInput = event.target.closest('input[type="file"]');
  if (!imageInput) {
    return;
  }

  const preview = imageInput.closest(".dish-card").querySelector(".image-preview");
  if (preview.dataset.objectUrl) {
    URL.revokeObjectURL(preview.dataset.objectUrl);
    delete preview.dataset.objectUrl;
  }

  const [image] = imageInput.files;
  if (!image) {
    preview.hidden = true;
    preview.removeAttribute("src");
    return;
  }

  const objectUrl = URL.createObjectURL(image);
  preview.src = objectUrl;
  preview.alt = `Preview of ${image.name}`;
  preview.dataset.objectUrl = objectUrl;
  preview.hidden = false;
});

addDish();
