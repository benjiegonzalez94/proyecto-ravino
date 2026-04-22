// ============================================================
// THEME TOGGLE
// ============================================================
(function applyThemeOnLoad() {
    if (localStorage.getItem('ravino_theme') === 'light') {
        document.documentElement.classList.add('light');
    }
})();

function toggleTheme() {
    const isLight = document.documentElement.classList.toggle('light');
    localStorage.setItem('ravino_theme', isLight ? 'light' : 'dark');
    const icon = document.getElementById('themeIcon');
    if (icon) icon.textContent = isLight ? '☀️' : '🌙';
}

// ============================================================
// DATA STORE (server-backed with localStorage fallback)
// ============================================================
const STORAGE_KEY = 'ravino_report_data';
let serverMode = false;  // Will be true if server API is available

function loadStore() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch (e) { console.error(e); }
    return null;
}

function saveStore(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getDefaultData() {
    return {
        importers: [
            { id: 1, name: "אריזות ירושלים בע\"מ", phone: "+972 54 719 2269", email: "" },
            { id: 2, name: "בולוס נאיל בע\"מ", phone: "04-6462103", email: "" },
            { id: 3, name: "שי רוקח בע\"מ", phone: "054-2705791", email: "" },
            { id: 4, name: "תבואות מוצרי מזון אורגניים טבעיים בע\"מ", phone: "5790002", email: "" },
            { id: 5, name: "מרום משה בע\"מ", phone: "2506881", email: "" },
            { id: 6, name: "סנדרה פאולה מונטאנו", phone: "972-0533079532", email: "importmalajim@gmail.com" },
            { id: 7, name: "אופל יאצא בע\"מ", phone: "09-7415025", email: "" },
            { id: 8, name: "מיקי עוז עסקים בע\"מ", phone: "08-8538383", email: "nir@ozasakim.com" },
            { id: 9, name: "בית-אל מזון בע\"מ", phone: "04-6397733", email: "" },
            { id: 10, name: "רי באר בע\"מ", phone: "03-5272489", email: "" }
        ],
        certifiers: [
            { id: 1, name: "בדץ בית יוסף", email: "6550550@gmail.com", fax: "02-6510580", phone: "02-6550550" },
            { id: 2, name: "בדץ איגוד הרבנים מנשסתר", email: "", fax: "", phone: "" },
            { id: 3, name: "בדץ מחזיקי הדת- בעלזא", email: "", fax: "", phone: "972538311793" }
        ],
        factories: [
            { id: 1, name: "דה נייל אג'יפטיאן קו. פור פוד סטאף איי", city: "בהרה", country: "מצרים", contact: "", phone: "", email: "" },
            { id: 2, name: "אי.ג'י.סי.טי. פרואוזן", city: "אלכסנדריה", country: "מצרים", contact: "", phone: "", email: "" },
            { id: 3, name: "גלובל פרויטס", city: "נאסר סיטי", country: "מצרים", contact: "Yaser", phone: "", email: "" },
            { id: 4, name: "קומרסיאליאדורה פחן סאס", city: "קונדינאמארקה", country: "קולומביה", contact: "Sucre rodriguez", phone: "573138702868", email: "" },
            { id: 5, name: "ניזה אס.אי.-פלאנטה מאני", city: "סאן לואיס", country: "ארגנטינה", contact: "וויקטור חונסון", phone: "5492657333509", email: "niza.com.ar" },
            { id: 6, name: "פיטרובון וסיא לימיטד", city: "טאפגרה", country: "ברזיל", contact: "חוהאו פיטרובון", phone: "", email: "" },
            { id: 7, name: "נוקומיס אינק", city: "טרואה פיסטול, קבק", country: "קנדה", contact: "Vincent More", phone: "+1 (418) 851-1779", email: "" },
            { id: 8, name: "תעשיות ברנרד ובנו", city: "סנט. וויקטוריה", country: "קנדה", contact: "Martín Bernard", phone: "+1 (418) 226-5888", email: "" },
            { id: 9, name: "קונגלדוס אקווטוריאנוס אקווקונגלה ס. א.", city: "גוויאקיל", country: "אקוודור", contact: "Sucre rodriguez", phone: "593991532925", email: "" },
            { id: 10, name: "אלפה פרוסט", city: "אלכסנדריה", country: "מצרים", contact: "Mustafa", phone: "+20 128 424 4427", email: "" }
        ],
        rawMaterials: [
            { id: 1, name: 'סוכר', category: 'ממתיקים' },
            { id: 2, name: 'מלח', category: 'תבלינים' },
            { id: 3, name: 'קמח חיטה', category: 'קמחים' },
            { id: 4, name: 'שמן סויה', category: 'שמנים' },
            { id: 5, name: 'שמן דקלים', category: 'שמנים' },
            { id: 6, name: 'חומץ', category: 'חומצות' },
            { id: 7, name: 'חומצת לימון', category: 'חומצות' },
            { id: 8, name: 'ג׳לטין', category: 'מייצבים' },
            { id: 9, name: 'לציטין', category: 'תוספים' },
            { id: 10, name: 'צבעי מאכל', category: 'תוספים' },
        ],
        signatures: [],
        nextId: 100
    };
}

let store = loadStore() || getDefaultData();
if (!store.signatures) store.signatures = [];
if (!store.rawMaterials) store.rawMaterials = [];
if (!store.products) store.products = [];
if (!store.nextId) store.nextId = 100;

function genId() { return store.nextId++; }

// ============================================================
// TAB NAVIGATION
// ============================================================
function showTab(tab) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('view-' + tab).classList.add('active');
    const tabBtn = document.getElementById('tab-' + tab);
    if (tabBtn) tabBtn.classList.add('active');
    if (tab === 'admin') renderAllAdminLists();
    if (tab === 'report') {
        showReportList();
    }
}

