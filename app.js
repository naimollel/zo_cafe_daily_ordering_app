const menu = {
  G1: [
    ['Pastries', 'Brownies'], ['Pastries', 'Chocolate Croissants'], ['Pastries', 'Chocolate Muffins'], ['Pastries', 'Plain Croissants'], ['Pastries', 'Vanilla Muffins'],
    ['Juice', 'Mango Passion'], ['Juice', 'Passion'], ['Juice', 'Immunity Shot'], ['Juice', 'Green Detox'], ['Burger', 'Burger'],
    ['Hot Bowls', 'Steak & Mashed Potatoes'], ['Hot Bowls', 'Butter Chicken'], ['Hot Bowls', 'Chicken Biryani'], ['Hot Bowls', 'Chicken Fried Rice'], ['Hot Bowls', 'Chicken Noodles'], ['Hot Bowls', 'Swahili Bowl'], ['Hot Bowls', 'Fried Chicken 1/4 (Chicken)'], ['Hot Bowls', 'Fried Chicken 1/2 (Chicken)'], ['Hot Bowls', 'Green Chicken Curry'],
    ['Salads', 'Chicken Pasta Pesto Salad'], ['Sandwich', 'Cheese & Tomato'], ['Sandwich', 'Chicken Tikka'], ['Sandwich', 'Sandwiches & Fries'], ['Hot Snacks', 'Plate: 3 Samosas'], ['Hot Snacks', 'Samosa Plate With Fries'],
    ['Breakfast', 'Toast, Baked Beans, Grilled Tomato'], ['Breakfast', 'Add ons:'], ['Breakfast', 'Beef/ Chicken Sausage'], ['Breakfast', 'Mushrooms'], ['Breakfast', 'Avacado Slices'], ['Breakfast', 'Granola Bowl'], ['Parfaits', 'Strawberry Parfaits'], ['Parfaits', 'Mango Parfaits']
  ],
  G2: [
    ['Pastries', 'Brownies'], ['Pastries', 'Chocolate Croissants'], ['Pastries', 'Chocolate Muffins'], ['Pastries', 'Plain Croissants'], ['Pastries', 'Vanilla Muffins'],
    ['Juice', 'Mango Passion'], ['Juice', 'Passion'], ['Juice', 'Immunity Shot'], ['Juice', 'Green Detox'], ['Burger', 'Burger'],
    ['Hot Bowls', 'Butter Chicken'], ['Hot Bowls', 'Chicken Biryani'], ['Hot Bowls', 'Chicken Fried Rice'], ['Hot Bowls', 'Chicken Noodles'], ['Hot Bowls', 'Swahili Bowl'], ['Hot Bowls', 'Fried Chicken 1/4 (Chicken)'], ['Hot Bowls', 'Fried Chicken 1/2 (Chicken)'], ['Hot Bowls', 'Beef Stir Fry Rice'], ['Hot Bowls', 'Roasted Chicken Wings & Mashed Potatoes'],
    ['Salads', 'Crispy Chicken Avocado Salad'], ['Salads', 'Citrus Pasta Salad'], ['Sandwich', 'Cheese & Tomato'], ['Sandwich', 'Chicken Tikka'], ['Sandwich', 'Sandwiches & Fries'], ['Hot Snacks', 'Plate: 3 Samosas'], ['Hot Snacks', 'Samosa Plate With Fries'],
    ['Breakfast', 'Toast, Baked Beans, Grilled Tomato'], ['Breakfast', 'Add ons:'], ['Breakfast', 'Beef/ Chicken Sausage'], ['Breakfast', 'Mushrooms'], ['Breakfast', 'Avacado Slices'], ['Breakfast', 'Granola Bowl'], ['Parfaits', 'Strawberry Parfaits'], ['Parfaits', 'Mango Parfaits']
  ]
};

