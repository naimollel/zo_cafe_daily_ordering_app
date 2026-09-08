const WHATSAPP_NUMBER = "255657051162";

const groups = [
  ["Pastries", [
    ["Brownies", 6], ["Chocolate Croissants", 6], ["Chocolate Muffins", 6],
    ["Plain Croissants", 6], ["Vanilla Muffins", 6],
  ]],
  ["Juice", [
    ["Mango Passion", 4], ["Passion", 6], ["Immunity Shot", 4], ["Green Detox", null],
  ]],
  ["Burger", [["Burger", null]]],
  ["Hot Bowls", [
    ["Steak & Mashed Potatoes", null], ["Butter Chicken", null], ["Chicken Biryani", null],
    ["Chicken Fried Rice", null], ["Chicken Noodles", null], ["Swahili Bowl", null],
    ["Fried Chicken 1/4 (Chicken)", null], ["Fried Chicken 1/2 (Chicken)", null],
    ["Green Chicken Curry", null], ["Chicken Wings & Mashed Potatoes", null],
  ]],
  ["Salads", [
    ["Chicken Tikka", null], ["Caesar Salad", null], ["Crispy Chicken Avocado Salad", null],
    ["Pasta Salad", null], ["Pasta Pesto Salad", null], ["Citrus Pasta Salad", null],
  ]],
  ["Sandwich", [["Cheese & Tomato", null], ["Chicken Tikka", null], ["Sandwiches & Fries", null]]],
  ["Hot Snacks", [["Plate: 3 Samosas", null], ["Samosa Plate With Fries", null]]],
  ["Breakfast", [
    ["Toast, Baked Beans, Grilled Tomato", null], ["Beef / Chicken Sausage", null],
    ["Mushrooms", null], ["Avocado Slices", null], ["Granola Bowl", null],
  ]],
];

const rows = document.querySelector("#stock-rows");
const dateInput = document.querySelector("#order-date");
const preview = document.querySelector("#message-preview");
const total = document.querySelector("#order-total");
const toast = document.querySelector("#toast");

function tomorrowISO() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function maxPicker(value) {
  if (value !== null) return `<span class="fixed-max" title="Fixed maximum level">${value}</span>`;
  return `<select class="max-select" aria-label="Maximum stock"><option value="0">0</option>${[1, 2, 3, 4, 5, 6].map(number => `<option value="${number}">${number}</option>`).join("")}</select>`;
}

function numberInput(field, label) {
  return `<input class="stock-input" data-field="${field}" aria-label="${label}" type="number" inputmode="numeric" min="0" max="99" value="0">`;
}

function createRows() {
  rows.innerHTML = groups.map(([group, items]) => `
    <tr class="category-row"><td colspan="8">${group}</td></tr>
    ${items.map(([name, fixedMax], index) => `
      <tr class="item-row" data-name="${name}" data-fixed-max="${fixedMax ?? ""}" data-group="${group}">
        <td>${name}</td>
        <td>${maxPicker(fixedMax)}</td>
        <td>${numberInput("opening", `${name} opening stock`)}</td>
        <td>${numberInput("sales", `${name} sales`)}</td>
        <td>${numberInput("received", `${name} received`)}</td>
        <td>${numberInput("wastage", `${name} wastage`)}</td>
        <td>${numberInput("closing", `${name} closing stock`)}</td>
        <td><span class="order-amount zero">0</span><span class="variance" hidden></span></td>
      </tr>`).join("")}
  `).join("");
}

function value(row, field) {
  return Math.max(0, Number(row.querySelector(`[data-field="${field}"]`).value) || 0);
}

function maxValue(row) {
  return Number(row.dataset.fixedMax || row.querySelector(".max-select").value);
}

function getOrderQuantity(row) {
  return Math.max(0, maxValue(row) - value(row, "closing"));
}

function formatDate(iso) {
  if (!iso) return "tomorrow";
  return new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(`${iso}T12:00:00`));
}

function buildMessage() {
  let message = `Your order for ${formatDate(dateInput.value)}.\n`;
  let currentGroup = "";
  let count = 0;

  document.querySelectorAll(".item-row").forEach(row => {
    const quantity = getOrderQuantity(row);
    if (!quantity) return;
    const group = row.dataset.group;
    if (group !== currentGroup) {
      message += `\n${group.toUpperCase()}\n`;
      currentGroup = group;
    }
    message += `${row.dataset.name} — ${quantity}\n`;
    count += quantity;
  });

  if (!count) message += "\nNo items need ordering today.";
  return { message: message.trim(), count };
}

function update() {
  document.querySelectorAll(".item-row").forEach(row => {
    const order = getOrderQuantity(row);
    const pill = row.querySelector(".order-amount");
    pill.textContent = order;
    pill.classList.toggle("zero", order === 0);

    const expectedClosing = Math.max(0, value(row, "opening") + value(row, "received") - value(row, "sales") - value(row, "wastage"));
    const mismatch = expectedClosing !== value(row, "closing") && ["opening", "sales", "received", "wastage", "closing"].some(field => value(row, field) > 0);
    const variance = row.querySelector(".variance");
    variance.hidden = !mismatch;
    variance.textContent = mismatch ? ` expected ${expectedClosing}` : "";
  });
  const order = buildMessage();
  preview.textContent = order.message;
  total.textContent = `${order.count} ${order.count === 1 ? "item" : "items"}`;
  save();
}

function save() {
  const entries = [...document.querySelectorAll(".item-row")].map(row => ({
    name: row.dataset.name,
    max: maxValue(row),
    values: Object.fromEntries(["opening", "sales", "received", "wastage", "closing"].map(field => [field, value(row, field)])),
  }));
  localStorage.setItem("zo-cafe-daily-sheet", JSON.stringify({ date: dateInput.value, entries }));
}

function restore() {
  try {
    const saved = JSON.parse(localStorage.getItem("zo-cafe-daily-sheet"));
    if (!saved) return;
    dateInput.value = saved.date || tomorrowISO();
    saved.entries?.forEach(item => {
      const row = [...document.querySelectorAll(".item-row")].find(entry => entry.dataset.name === item.name);
      if (!row) return;
      const max = row.querySelector(".max-select");
      if (max) max.value = item.max;
      Object.entries(item.values || {}).forEach(([field, entryValue]) => { row.querySelector(`[data-field="${field}"]`).value = entryValue; });
    });
  } catch { /* A corrupt saved sheet should not stop the app. */ }
}

function notify(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  window.setTimeout(() => toast.classList.remove("visible"), 2600);
}

createRows();
dateInput.value = tomorrowISO();
restore();
update();

rows.addEventListener("input", update);
rows.addEventListener("change", update);
dateInput.addEventListener("change", update);

document.querySelector("#clear-sheet").addEventListener("click", () => {
  if (!window.confirm("Clear all stock figures from this sheet?")) return;
  document.querySelectorAll(".stock-input").forEach(input => { input.value = 0; });
  document.querySelectorAll(".max-select").forEach(select => { select.value = 0; });
  dateInput.value = tomorrowISO();
  update();
  notify("Daily sheet cleared");
});

document.querySelector("#copy-order").addEventListener("click", async () => {
  const { message } = buildMessage();
  try {
    await navigator.clipboard.writeText(message);
    notify("Order copied to clipboard");
  } catch {
    notify("Could not copy automatically — select the order text instead");
  }
});

document.querySelector("#whatsapp-order").addEventListener("click", () => {
  const { message, count } = buildMessage();
  if (!count && !window.confirm("There are no items to order. Open WhatsApp anyway?")) return;
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank", "noopener");
});