function showReportList() {
    document.getElementById('historyPanel').style.display = '';
    document.getElementById('formPanel').style.display = 'none';
    renderHistory();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showFormPanel() {
    document.getElementById('historyPanel').style.display = 'none';
    document.getElementById('formPanel').style.display = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showAdminSection(section) {
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('admin-' + section).classList.add('active');
    event.target.classList.add('active');
}

// ============================================================
// EXPORT / IMPORT MASTER DATA
// ============================================================
function exportMasterData() {
    const exportData = {
        _exportedAt: new Date().toISOString(),
        _version: '1.0',
        importers: store.importers || [],
        certifiers: store.certifiers || [],
        factories: store.factories || [],
        rawMaterials: store.rawMaterials || [],
        products: store.products || [],
        signatures: store.signatures || [],
    };

    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `ravino_datos_maestros_${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('נתונים יוצאו בהצלחה ✓');
}

async function importMasterData(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        const text = await file.text();
        const data = JSON.parse(text);

        // Validate structure
        const types = ['importers', 'certifiers', 'factories', 'rawMaterials', 'products', 'signatures'];
        const hasData = types.some(t => Array.isArray(data[t]) && data[t].length > 0);
        if (!hasData) {
            toast('הקובץ אינו מכיל נתונים תקפים');
            event.target.value = '';
            return;
        }

        // Ask user: merge or replace
        const mode = confirm(
            'כיצד לייבא את הנתונים?\n\n' +
            'אישור = מיזוג (הוספה לנתונים הקיימים)\n' +
            'ביטול = החלפה (מחיקת הנתונים הקיימים)'
        ) ? 'merge' : 'replace';

        let counts = { added: 0, updated: 0 };

        for (const type of types) {
            if (!Array.isArray(data[type])) continue;

            if (mode === 'replace') {
                store[type] = data[type];
                counts.added += data[type].length;
            } else {
                // Merge: add new items, update existing by ID
                for (const item of data[type]) {
                    const existingIdx = store[type].findIndex(e => e.id === item.id);
                    if (existingIdx >= 0) {
                        store[type][existingIdx] = item;
                        counts.updated++;
                    } else {
                        store[type].push(item);
                        counts.added++;
                    }
                }
            }
        }

        // Save locally
        saveStore();

        // Sync to server if available
        if (serverMode) {
            try {
                await fetch('/api/data', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(store)
                });
            } catch (e) { console.warn('Server sync failed:', e); }
        }

        // Refresh UI
        renderAllAdminLists();
        populateSelects();
        renderRawMaterialsChecklist();
        renderProductsChecklist();
        renderSupervisorsChecklist();
        fillSignatureSelects();

        const msg = mode === 'replace'
            ? `הנתונים הוחלפו בהצלחה (${counts.added} פריטים) ✓`
            : `מיזוג הושלם: ${counts.added} חדשים, ${counts.updated} עודכנו ✓`;
        toast(msg);

    } catch (e) {
        console.error('Import error:', e);
        toast('שגיאה בייבוא: קובץ לא תקין');
    }

    event.target.value = ''; // Reset file input
}

// ============================================================
// POPULATE SELECTS
// ============================================================
function populateSelects() {
    fillSelect('selImporter', store.importers, i => i.nameHeb || i.name);
    fillSelect('selCertifier', store.certifiers, 'name');
    fillSelect('selFactory', store.factories, 'name');
    fillSignatureSelects();
}

function fillSelect(selectId, items, labelField) {
    const sel = document.getElementById(selectId);
    const currentVal = sel.value;
    const firstOpt = sel.options[0];
    sel.innerHTML = '';
    sel.appendChild(firstOpt);
    items.forEach(item => {
        const opt = document.createElement('option');
        opt.value = item.id;
        opt.textContent = typeof labelField === 'function' ? labelField(item) : item[labelField];
        sel.appendChild(opt);
    });
    sel.value = currentVal;
}

function fillSignatureSelects() {
    ['selSigSupervisor'].forEach(selId => {
        const sel = document.getElementById(selId);
        if (!sel) return;
        const currentVal = sel.value;
        const firstOpt = sel.options[0];
        sel.innerHTML = '';
        sel.appendChild(firstOpt);
        store.signatures.forEach(sig => {
            const opt = document.createElement('option');
            opt.value = sig.id;
            opt.textContent = sig.name;
            sel.appendChild(opt);
        });
        sel.value = currentVal;
    });
}

// ============================================================
// ON SELECT CHANGE HANDLERS
// ============================================================
function onImporterChange() {
    const sel = document.getElementById('selImporter');
    const item = store.importers.find(i => i.id == sel.value);
    document.getElementById('importerPhone').value = item ? item.phone : '';
    document.getElementById('importerEmail').value = item ? item.email : '';
}

function onCertifierChange() {
    const sel = document.getElementById('selCertifier');
    const item = store.certifiers.find(i => i.id == sel.value);
    document.getElementById('certifierPhone').value = item ? item.phone : '';
    document.getElementById('certifierFax').value = item ? item.fax : '';
    document.getElementById('certifierEmail').value = item ? item.email : '';
}

function onFactoryChange() {
    const sel = document.getElementById('selFactory');
    const item = store.factories.find(i => i.id == sel.value);
    document.getElementById('factoryContact').value = item ? item.contact : '';
    document.getElementById('factoryPhone').value = item ? item.phone : '';
    document.getElementById('factoryCountry').value = item ? item.country : '';
    document.getElementById('factoryCity').value = item ? item.city : '';
    
    // Auto-fill production process if defined in master data
    if (item && item.process) {
        document.getElementById('productionProcess').value = item.process;
    } else {
        document.getElementById('productionProcess').value = '';
    }
}

function onSignatureSelect(type) {
    const sel = document.getElementById('selSigSupervisor');
    const preview = document.getElementById('sigSupervisor');
    const sig = store.signatures.find(s => s.id == sel.value);
    if (sig && sig.imageData) {
        preview.innerHTML = `<img src="${sig.imageData}" alt="חתימה">`;
    } else {
        preview.innerHTML = '<span class="sig-placeholder">לחץ לבחור חתימה</span>';
    }
    const sigFinal = document.getElementById('sigFinal');
    if (sig && sig.imageData && sigFinal) {
        sigFinal.innerHTML = `<img src="${sig.imageData}" alt="חתימה">`;
    }
}

// ============================================================
// ADMIN CRUD (server-aware: calls API when server is running)
// ============================================================

async function serverAdd(type, item) {
    if (!serverMode) return item;
    try {
        const resp = await fetch(`/api/${type}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
        });
        const result = await resp.json();
        if (result.success) return result.item;
        throw new Error(result.error);
    } catch (err) {
        console.error('Server add error:', err);
        toast('שגיאת שרת: ' + err.message);
        return null;
    }
}

async function serverDelete(type, id) {
    if (!serverMode) return true;
    try {
        const resp = await fetch(`/api/${type}/${id}`, { method: 'DELETE' });
        const result = await resp.json();
        return result.success;
    } catch (err) {
        console.error('Server delete error:', err);
        toast('שגיאת שרת: ' + err.message);
        return false;
    }
}