let selectedGroup = 'G1';
let view = 'inventory';
let reportDate = new Date().toISOString().slice(0, 10);
let state = JSON.parse(localStorage.getItem('zo-cafe-daily-report-v1') || '{}');
const normalise = value => String(value).toLowerCase().replace(/[^a-z0-9]/g, '');
const nonNegative = value => Math.max(0, Number.isFinite(Number(value)) ? Number(value) : 0);
function makeInitial(group) { return menu[group].map(([category, name]) => ({ category, name, opening: 0, sales: 0, received: 0, wastage: 0 })); }
function ensureGroup(group) {
  const saved = Array.isArray(state[group]) ? state[group] : [];
  const savedByName = new Map(saved.map(item => [normalise(item.name), item]));
  state[group] = menu[group].map(([category, name]) => {
    const old = savedByName.get(normalise(name)) || {};
    return { category, name, opening: nonNegative(old.opening ?? old.current), sales: nonNegative(old.sales ?? old.sold), received: nonNegative(old.received), wastage: nonNegative(old.wastage ?? old.waste) };
  });
  return state[group];
}
function save() { localStorage.setItem('zo-cafe-daily-report-v1', JSON.stringify(state)); }
function currentItems() { return ensureGroup(selectedGroup); }
function closingStock(item) { return Math.max(0, item.opening + item.received - item.sales - item.wastage); }
function changedItems() { return currentItems().filter(item => item.sales || item.received || item.wastage || item.opening); }
function formatDate(value) { return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${value}T12:00:00`)); }

function numberInput(index, field) {
  const item = currentItems()[index];
  return `<input class="stock-input" data-index="${index}" data-field="${field}" type="number" min="0" inputmode="numeric" value="${item[field]}" aria-label="${field} for ${item.name}" />`;
}
function renderInventory() {
  let previousCategory = '';
  const body = document.getElementById('inventoryBody');
  body.innerHTML = currentItems().map((item, index) => {
    const category = item.category !== previousCategory ? (previousCategory = item.category, `<tr class="category-row"><td colspan="6">${item.category}</td></tr>`) : '';
    return `${category}<tr><td>${item.name}</td><td>${numberInput(index, 'opening')}</td><td>${numberInput(index, 'sales')}</td><td>${numberInput(index, 'received')}</td><td>${numberInput(index, 'wastage')}</td><td><span class="closing-stock">${closingStock(item)}</span></td></tr>`;
  }).join('');
  body.querySelectorAll('.stock-input').forEach(input => {
    input.addEventListener('input', event => { const field = event.currentTarget; currentItems()[Number(field.dataset.index)][field.dataset.field] = nonNegative(field.value); save(); });
    input.addEventListener('change', updateItem);
  });
}
function updateItem(event) {
  const input = event.currentTarget;
  currentItems()[Number(input.dataset.index)][input.dataset.field] = nonNegative(input.value);
  save(); render();
}
function renderOrder() {
  let previousCategory = '';
  const items = changedItems();
  document.getElementById('orderList').innerHTML = items.map(item => {
    const category = item.category !== previousCategory ? (previousCategory = item.category, `<div class="order-category">${item.category}</div>`) : '';
    return `${category}<div class="order-item"><span>${item.name}</span><strong>${closingStock(item)} left</strong></div>`;
  }).join('');
  document.getElementById('orderEmpty').classList.toggle('hidden', items.length !== 0);
}
function renderSummary() {
  const items = currentItems();
  document.getElementById('trackedCount').textContent = items.length;
  document.getElementById('stockCount').textContent = items.reduce((sum, item) => sum + closingStock(item), 0);
  document.getElementById('needCount').textContent = items.reduce((sum, item) => sum + item.sales + item.received + item.wastage, 0);
  document.getElementById('needLabel').textContent = 'Units changed today';
  document.getElementById('wasteCount').textContent = items.reduce((sum, item) => sum + item.wastage, 0);
  document.getElementById('orderBadge').textContent = changedItems().length;
}
function orderMessage() {
  const lines = [`*ZO CAFÉ — ${selectedGroup} DAILY REPORT*`, `*Date:* ${formatDate(reportDate)}`, '']; let previousCategory = '';
  changedItems().forEach(item => { if (item.category !== previousCategory) { previousCategory = item.category; lines.push(`*${item.category}*`); } lines.push(`• ${item.name}: opening ${item.opening}, sales ${item.sales}, received ${item.received}, wastage ${item.wastage}, closing ${closingStock(item)}`); });
  if (lines.length === 3) lines.push('No quantities recorded yet.');
  return lines.join('\n');
}
function encodeReportData(data) { return btoa(unescape(encodeURIComponent(JSON.stringify(data)))); }
function decodeReportData(value) { return JSON.parse(decodeURIComponent(escape(atob(value)))); }

function pdfEscape(value) { return String(value).replace(/\\/g, '\\\\').replace(/[()]/g, '\\$&'); }
function buildReportPdf(items, payload) {
  const pageWidth = 595, pageHeight = 842, margin = 48, width = pageWidth - margin * 2, columns = [180, 72, 58, 64, 62, width - 436], x = [margin];
  columns.forEach(column => x.push(x[x.length - 1] + column));
  const pages = [[]]; let page = pages[0], y = 54;
  const put = command => page.push(command);
  const rect = (left, top, w, h, mode = 'S') => put(`${left} ${pageHeight - top - h} ${w} ${h} re ${mode}`);
  const line = (x1, y1, x2, y2) => put(`${x1} ${pageHeight - y1} m ${x2} ${pageHeight - y2} l S`);
  const text = (value, left, top, size = 9, font = 'F1', centered = false, white = false) => {
    const string = pdfEscape(value), estimate = string.length * size * .52, start = centered ? left - estimate / 2 : left;
    put(`${white ? '1 1 1' : '0 0 0'} rg BT /${font} ${size} Tf 1 0 0 1 ${start.toFixed(1)} ${(pageHeight - top).toFixed(1)} Tm (${string}) Tj ET`);
  };
  const splitName = name => name.length > 34 ? [name.slice(0, name.lastIndexOf(' ', 34) || 34), name.slice(name.lastIndexOf(' ', 34) + 1)] : [name];
  const header = () => {
    rect(margin, y, width, 31); put('0 0 0 rg'); rect(margin + 180, y, width - 180, 31, 'f'); text(`DATE: ${formatDate(reportDate)}`, margin + 5, y + 12, 10, 'F1'); text('ZO CAFE DAILY SHEET', margin + 180 + (width - 180) / 2, y + 20, 13, 'F1', true, true); y += 31;
    rect(margin, y, width, 26); x.slice(1, -1).forEach(value => line(value, y, value, y + 26)); ['ITEMS', 'OPENING', 'SALES', 'RECEIVED', 'WASTAGE', 'CLOSING'].forEach((value, index) => text(value, x[index] + columns[index] / 2, y + 10, 8, 'F1', true)); text('STOCK', x[1] + columns[1] / 2, y + 19, 8, 'F1', true); text('STOCK', x[5] + columns[5] / 2, y + 19, 8, 'F1', true); y += 26;
  };
  const newPage = () => { page = []; pages.push(page); y = 42; header(); };
  header(); let previousCategory = '';
  items.forEach(item => {
    if (item.category !== previousCategory) { if (y > 773) newPage(); previousCategory = item.category; put('.84 .84 .84 rg'); rect(margin, y, columns[0], 15, 'f'); rect(margin, y, width, 15); x.slice(1, -1).forEach(value => line(value, y, value, y + 15)); text(item.category.toUpperCase(), margin + 4, y + 10, 8.5, 'F1'); y += 15; }
    const nameLines = splitName(item.name), rowHeight = nameLines.length * 10 + 5; if (y + rowHeight > 795) newPage(); rect(margin, y, width, rowHeight); x.slice(1, -1).forEach(value => line(value, y, value, y + rowHeight)); nameLines.forEach((value, index) => text(value, margin + 4, y + 10 + index * 10, 8.5, 'F2'));
    [item.opening, item.sales, item.received, item.wastage, closingStock(item)].forEach((value, index) => text(value, x[index + 1] + columns[index + 1] / 2, y + rowHeight / 2 + 3, 9, 'F1', true)); y += rowHeight;
  });
  const objects = []; const add = body => { objects.push(body); return objects.length; }; const catalog = add(''), pageTree = add(''), helvetica = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>'), times = add('<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman >>');
  const pageIds = pages.map(commands => { const stream = commands.join('\n'); const content = add(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`); return add(`<< /Type /Page /Parent ${pageTree} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${helvetica} 0 R /F2 ${times} 0 R >> >> /Contents ${content} 0 R >>`); });
  const info = add(`<< /Title (Zo Cafe ${selectedGroup} daily report) /Author (Zo Cafe Daily Report) /Subject (ZO_CAFE_DATA:${encodeReportData(payload)}) >>`); objects[catalog - 1] = `<< /Type /Catalog /Pages ${pageTree} 0 R >>`; objects[pageTree - 1] = `<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;
  let pdf = '%PDF-1.4\n', offsets = [0]; objects.forEach((body, index) => { offsets[index + 1] = pdf.length; pdf += `${index + 1} 0 obj\n${body}\nendobj\n`; }); const start = pdf.length; pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`; offsets.slice(1).forEach(offset => { pdf += `${String(offset).padStart(10, '0')} 00000 n \n`; }); return `${pdf}trailer\n<< /Size ${objects.length + 1} /Root ${catalog} 0 R /Info ${info} 0 R >>\nstartxref\n${start}\n%%EOF`;
}
function downloadPdf() {
  const payload = { version: 1, reportDate, groups: { G1: ensureGroup('G1'), G2: ensureGroup('G2') } }, pdf = buildReportPdf(currentItems(), payload), link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([pdf], { type: 'application/pdf' })); link.download = `Zo_Cafe_${selectedGroup}_Daily_Report_${reportDate}.pdf`; link.click(); URL.revokeObjectURL(link.href); showToast('Filled daily-report PDF downloaded');
}
async function uploadPdf(file) {
  if (!file) return;
  try {
    const contents = new TextDecoder('latin1').decode(await file.arrayBuffer()), marker = contents.match(/ZO_CAFE_DATA:([A-Za-z0-9+/=]+)/), payload = marker && decodeReportData(marker[1]);
    if (!payload?.groups || !Array.isArray(payload.groups.G1) || !Array.isArray(payload.groups.G2)) throw new Error('invalid report data');
    state = payload.groups; reportDate = /^\d{4}-\d{2}-\d{2}$/.test(payload.reportDate) ? payload.reportDate : reportDate; ensureGroup('G1'); ensureGroup('G2'); save(); render(); showToast('PDF loaded successfully.');
  } catch { showToast('This is not a Zo Café report PDF. Upload a PDF downloaded from this form.'); }
}
function showToast(message) { const toast = document.getElementById('toast'); toast.textContent = message; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2800); }
function render() {
  document.querySelectorAll('.group-card').forEach(button => button.classList.toggle('active', button.dataset.group === selectedGroup)); document.querySelectorAll('.view-tab').forEach(button => button.classList.toggle('active', button.dataset.view === view));
  document.getElementById('groupTitle').textContent = `${selectedGroup} Daily Report`; document.getElementById('orderHeading').textContent = `${selectedGroup} Daily Report`; document.getElementById('orderDate').textContent = formatDate(reportDate);
  document.getElementById('reportDate').value = reportDate;
  document.getElementById('inventoryView').classList.toggle('hidden', view !== 'inventory'); document.getElementById('orderView').classList.toggle('hidden', view !== 'order'); renderSummary(); renderInventory(); renderOrder();
}
document.querySelectorAll('.group-card').forEach(button => button.addEventListener('click', () => { selectedGroup = button.dataset.group; render(); })); document.querySelectorAll('.view-tab').forEach(button => button.addEventListener('click', () => { view = button.dataset.view; render(); }));
document.getElementById('exportPdf').addEventListener('click', downloadPdf); document.getElementById('importPdf').addEventListener('change', event => { uploadPdf(event.target.files[0]); event.target.value = ''; });
document.getElementById('reportDate').addEventListener('change', event => { if (event.target.value) { reportDate = event.target.value; render(); } });
document.getElementById('copyButton').addEventListener('click', async () => { try { await navigator.clipboard.writeText(orderMessage()); showToast('Daily report copied to clipboard'); } catch { showToast('Unable to copy — select from Daily report instead'); } });
document.getElementById('whatsappButton').addEventListener('click', () => { window.open(`https://wa.me/255719387276?text=${encodeURIComponent(orderMessage())}`, '_blank', 'noopener'); });
document.getElementById('resetButton').addEventListener('click', () => { if (confirm('Start a new day? This sets both daily reports to zero.')) { state.G1 = makeInitial('G1'); state.G2 = makeInitial('G2'); reportDate = new Date().toISOString().slice(0, 10); save(); render(); showToast('New daily reports started at zero'); } });
ensureGroup('G1'); ensureGroup('G2'); save(); render();