// ============================================================
// SAVE EDITED ITEM (generic update for edit mode)
// ============================================================
async function saveEditedItem(type, updated) {
    const editIdEl = document.getElementById('editId-' + type);
    if (!editIdEl || !editIdEl.value) return false; // not in edit mode

    const id = parseInt(editIdEl.value);
    const item = (store[type] || []).find(i => i.id === id);
    if (!item) return false;

    Object.assign(item, updated);

    if (serverMode) {
        try {
            await fetch(`/api/${type}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updated)
            });
        } catch (e) { console.warn('Server update failed:', e); }
    }

    saveStore();
    cancelEdit(type);
    renderAdminList(type);
    populateSelects();
    if (type === 'rawMaterials') renderRawMaterialsChecklist();
    if (type === 'products') renderProductsChecklist();
    toast('הפריט עודכן בהצלחה ✓');
    return true;
}

async function addImporter() {
    const name = document.getElementById('newImpName').value.trim();
    if (!name) { toast('נא להזין שם'); return; }
    const data = {
        name,
        nameHeb: name,
        phone: document.getElementById('newImpPhone').value.trim(),
        email: document.getElementById('newImpEmail').value.trim()
    };

    // Check if editing
    if (await saveEditedItem('importers', data)) return;

    const item = await serverAdd('importers', data);
    if (!item) return;

    if (!serverMode) { data.id = genId(); store.importers.push(data); }
    else { store.importers.push(item); }

    saveStore(store);
    cancelEdit('importers');
    renderAdminList('importers');
    populateSelects();
    toast('יבואן נוסף בהצלחה ✓');
}

async function addCertifier() {
    const name = document.getElementById('newCertName').value.trim();
    if (!name) { toast('נא להזין שם'); return; }
    const data = {
        name,
        email: document.getElementById('newCertEmail').value.trim(),
        fax: document.getElementById('newCertFax').value.trim(),
        phone: document.getElementById('newCertPhone').value.trim()
    };

    if (await saveEditedItem('certifiers', data)) return;

    const item = await serverAdd('certifiers', data);
    if (!item) return;

    if (!serverMode) { data.id = genId(); store.certifiers.push(data); }
    else { store.certifiers.push(item); }

    saveStore(store);
    cancelEdit('certifiers');
    renderAdminList('certifiers');
    populateSelects();
    toast('גוף כשרות נוסף בהצלחה ✓');
}

async function addFactory() {
    const name = document.getElementById('newFactName').value.trim();
    if (!name) { toast('נא להזין שם'); return; }
    const data = {
        name,
        city: document.getElementById('newFactCity').value.trim(),
        country: document.getElementById('newFactCountry').value.trim(),
        contact: document.getElementById('newFactContact').value.trim(),
        phone: document.getElementById('newFactPhone').value.trim(),
        email: document.getElementById('newFactEmail').value.trim(),
        process: document.getElementById('newFactProcess').value.trim()
    };

    if (await saveEditedItem('factories', data)) return;

    const item = await serverAdd('factories', data);
    if (!item) return;

    if (!serverMode) { data.id = genId(); store.factories.push(data); }
    else { store.factories.push(item); }

    saveStore(store);
    cancelEdit('factories');
    renderAdminList('factories');
    populateSelects();
    toast('מפעל נוסף בהצלחה ✓');
}

function previewSignature(evt) {
    const file = evt.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
        document.getElementById('sigUploadPreview').innerHTML = `<img src="${e.target.result}" alt="preview">`;
        document.getElementById('sigUploadPreview')._imageData = e.target.result;
    };
    reader.readAsDataURL(file);
}

async function addSignature() {
    const name = document.getElementById('newSigName').value.trim();
    const preview = document.getElementById('sigUploadPreview');
    if (!name) { toast('נא להזין שם'); return; }

    // Edit mode for signatures (name only)
    const editIdEl = document.getElementById('editId-signatures');
    if (editIdEl && editIdEl.value) {
        const data = { name };
        if (preview._imageData) data.imageData = preview._imageData;
        if (await saveEditedItem('signatures', data)) {
            preview.innerHTML = ''; preview._imageData = null;
            fillSignatureSelects();
            renderSupervisorsChecklist();
            return;
        }
    }

    if (!preview._imageData) { toast('נא לבחור תמונת חתימה'); return; }
    const data = { name, imageData: preview._imageData };

    const item = await serverAdd('signatures', data);
    if (!item) return;

    if (!serverMode) { data.id = genId(); store.signatures.push(data); }
    else { store.signatures.push(item); }

    saveStore(store);
    cancelEdit('signatures');
    preview.innerHTML = ''; preview._imageData = null;
    renderAdminList('signatures');
    fillSignatureSelects();
    renderSupervisorsChecklist();
    toast('חתימה נוספה בהצלחה ✓');
}

async function deleteItem(type, id) {
    if (!confirm('האם אתה בטוח שברצונך למחוק?')) return;

    if (serverMode) {
        const ok = await serverDelete(type, id);
        if (!ok) return;
    }

    store[type] = store[type].filter(i => i.id !== id);
    saveStore(store);
    renderAdminList(type);
    populateSelects();
    if (type === 'rawMaterials') renderRawMaterialsChecklist();
    if (type === 'products') renderProductsChecklist();
    toast('נמחק בהצלחה');
}

async function addRawMaterial() {
    const name = document.getElementById('newRawMatName').value.trim();
    if (!name) { toast('נא להזין שם חומר גלם'); return; }
    const data = {
        name,
        category: document.getElementById('newRawMatCategory').value.trim(),
        manufacturer: document.getElementById('newRawMatManufacturer').value.trim(),
        certification: document.getElementById('newRawMatCertification').value.trim()
    };

    if (await saveEditedItem('rawMaterials', data)) return;

    const item = await serverAdd('rawMaterials', data);
    if (!item) return;

    if (!serverMode) { data.id = genId(); store.rawMaterials.push(data); }
    else { store.rawMaterials.push(item); }

    saveStore(store);
    cancelEdit('rawMaterials');
    renderAdminList('rawMaterials');
    renderRawMaterialsChecklist();
    toast('חומר גלם נוסף בהצלחה ✓');
}

// Add a one-time custom raw material directly in the report form
function addCustomRawMaterial() {
    const input = document.getElementById('customRawMaterial');
    const name = input.value.trim();
    if (!name) { toast('נא להזין שם חומר גלם'); return; }

    // Add as temporary checkbox to the checklist
    const container = document.getElementById('rawMaterialsChecklist');
    const id = 'custom_' + Date.now();
    const div = document.createElement('label');
    div.className = 'raw-mat-item custom';
    div.innerHTML = `<input type="checkbox" name="rawMat" value="${name}" checked> <span>${name}</span> <small>(חד פעמי)</small>`;
    container.appendChild(div);
    updateRawMaterialsHidden();
    input.value = '';
    toast('חומר גלם נוסף לרשימה ✓');
}

// ============================================================
// RAW MATERIALS CHECKLIST (in report form)
// ============================================================
function renderRawMaterialsChecklist() {
    const container = document.getElementById('rawMaterialsChecklist');
    if (!container) return;
    const items = store.rawMaterials || [];

    if (items.length === 0) {
        container.innerHTML = '<div style="text-align:center;color:var(--text2);padding:12px;">אין חומרי גלם מוגדרים. הוסף חומרי גלם בניהול נתונים.</div>';
        return;
    }

    // Group by category
    const categories = {};
    items.forEach(item => {
        const cat = item.category || 'כללי';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(item);
    });

    let html = '';
    for (const [cat, catItems] of Object.entries(categories)) {
        html += `<div class="raw-mat-category">`;
        html += `<div class="raw-mat-category-title">${cat}</div>`;
        html += `<div class="raw-mat-category-items">`;
        catItems.forEach(item => {
            const details = [item.manufacturer, item.certification].filter(Boolean).join(' - ');
            const fullLine = details ? `${item.name} - ${details}` : item.name;
            const detailSpan = details ? `<span class="raw-mat-detail"> (${details})</span>` : '';
            html += `<label class="raw-mat-item"><input type="checkbox" name="rawMat" value="${item.name}" data-fullline="${fullLine}" onchange="updateRawMaterialsHidden()"> <span>${item.name}${detailSpan}</span></label>`;
        });
        html += `</div></div>`;
    }
    container.innerHTML = html;
}

function updateRawMaterialsHidden() {
    const checked = Array.from(document.querySelectorAll('input[name="rawMat"]:checked'));
    const lines = checked.map(cb => cb.dataset.fullline || cb.value);
    document.getElementById('rawMaterials').value = lines.join('\n');
}

// ============================================================
// PRODUCTS MASTER DATA & CHECKLIST
// ============================================================
async function addProduct() {
    const name = document.getElementById('newProductName').value.trim();
    if (!name) { toast('נא להזין שם מוצר'); return; }
    const data = { name };

    if (await saveEditedItem('products', data)) return;

    const item = await serverAdd('products', data);
    if (!item) return;

    if (!store.products) store.products = [];
    if (!serverMode) { data.id = genId(); store.products.push(data); }
    else { store.products.push(item); }

    saveStore(store);
    cancelEdit('products');
    renderAdminList('products');
    renderProductsChecklist();
    toast('מוצר נוסף בהצלחה ✓');
}

function renderProductsChecklist() {
    const container = document.getElementById('productsChecklist');
    if (!container) return;
    const items = store.products || [];

    if (items.length === 0) {
        container.innerHTML = '<div style="text-align:center;color:var(--text2);padding:12px;">אין מוצרים מוגדרים. הוסף מוצרים בניהול נתונים.</div>';
        return;
    }

    let html = '<div class="raw-mat-category-items">';
    items.forEach(item => {
        html += `<label class="raw-mat-item"><input type="checkbox" name="productItem" value="${item.name}" onchange="updateProductsHidden()"> <span>${item.name}</span></label>`;
    });
    html += '</div>';
    container.innerHTML = html;
}

function updateProductsHidden() {
    const checked = Array.from(document.querySelectorAll('input[name="productItem"]:checked'));
    const names = checked.map(cb => cb.value);
    document.getElementById('products').value = names.join(', ');

    // Auto-fill supervised products with selected product names
    const supervisedEl = document.getElementById('supervisedProducts');
    if (supervisedEl) {
        const lines = names.map(n => `${n} — כמות: `);
        supervisedEl.value = lines.join('\n');
    }
}

// ============================================================
// SUPERVISORS CHECKLIST
// ============================================================
let manualSupervisors = []; // manually added supervisors

function renderSupervisorsChecklist() {
    const container = document.getElementById('supervisorsChecklist');
    if (!container) return;
    const sigs = store.signatures || [];

    let html = '';

    // Signatures from master data
    if (sigs.length > 0) {
        html += '<div class="raw-mat-category-items">';
        sigs.forEach(sig => {
            html += `<label class="raw-mat-item"><input type="checkbox" name="supervisorItem" value="${sig.name}" onchange="updateSupervisorsHidden()"> <span>${sig.name}</span></label>`;
        });
        html += '</div>';
    }

    // Manually added supervisors
    if (manualSupervisors.length > 0) {
        html += '<div class="raw-mat-category" style="margin-top:8px;">';
        html += '<div class="raw-mat-category-title">נוספו ידנית</div>';
        html += '<div class="raw-mat-category-items">';
        manualSupervisors.forEach((name, idx) => {
            html += `<label class="raw-mat-item"><input type="checkbox" name="supervisorItem" value="${name}" checked onchange="updateSupervisorsHidden()"> <span>${name}</span> <button type="button" onclick="removeManualSupervisor(${idx})" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:14px;margin-right:4px;">✕</button></label>`;
        });
        html += '</div></div>';
    }

    if (!html) {
        html = '<div style="text-align:center;color:var(--text2);padding:12px;">אין משגיחים מוגדרים. הוסף חתימות בניהול נתונים או הקלד ידנית למטה.</div>';
    }

    container.innerHTML = html;
}

function addManualSupervisor() {
    const input = document.getElementById('manualSupervisorInput');
    const name = input.value.trim();
    if (!name) return;
    manualSupervisors.push(name);
    input.value = '';
    renderSupervisorsChecklist();
    updateSupervisorsHidden();
}

function removeManualSupervisor(idx) {
    manualSupervisors.splice(idx, 1);
    renderSupervisorsChecklist();
    updateSupervisorsHidden();
}

function updateSupervisorsHidden() {
    const checked = Array.from(document.querySelectorAll('input[name="supervisorItem"]:checked'));
    const names = checked.map(cb => cb.value);
    const allNames = names.join(', ');

    // First name goes to supervisorName, rest to additionalSupervisors
    document.getElementById('supervisorName').value = names[0] || '';
    document.getElementById('additionalSupervisors').value = names.slice(1).join(', ');

    // Auto-fill related fields (only if currently empty or previously auto-filled)
    const bishulBy = document.getElementById('bishulBy');
    if (bishulBy && (!bishulBy.value || bishulBy.dataset.autoFilled === 'true')) {
        bishulBy.value = allNames;
        bishulBy.dataset.autoFilled = 'true';
    }

    const regularSup = document.getElementById('regularSupervisorName');
    if (regularSup && (!regularSup.value || regularSup.dataset.autoFilled === 'true')) {
        regularSup.value = allNames;
        regularSup.dataset.autoFilled = 'true';
    }
}

// ============================================================
// RENDER ADMIN LISTS
// ============================================================
function renderAllAdminLists() {
    ['importers', 'certifiers', 'factories', 'rawMaterials', 'products', 'signatures'].forEach(renderAdminList);
}

function renderAdminList(type) {
    const container = document.getElementById('list-' + type);
    if (!container) return;
    const items = store[type] || [];
    if (items.length === 0) {
        container.innerHTML = '<div style="text-align:center;color:var(--text2);padding:20px;">אין פריטים</div>';
        return;
    }
    if (type === 'signatures') {
        container.innerHTML = items.map(s => `
            <div class="admin-item">
                <div class="sig-thumb"><img src="${s.imageData}" alt="${s.name}"></div>
                <div class="admin-item-info"><span class="admin-item-name">${s.name}</span></div>
                <div class="admin-item-actions">
                    <button class="btn-icon" onclick="editItem('signatures',${s.id})" title="ערוך">✏️</button>
                    <button class="btn-icon delete" onclick="deleteItem('signatures',${s.id})" title="מחק">🗑️</button>
                </div>
            </div>`).join('');
        return;
    }
    if (type === 'rawMaterials') {
        container.innerHTML = items.map(i => `
            <div class="admin-item">
                <div class="admin-item-info">
                    <span class="admin-item-name">${i.name}</span>
                    <span class="admin-item-details">${i.category || 'כללי'}</span>
                </div>
                <div class="admin-item-actions">
                    <button class="btn-icon" onclick="editItem('rawMaterials',${i.id})" title="ערוך">✏️</button>
                    <button class="btn-icon delete" onclick="deleteItem('rawMaterials',${i.id})" title="מחק">🗑️</button>
                </div>
            </div>`).join('');
        return;
    }
    const detailsMap = {
        importers: i => `${i.phone || ''} ${i.email ? '| ' + i.email : ''}`,
        certifiers: i => `${i.phone || ''} ${i.email ? '| ' + i.email : ''}`,
        factories: i => `${i.city || ''}, ${i.country || ''} ${i.contact ? '| ' + i.contact : ''}`,
        rawMaterials: i => {
            const parts = [i.manufacturer, i.certification].filter(Boolean);
            return parts.length ? parts.join(' | ') : (i.category || '');
        }
    };
    container.innerHTML = items.map(i => `
        <div class="admin-item">
            <div class="admin-item-info">
                <span class="admin-item-name">${i.nameHeb || i.name}</span>
                <span class="admin-item-details">${(detailsMap[type] || (() => ''))(i)}</span>
            </div>
            <div class="admin-item-actions">
                <button class="btn-icon" onclick="editItem('${type}',${i.id})" title="ערוך">✏️</button>
                <button class="btn-icon delete" onclick="deleteItem('${type}',${i.id})" title="מחק">🗑️</button>
            </div>
        </div>`).join('');
}

// ============================================================
// EDIT MASTER DATA (inline form editing)
// ============================================================
const formFieldMap = {
    importers: { name: 'newImpName', phone: 'newImpPhone', email: 'newImpEmail', nameHeb: 'newImpName' },
    certifiers: { name: 'newCertName', phone: 'newCertPhone', email: 'newCertEmail', fax: 'newCertFax' },
    factories: { name: 'newFactName', city: 'newFactCity', country: 'newFactCountry', contact: 'newFactContact', phone: 'newFactPhone', email: 'newFactEmail', process: 'newFactProcess' },
    rawMaterials: { name: 'newRawMatName', category: 'newRawMatCategory', manufacturer: 'newRawMatManufacturer', certification: 'newRawMatCertification' },
    products: { name: 'newProductName' },
    signatures: { name: 'newSigName' },
};

const formTitles = {
    importers: { add: 'הוסף יבואן חדש', edit: '✏️ עריכת יבואן' },
    certifiers: { add: 'הוסף גוף כשרות חדש', edit: '✏️ עריכת גוף כשרות' },
    factories: { add: 'הוסף מפעל חדש', edit: '✏️ עריכת מפעל' },
    rawMaterials: { add: 'הוסף חומר גלם / מרכיב חדש', edit: '✏️ עריכת חומר גלם' },
    products: { add: 'הוסף מוצר חדש', edit: '✏️ עריכת מוצר' },
    signatures: { add: 'הוסף חתימה חדשה', edit: '✏️ עריכת חתימה' },
};

const formBtnLabels = {
    importers: { add: '➕ הוסף', edit: '💾 עדכן' },
    certifiers: { add: '➕ הוסף', edit: '💾 עדכן' },
    factories: { add: '➕ הוסף', edit: '💾 עדכן' },
    rawMaterials: { add: '➕ הוסף חומר גלם', edit: '💾 עדכן חומר גלם' },
    products: { add: '➕ הוסף מוצר', edit: '💾 עדכן מוצר' },
    signatures: { add: '➕ הוסף חתימה', edit: '💾 עדכן חתימה' },
};

function editItem(type, id) {
    const item = (store[type] || []).find(i => i.id === id);
    if (!item) return;

    const fields = formFieldMap[type];
    if (!fields) return;

    // Fill form fields with current values
    for (const [key, inputId] of Object.entries(fields)) {
        const el = document.getElementById(inputId);
        if (el) el.value = item[key] || '';
    }

    // Set edit mode
    document.getElementById('editId-' + type).value = id;
    document.getElementById('formTitle-' + type).textContent = formTitles[type].edit;
    document.getElementById('formBtn-' + type).textContent = formBtnLabels[type].edit;
    document.getElementById('formCancel-' + type).style.display = '';

    // Highlight form
    const form = document.getElementById('form-' + type);
    if (form) {
        form.style.borderColor = 'var(--gold)';
        form.style.boxShadow = '0 0 12px rgba(251, 191, 36, 0.3)';
        form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function cancelEdit(type) {
    // Clear form fields
    const fields = formFieldMap[type];
    if (fields) {
        for (const inputId of Object.values(fields)) {
            const el = document.getElementById(inputId);
            if (el) el.value = '';
        }
    }

    // Reset to add mode
    document.getElementById('editId-' + type).value = '';
    document.getElementById('formTitle-' + type).textContent = formTitles[type].add;
    document.getElementById('formBtn-' + type).textContent = formBtnLabels[type].add;
    document.getElementById('formCancel-' + type).style.display = 'none';

    // Remove highlight
    const form = document.getElementById('form-' + type);
    if (form) {
        form.style.borderColor = '';
        form.style.boxShadow = '';
    }
}

// ============================================================
// SAVE / LOAD REPORT (with history - update in place)
// ============================================================
// ============================================================
// HISTORY HELPERS (server-backed)
// ============================================================
async function getHistory() {
    if (serverMode) {
        try {
            const resp = await fetch('/api/history');
            if (resp.ok) return await resp.json();
        } catch (e) { /* fallback */ }
    }
    return JSON.parse(localStorage.getItem('ravino_history') || '[]');
}

async function saveHistoryToServer(history) {
    // Always save to localStorage as fallback
    localStorage.setItem('ravino_history', JSON.stringify(history));
    if (serverMode) {
        try {
            await fetch('/api/history', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(history)
            });
        } catch (e) { console.warn('History save to server failed', e); }
    }
}

let currentReportId = null; // Track which report we're editing

async function saveReport() {
    const report = gatherFormData();

    // Metadata
    const imp = store.importers.find(i => i.id == report.importerId);
    report._label = imp ? (imp.nameHeb || imp.name) : 'דוח ללא יבואן';
    const fact = store.factories.find(f => f.id == report.factoryId);
    report._factory = fact ? fact.name : '';
    report._savedAt = new Date().toISOString();

    let history = await getHistory();

    if (currentReportId) {
        // UPDATE existing report in history
        report._id = currentReportId;
        const idx = history.findIndex(h => h._id === currentReportId);
        if (idx >= 0) {
            report._createdAt = history[idx]._createdAt || report._savedAt;
            history[idx] = report;
        } else {
            // ID exists but not found in history — insert as new
            report._createdAt = report._savedAt;
            history.unshift(report);
        }
        toast('הדוח עודכן בהצלחה ✓');
    } else {
        // CREATE new report
        report._id = Date.now().toString(36) + Math.random().toString(36).substr(2, 4);
        report._createdAt = report._savedAt;
        currentReportId = report._id;
        history.unshift(report);
        toast('דוח חדש נשמר בהצלחה ✓');
    }

    // Keep up to 2000 history records instead of 50
    if (history.length > 2000) history = history.slice(0, 2000);
    await saveHistoryToServer(history);
    localStorage.setItem('ravino_last_report', JSON.stringify(report));

    updateReportBadge();
}

function newReport() {
    clearForm();
    currentReportId = null;
    localStorage.removeItem('ravino_last_report');
    updateReportBadge();

    // Reset manual supervisors
    manualSupervisors = [];
    renderSupervisorsChecklist();

    // Set today's dates
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('reportDate').value = today;
    document.getElementById('finalDate').value = today;

    showFormPanel();
    toast('דוח חדש נוצר ✓');
}

async function updateReportBadge() {
    const badge = document.getElementById('currentReportBadge');
    const nameEl = document.getElementById('currentReportName');
    if (!badge || !nameEl) return;

    if (currentReportId) {
        const history = await getHistory();
        const report = history.find(h => h._id === currentReportId);
        const label = report ? `${report._label || 'דוח'}${report._factory ? ' — ' + report._factory : ''}` : 'דוח נוכחי';
        nameEl.textContent = `📋 עריכת: ${label}`;
        badge.style.display = '';
    } else {
        nameEl.textContent = '📋 דוח חדש (לא נשמר)';
        badge.style.display = '';
    }
}

// ============================================================
// HISTORY
// ============================================================
async function renderHistory() {
    const container = document.getElementById('historyList');
    if (!container) return;

    const history = await getHistory();
    if (history.length === 0) {
        container.innerHTML = '<div style="text-align:center;color:var(--text2);padding:40px;">אין דוחות שמורים. לחץ "שמור דוח" כדי לשמור.</div>';
        return;
    }

    container.innerHTML = history.map((h, idx) => {
        const date = h._savedAt ? new Date(h._savedAt).toLocaleDateString('he-IL', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        }) : 'לא ידוע';
        const reportDate = h.reportDate || '';
        const label = h._label || 'דוח';
        const factory = h._factory || '';
        const isCurrent = currentReportId && h._id === currentReportId;

        return `
        <div class="admin-item${isCurrent ? ' current-report' : ''}" style="cursor:pointer;" onclick="loadFromHistory('${h._id}')">
            <div class="admin-item-info" style="flex:1;">
                <div class="admin-item-name">📄 ${label}${factory ? ' — ' + factory : ''}${isCurrent ? ' <span style="color:var(--gold);font-size:0.8em;">● פעיל</span>' : ''}</div>
                <div class="admin-item-details">
                    📅 תאריך דוח: ${reportDate || '—'} &nbsp;|&nbsp;
                    💾 נשמר: ${date}
                    ${h.rawMaterials ? ' &nbsp;|&nbsp; 🧪 ' + h.rawMaterials.substring(0, 40) + (h.rawMaterials.length > 40 ? '...' : '') : ''}
                </div>
            </div>
            <div class="admin-item-actions">
                <button class="btn-icon" onclick="event.stopPropagation();loadFromHistory('${h._id}')" title="טען דוח">📂</button>
                <button class="btn-icon delete" onclick="event.stopPropagation();deleteFromHistory('${h._id}')" title="מחק">🗑️</button>
            </div>
        </div>`;
    }).join('');
}

async function loadFromHistory(id) {
    const history = await getHistory();
    const report = history.find(h => h._id === id);
    if (!report) return;

    currentReportId = report._id;
    localStorage.setItem('ravino_last_report', JSON.stringify(report));
    loadSavedReport();
    updateReportBadge();
    showFormPanel();
    toast('הדוח נטען ✓');
}

async function deleteFromHistory(id) {
    if (!confirm('למחוק דוח זה מההיסטוריה?')) return;
    if (serverMode) {
        try { await fetch('/api/history/' + id, { method: 'DELETE' }); } catch (e) { }
    }
    let history = await getHistory();
    history = history.filter(h => h._id !== id);
    localStorage.setItem('ravino_history', JSON.stringify(history));
    if (currentReportId === id) {
        currentReportId = null;
        updateReportBadge();
    }
    renderHistory();
    toast('הדוח נמחק');
}

function gatherFormData() {
    return {
        reportDate: v('reportDate'),
        importerId: v('selImporter'),
        importerPhone: v('importerPhone'),
        importerFax: v('importerFax'),
        importerEmail: v('importerEmail'),
        certifierId: v('selCertifier'),
        certifierPhone: v('certifierPhone'),
        certifierFax: v('certifierFax'),
        certifierEmail: v('certifierEmail'),
        factoryId: v('selFactory'),
        factoryContact: v('factoryContact'),
        factoryPhone: v('factoryPhone'),
        factoryWebsite: v('factoryWebsite'),
        factoryCountry: v('factoryCountry'),
        factoryCity: v('factoryCity'),
        products: v('products'),
        nonKosher: radioVal('nonKosher'),
        cleaningDone: v('cleaningDone'),
        pesachStatus: v('pesachStatus'),
        supervisedProducts: v('supervisedProducts'),
        bishulIsrael: radioVal('bishulIsrael'),
        bishulBy: v('bishulBy'),
        bishulWhy: v('bishulWhy'),
        afiyatIsrael: radioVal('afiyatIsrael'),
        productionDays: v('productionDays'),
        supervisorPresence: v('supervisorPresence'),
        supervisorName: v('supervisorName'),
        additionalSupervisors: v('additionalSupervisors'),
        supervisorPhone: v('supervisorPhone'),
        supervisorEmail: v('supervisorEmail'),
        supervisionDateFrom: v('supervisionDateFrom'),
        supervisionDateTo: v('supervisionDateTo'),
        productionStart: v('productionStart'),
        productionEnd: v('productionEnd'),
        kosherText: v('kosherText'),
        productionCode: v('productionCode'),
        expiryDate: v('expiryDate'),
        holograms: radioVal('holograms'),
        stamps: radioVal('stamps'),
        regularSupervisorName: v('regularSupervisorName'),
        visitDate: v('visitDate'),
        visitFrequency: v('visitFrequency'),
        regularSupervisorPhone: v('regularSupervisorPhone'),
        regularSupervisorEmail: v('regularSupervisorEmail'),
        rawMaterials: v('rawMaterials'),
        productionProcess: v('productionProcess'),
        finalDate: v('finalDate'),
        sigSupervisorId: v('selSigSupervisor')
    };
}

function v(id) { return document.getElementById(id)?.value || ''; }
function radioVal(name) {
    const checked = document.querySelector(`input[name="${name}"]:checked`);
    return checked ? checked.value : '';
}

function clearForm() {
    if (!confirm('האם אתה בטוח שברצונך לנקות את הטופס?')) return;
    document.querySelectorAll('#view-report input, #view-report textarea, #view-report select').forEach(el => {
        if (el.type === 'radio' || el.type === 'checkbox') el.checked = false;
        else if (el.type !== 'hidden') el.value = '';
    });
    ['sigSupervisor', 'sigFinal'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '<span class="sig-placeholder">לחץ לבחור חתימה</span>';
    });
    // Remove custom raw material items
    document.querySelectorAll('.raw-mat-item.custom').forEach(el => el.remove());
    // Clear saved report from localStorage
    localStorage.removeItem('ravino_last_report');
    toast('הטופס נוקה');
}

// ============================================================
// EXPORT TO WORD (.docx via server API)
// ============================================================
async function exportToWord() {
    const d = gatherFormData();

    // Auto-save before export
    localStorage.setItem('ravino_last_report', JSON.stringify(d));

    if (serverMode) {
        // ── Server mode: generate real .docx from template ──
        toast('מייצר דוח Word... נא להמתין');

        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(d)
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Server error');
            }

            // Download the file
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;

            // Extract filename from Content-Disposition header
            const disposition = response.headers.get('Content-Disposition');
            let filename = 'report.docx';
            if (disposition) {
                const match = disposition.match(/filename\*=UTF-8''(.+)/);
                if (match) filename = decodeURIComponent(match[1]);
            }
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast('הדוח יוצא בהצלחה ✓');

        } catch (err) {
            console.error('Export error:', err);
            toast('שגיאה ביצירת הדוח: ' + err.message);
        }

    } else {
        // ── Fallback: generate .doc from HTML (old method) ──
        exportToWordFallback(d);
    }
}

function exportToWordFallback(d) {
    const imp = store.importers.find(i => i.id == d.importerId);
    const cert = store.certifiers.find(i => i.id == d.certifierId);
    const fact = store.factories.find(i => i.id == d.factoryId);
    const sigSup = store.signatures.find(s => s.id == d.sigSupervisorId);

    const formatDate = (ds) => {
        if (!ds) return '___________';
        const parts = ds.split('-');
        return `${parts[2]}.${parts[1]}.${parts[0]}`;
    };

    const sigImg = (sig) => sig && sig.imageData
        ? `<img src="${sig.imageData}" style="max-width:200px;max-height:100px;" />`
        : '____________________';

    const html = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset="utf-8">
<style>
    body { font-family: 'David', 'Arial', sans-serif; font-size: 12pt; direction: rtl; line-height: 1.8; }
    h1 { text-align: center; font-size: 14pt; }
    h2 { text-align: center; font-size: 16pt; margin-bottom: 4pt; }
    .subtitle { text-align: center; font-size: 11pt; color: #555; }
    .section { margin-top: 14pt; font-weight: bold; font-size: 13pt; text-decoration: underline; }
    .field { margin: 4pt 0; }
    .field-label { font-weight: bold; }
    table.sigs { width: 100%; margin-top: 10pt; }
    table.sigs td { width: 50%; vertical-align: top; text-align: center; padding: 10px; }
    @page { size: A4; margin: 2cm; }
</style></head>
<body>
<h1>בס"ד</h1>
<h2>טופס שאלון דוח ייצור</h2>
<p class="subtitle">(ימולא ע"י גוף הכשרות/ המשגיח ובחתימתו)</p>
<p class="field"><span class="field-label">תאריך:</span> ${formatDate(d.reportDate)}</p>
<p class="section">מגיש הבקשה: היבואן / גוף הכשרות</p>
<p class="field"><span class="field-label">שם היבואן:</span> ${imp ? (imp.nameHeb || imp.name) : '___________'}</p>
<p class="field"><span class="field-label">טלפון/נייד:</span> ${d.importerPhone || '___________'}</p>
<p class="field"><span class="field-label">דוא"ל:</span> ${d.importerEmail || '___________'}</p>
<p class="field"><span class="field-label">שם גוף הכשרות:</span> ${cert ? cert.name : '___________'}</p>
<p class="field"><span class="field-label">שם המפעל:</span> ${fact ? fact.name : '___________'}</p>
</body></html>`;

    const blob = new Blob(['\ufeff' + html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = d.reportDate || new Date().toISOString().split('T')[0];
    const impName = imp ? (imp.nameHeb || imp.name).replace(/[^\w\u0590-\u05FF ]/g, '') : 'report';
    a.download = `דוח_ייצור_${impName}_${dateStr}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast('הדוח יוצא בהצלחה ✓');
}

// ============================================================
// TOAST
// ============================================================
function toast(msg) {
    let t = document.querySelector('.toast');
    if (!t) {
        t = document.createElement('div');
        t.className = 'toast';
        document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2500);
}

// ============================================================
// INIT
// ============================================================
window.addEventListener('DOMContentLoaded', async () => {
    // Try to load data from server (if running via node server.js)
    try {
        const resp = await fetch('/api/data');
        if (resp.ok) {
            const serverData = await resp.json();
            // Load ALL data from server
            store.importers = serverData.importers || [];
            store.certifiers = serverData.certifiers || [];
            store.factories = serverData.factories || [];
            store.rawMaterials = serverData.rawMaterials || [];
            store.products = serverData.products || [];
            store.signatures = serverData.signatures || [];
            serverMode = true;
            console.log('✅ Connected to server - using server data + real .docx generation');
        }
    } catch (e) {
        console.log('ℹ️ Server not available - using local data + HTML .doc fallback');
    }

    populateSelects();
    renderRawMaterialsChecklist();
    renderProductsChecklist();
    renderSupervisorsChecklist();
    showTab('report');

    // Update theme icon
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon && document.documentElement.classList.contains('light')) {
        themeIcon.textContent = '☀️';
    }

    // Render history on startup (list is default view)
    renderHistory();

    // Mark fields as manually edited if user types in them
    ['bishulBy', 'regularSupervisorName'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', () => { el.dataset.autoFilled = 'false'; });
    });

    // Show mode indicator
    if (serverMode) {
        const badge = document.createElement('div');
        badge.style.cssText = 'position:fixed;bottom:10px;left:10px;background:#22c55e;color:#fff;padding:4px 12px;border-radius:20px;font-size:12px;z-index:9999;opacity:0.8;';
        badge.textContent = '🟢 Modo servidor (.docx real)';
        document.body.appendChild(badge);
        setTimeout(() => badge.style.opacity = '0.3', 3000);
    }
});

// ============================================================
// LOAD SAVED REPORT
// ============================================================
function loadSavedReport() {
    const saved = localStorage.getItem('ravino_last_report');
    if (!saved) return;

    try {
        const report = JSON.parse(saved);

        // Helper: set value of an element by id
        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el && val !== undefined && val !== null) el.value = val;
        };

        // Helper: set radio by name
        const setRadio = (name, val) => {
            if (!val) return;
            const radio = document.querySelector(`input[name="${name}"][value="${val}"]`);
            if (radio) radio.checked = true;
        };

        // Restore text/date/select fields
        setVal('reportDate', report.reportDate);
        setVal('selImporter', report.importerId);
        setVal('importerPhone', report.importerPhone);
        setVal('importerFax', report.importerFax);
        setVal('importerEmail', report.importerEmail);
        setVal('selCertifier', report.certifierId);
        setVal('certifierPhone', report.certifierPhone);
        setVal('certifierFax', report.certifierFax);
        setVal('certifierEmail', report.certifierEmail);
        setVal('selFactory', report.factoryId);
        setVal('factoryContact', report.factoryContact);
        setVal('factoryPhone', report.factoryPhone);
        setVal('factoryWebsite', report.factoryWebsite);
        setVal('factoryCountry', report.factoryCountry);
        setVal('factoryCity', report.factoryCity);
        setVal('products', report.products);
        setVal('cleaningDone', report.cleaningDone);
        setVal('pesachStatus', report.pesachStatus);
        setVal('supervisedProducts', report.supervisedProducts);
        setVal('bishulBy', report.bishulBy);
        setVal('bishulWhy', report.bishulWhy);
        setVal('productionDays', report.productionDays);
        setVal('supervisorPresence', report.supervisorPresence);
        setVal('supervisorName', report.supervisorName);
        setVal('additionalSupervisors', report.additionalSupervisors);
        setVal('supervisorPhone', report.supervisorPhone);
        setVal('supervisorEmail', report.supervisorEmail);
        setVal('supervisionDateFrom', report.supervisionDateFrom);
        setVal('supervisionDateTo', report.supervisionDateTo);
        setVal('productionStart', report.productionStart);
        setVal('productionEnd', report.productionEnd);
        setVal('kosherText', report.kosherText);
        setVal('productionCode', report.productionCode);
        setVal('expiryDate', report.expiryDate);
        setVal('regularSupervisorName', report.regularSupervisorName);
        setVal('visitDate', report.visitDate);
        setVal('visitFrequency', report.visitFrequency);
        setVal('regularSupervisorPhone', report.regularSupervisorPhone);
        setVal('regularSupervisorEmail', report.regularSupervisorEmail);
        setVal('productionProcess', report.productionProcess);
        setVal('finalDate', report.finalDate);
        setVal('selSigSupervisor', report.sigSupervisorId);


        // Restore radio buttons
        setRadio('nonKosher', report.nonKosher);
        setRadio('bishulIsrael', report.bishulIsrael);
        setRadio('afiyatIsrael', report.afiyatIsrael);
        setRadio('holograms', report.holograms);
        setRadio('stamps', report.stamps);

        // Restore raw materials checkboxes
        if (report.rawMaterials) {
            // rawMaterials is saved as "name - manufacturer - cert\nname2 - mfr2 - cert2"
            // Checkbox values are just the name, so extract name from each line
            const lines = report.rawMaterials.split('\n').filter(Boolean);
            const selectedNames = lines.map(line => line.split(' - ')[0].trim());
            document.querySelectorAll('#rawMaterialsChecklist input[type="checkbox"]').forEach(cb => {
                if (selectedNames.includes(cb.value)) cb.checked = true;
            });
            // Set the hidden field directly with the full text (preserves manufacturer/cert info)
            document.getElementById('rawMaterials').value = report.rawMaterials;
        }

        // Restore products checkboxes
        if (report.products) {
            const selectedProducts = report.products.split(',').map(s => s.trim()).filter(Boolean);
            document.querySelectorAll('input[name="productItem"]').forEach(cb => {
                if (selectedProducts.includes(cb.value)) cb.checked = true;
            });
        }

        // Restore supervisor checkboxes
        if (report.supervisorName) {
            const selectedSupervisors = report.supervisorName.split(',').map(s => s.trim()).filter(Boolean);
            document.querySelectorAll('input[name="supervisorItem"]').forEach(cb => {
                if (selectedSupervisors.includes(cb.value)) cb.checked = true;
            });
        }

        // Trigger auto-fill for importer/certifier/factory selects
        const impSel = document.getElementById('selImporter');
        if (impSel && impSel.value) impSel.dispatchEvent(new Event('change'));
        const certSel = document.getElementById('selCertifier');
        if (certSel && certSel.value) certSel.dispatchEvent(new Event('change'));
        const factSel = document.getElementById('selFactory');
        if (factSel && factSel.value) factSel.dispatchEvent(new Event('change'));

        // Re-apply per-document overrides AFTER change handlers filled from master data
        setTimeout(() => {
            setVal('importerPhone', report.importerPhone);
            setVal('importerFax', report.importerFax);
            setVal('importerEmail', report.importerEmail);
            setVal('certifierPhone', report.certifierPhone);
            setVal('certifierFax', report.certifierFax);
            setVal('certifierEmail', report.certifierEmail);
            setVal('factoryContact', report.factoryContact);
            setVal('factoryPhone', report.factoryPhone);
            setVal('factoryWebsite', report.factoryWebsite);
            setVal('factoryCountry', report.factoryCountry);
            setVal('factoryCity', report.factoryCity);
        }, 50);

        // Restore signature previews
        if (report.sigSupervisorId) {
            const sig = store.signatures.find(s => s.id == report.sigSupervisorId);
            if (sig && sig.imageData) {
                ['sigSupervisor', 'sigFinal'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.innerHTML = `<img src="${sig.imageData}" alt="חתימה">`;
                });
            }
        }

        // Restore currentReportId so further saves update this report
        if (report._id) {
            currentReportId = report._id;
        }
        updateReportBadge();

        console.log('📋 Report loaded: ' + (report._label || 'unknown'));

    } catch (e) {
        console.warn('Could not load saved report:', e);
    }
}
