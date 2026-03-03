/**
 * server.js
 * 
 * Express server that:
 * 1. Serves the web app (HTML/CSS/JS) from /app
 * 2. Provides CRUD API for importers, certifiers, factories, signatures
 * 3. Persists all data to data.json (seeded from Excel on first run)
 * 4. Generates .docx reports from the original Word template
 * 
 * Usage:  node server.js   (or: npm start)
 * Then open http://localhost:3000
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const ImageModule = require('docxtemplater-image-module-free');
const XLSX = require('xlsx');

const app = express();
const PORT = 3000;

const TEMPLATE_FILE = path.join(__dirname, 'template.docx');
const EXCEL_FILE = path.join(__dirname, 'Lista de Rabanut2.xlsx');
const DATA_FILE = path.join(__dirname, 'data.json');

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'app')));

// ============================================================
// DATA PERSISTENCE
// ============================================================
let masterData = { importers: [], certifiers: [], factories: [], rawMaterials: [], signatures: [], nextId: 100 };

function saveData() {
    fs.writeFileSync(DATA_FILE, JSON.stringify(masterData, null, 2), 'utf8');
}

function loadData() {
    if (fs.existsSync(DATA_FILE)) {
        // Load from persisted JSON
        const raw = fs.readFileSync(DATA_FILE, 'utf8');
        masterData = JSON.parse(raw);
        if (!masterData.signatures) masterData.signatures = [];
        if (!masterData.rawMaterials) masterData.rawMaterials = [];
        if (!masterData.nextId) masterData.nextId = 100;
        console.log('📂 Data loaded from data.json');
    } else {
        // Seed from Excel on first run
        seedFromExcel();
        saveData();
        console.log('📂 Data seeded from Excel → saved to data.json');
    }
}

function seedFromExcel() {
    const wb = XLSX.readFile(EXCEL_FILE);

    // Clientes + Hebrew names from Sheet1
    const clientesRows = XLSX.utils.sheet_to_json(wb.Sheets['Clientes'], { header: 1 }).slice(1).filter(r => r[0]);
    const sheet1Rows = XLSX.utils.sheet_to_json(wb.Sheets['Sheet1'], { header: 1 }).slice(1).filter(r => r[6]);

    masterData.importers = clientesRows.map((row, i) => ({
        id: i + 1,
        name: row[0] || '',
        nameHeb: sheet1Rows[i] ? String(sheet1Rows[i][6]) : '',
        phone: String(row[1] || ''),
        email: row[2] || ''
    }));

    // Certificadores
    const certRows = XLSX.utils.sheet_to_json(wb.Sheets['Certificadores'], { header: 1 }).slice(1).filter(r => r[0]);
    masterData.certifiers = certRows.map((row, i) => ({
        id: i + 1,
        name: row[0] || '',
        email: row[1] || '',
        fax: row[2] || '',
        phone: String(row[3] || '')
    }));

    // Fabricantes
    const fabRows = XLSX.utils.sheet_to_json(wb.Sheets['Fabricantes'], { header: 1 }).slice(1).filter(r => r[0]);
    masterData.factories = fabRows.map((row, i) => ({
        id: i + 1,
        name: row[0] || '',
        city: row[1] || '',
        country: row[2] || '',
        email: row[3] || '',
        phone: String(row[4] || ''),
        contact: row[5] || ''
    }));

    // Default raw materials (kosher-appropriate)
    masterData.rawMaterials = [
        // ממתיקים - Sweeteners
        { id: 50, name: 'סוכר', category: 'ממתיקים' },
        { id: 51, name: 'גלוקוז', category: 'ממתיקים' },
        { id: 52, name: 'פרוקטוז', category: 'ממתיקים' },
        { id: 53, name: 'דבש', category: 'ממתיקים' },
        { id: 54, name: 'סילאן', category: 'ממתיקים' },
        // תבלינים ותוספי טעם - Spices & Flavorings
        { id: 55, name: 'מלח', category: 'תבלינים ותוספי טעם' },
        { id: 56, name: 'טעם וריח טבעי', category: 'תבלינים ותוספי טעם' },
        { id: 57, name: 'וניל', category: 'תבלינים ותוספי טעם' },
        // קמחים ודגנים - Flours & Grains
        { id: 58, name: 'קמח חיטה', category: 'קמחים ודגנים' },
        { id: 59, name: 'קמח תירס', category: 'קמחים ודגנים' },
        { id: 60, name: 'עמילן', category: 'קמחים ודגנים' },
        { id: 61, name: 'עמילן תירס', category: 'קמחים ודגנים' },
        // שמנים צמחיים - Vegetable Oils
        { id: 62, name: 'שמן סויה', category: 'שמנים צמחיים' },
        { id: 63, name: 'שמן דקלים', category: 'שמנים צמחיים' },
        { id: 64, name: 'שמן חמניות', category: 'שמנים צמחיים' },
        { id: 65, name: 'שמן קנולה', category: 'שמנים צמחיים' },
        { id: 66, name: 'שמן זית', category: 'שמנים צמחיים' },
        // חומצות - Acids
        { id: 67, name: 'חומץ', category: 'חומצות' },
        { id: 68, name: 'חומצת לימון', category: 'חומצות' },
        // מייצבים ומקפיאים - Stabilizers & Emulsifiers
        { id: 69, name: 'פקטין', category: 'מייצבים' },
        { id: 70, name: 'גואר גאם', category: 'מייצבים' },
        { id: 71, name: 'לציטין סויה', category: 'מייצבים' },
        { id: 72, name: 'אגר אגר', category: 'מייצבים' },
        // תוספים - Additives
        { id: 73, name: 'צבעי מאכל', category: 'תוספים' },
        { id: 74, name: 'חומר משמר', category: 'תוספים' },
        // מוצרי חלב - Dairy
        { id: 75, name: 'חלב', category: 'מוצרי חלב' },
        { id: 76, name: 'אבקת חלב', category: 'מוצרי חלב' },
        { id: 77, name: 'חמאה', category: 'מוצרי חלב' },
        // אחר - Other
        { id: 78, name: 'ביצים', category: 'אחר' },
        { id: 79, name: 'מים', category: 'אחר' },
    ];

    masterData.signatures = [];
    masterData.nextId = 100;
}

function genId() {
    return masterData.nextId++;
}

// Initialize
loadData();
console.log(`📋 Data: ${masterData.importers.length} importers, ${masterData.certifiers.length} certifiers, ${masterData.factories.length} factories, ${masterData.signatures.length} signatures`);

// ============================================================
// API: CRUD Operations
// ============================================================

// ── GET all data ──
app.get('/api/data', (req, res) => {
    res.json(masterData);
});

// ── Re-seed from Excel (reset) ──
app.post('/api/reseed', (req, res) => {
    try {
        seedFromExcel();
        saveData();
        res.json({ success: true, message: 'Data re-seeded from Excel' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ── PUT all data (import) ──
app.put('/api/data', (req, res) => {
    try {
        const types = ['importers', 'certifiers', 'factories', 'rawMaterials', 'signatures'];
        for (const t of types) {
            if (Array.isArray(req.body[t])) {
                masterData[t] = req.body[t];
            }
        }
        saveData();
        console.log('📥 Master data imported via API');
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ============================================================
// API: Generate .docx report  (MUST be before /api/:type)
// ============================================================
app.post('/api/generate', (req, res) => {
    try {
        const formData = req.body;

        const importer = masterData.importers.find(i => i.id == formData.importerId) || {};
        const certifier = masterData.certifiers.find(c => c.id == formData.certifierId) || {};
        const factory = masterData.factories.find(f => f.id == formData.factoryId) || {};

        const fmtDate = (ds) => {
            if (!ds) return '';
            const parts = ds.split('-');
            if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;
            return ds;
        };

        // Format yes/no — show only the selected answer
        const fmtYesNo = (val) => {
            if (!val) return '';
            if (val === 'כן' || val === 'yes') return 'כן';
            if (val === 'לא' || val === 'no') return 'לא';
            return val;
        };

        const templateData = {
            fecha: fmtDate(formData.reportDate),
            importador: importer.nameHeb || importer.name || '',
            imp_telefono: formData.importerPhone || importer.phone || '',
            imp_fax: formData.importerFax || '',
            imp_email: formData.importerEmail || importer.email || '',
            certificador_nombre: certifier.name || '',
            certificador: certifier.name || '',
            cert_telefono: formData.certifierPhone || certifier.phone || '',
            cert_fax: formData.certifierFax || certifier.fax || '',
            cert_email: formData.certifierEmail || certifier.email || '',
            fabrica: factory.name || '',
            fab_contacto: formData.factoryContact || factory.contact || '',
            fab_telefono: formData.factoryPhone || factory.phone || '',
            fab_web: formData.factoryWebsite || '',
            fab_pais: formData.factoryCountry || factory.country || '',
            fab_ciudad: formData.factoryCity || factory.city || '',
            productos: formData.products || '',
            non_kosher_answer: fmtYesNo(formData.nonKosher),
            bishul_israel_answer: fmtYesNo(formData.bishulIsrael),
            afiyat_israel_answer: fmtYesNo(formData.afiyatIsrael),
            limpieza: formData.cleaningDone || '',
            pesaj: formData.pesachStatus || '',
            productos_supervisados: formData.supervisedProducts || '',
            bishul_por: formData.bishulBy || '',
            bishul_porque: formData.bishulWhy || '',
            dias_produccion: formData.productionDays || '',
            mashgiaj_presencia: formData.supervisorPresence || '',
            mashgiaj_nombre: formData.supervisorName || '',
            mashgiajim_adicionales: formData.additionalSupervisors || '',
            mashgiaj_tel: formData.supervisorPhone || '',
            mashgiaj_email: formData.supervisorEmail || '',
            fechas_supervision: (fmtDate(formData.supervisionDateFrom) && fmtDate(formData.supervisionDateTo))
                ? `${fmtDate(formData.supervisionDateFrom)} - ${fmtDate(formData.supervisionDateTo)}`
                : fmtDate(formData.supervisionDateFrom) || '',
            hora_inicio: formData.productionStart || '',
            hora_fin: formData.productionEnd || '',
            texto_kashrut: formData.kosherText || '',
            codigo_produccion: formData.productionCode || '',
            fecha_vencimiento: fmtDate(formData.expiryDate),
            hologramas: fmtYesNo(formData.holograms),
            sellos: fmtYesNo(formData.stamps),
            mashgiaj_regular: formData.regularSupervisorName || '',
            fecha_visita: fmtDate(formData.visitDate),
            frecuencia_visitas: formData.visitFrequency || '',
            mashgiaj_reg_tel: formData.regularSupervisorPhone || '',
            mashgiaj_reg_email: formData.regularSupervisorEmail || '',
            materias_primas: formData.rawMaterials || '',
            proceso_produccion: formData.productionProcess || '',
            fecha_final: fmtDate(formData.finalDate),
        };

        // ── Build signature image data ──
        // Signature tags in the template use {%tag} syntax for the image module
        // We look up signature IDs from formData and get their base64 imageData
        const sigSupervisor = formData.sigSupervisorId
            ? masterData.signatures.find(s => s.id == formData.sigSupervisorId)
            : null;

        // Convert base64 data URL to Buffer
        function base64ToBuffer(dataUrl) {
            if (!dataUrl) return null;
            const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
            return Buffer.from(base64, 'base64');
        }

        const supBuf = sigSupervisor ? base64ToBuffer(sigSupervisor.imageData) : null;

        // Create a 1x1 transparent PNG for empty signatures
        const emptyPng = Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQAB' +
            'Nl7BcQAAAABJRU5ErkJggg==', 'base64'
        );

        // Assign image buffers to template data
        templateData.firma_mashgiaj = supBuf ? 'sig_supervisor' : '';
        templateData.firma_certificador = ''; // Certifier handles their own signature
        templateData.firma_final = supBuf ? 'sig_final' : '';

        // Map of signature keys to actual image buffers
        const sigBuffers = {};
        if (supBuf) sigBuffers['sig_supervisor'] = supBuf;
        if (supBuf) sigBuffers['sig_final'] = supBuf; // Same signature for final

        // ── Image module configuration ──
        const imageOpts = {
            centered: false,
            getImage: function (tagValue) {
                // tagValue is a string key like 'sig_supervisor'
                return sigBuffers[tagValue] || tagValue;
            },
            getSize: function (img, tagValue, tagName) {
                // Signature size: 150x75 pixels (approx 4cm x 2cm)
                return [150, 75];
            }
        };

        const templateContent = fs.readFileSync(TEMPLATE_FILE, 'binary');
        const zip = new PizZip(templateContent);
        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
            delimiters: { start: '{', end: '}' },
            modules: [new ImageModule(imageOpts)]
        });
        doc.setData(templateData);
        doc.render();

        const buf = doc.getZip().generate({
            type: 'nodebuffer',
            compression: 'DEFLATE'
        });

        const dateStr = formData.reportDate || new Date().toISOString().split('T')[0];
        const impName = (importer.nameHeb || importer.name || 'report').replace(/[^\w\u0590-\u05FF ]/g, '');
        const filename = `דוח_ייצור_${impName}_${dateStr}.docx`;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
        res.send(buf);

    } catch (err) {
        console.error('Error generating report:', err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
// API: CRUD Operations (AFTER /api/generate to avoid conflicts)
// ============================================================

// ── ADD item ──
app.post('/api/:type', (req, res) => {
    const { type } = req.params;
    const validTypes = ['importers', 'certifiers', 'factories', 'rawMaterials', 'signatures'];
    if (!validTypes.includes(type)) {
        return res.status(400).json({ error: 'Invalid type: ' + type });
    }

    const item = { ...req.body, id: genId() };
    masterData[type].push(item);
    saveData();
    console.log(`➕ Added ${type}: ${item.name || item.nameHeb || item.id}`);
    res.json({ success: true, item });
});

// ── DELETE item ──
app.delete('/api/:type/:id', (req, res) => {
    const { type, id } = req.params;
    const validTypes = ['importers', 'certifiers', 'factories', 'rawMaterials', 'signatures'];
    if (!validTypes.includes(type)) {
        return res.status(400).json({ error: 'Invalid type: ' + type });
    }

    const numId = parseInt(id);
    const before = masterData[type].length;
    masterData[type] = masterData[type].filter(i => i.id !== numId);

    if (masterData[type].length === before) {
        return res.status(404).json({ error: 'Item not found' });
    }

    saveData();
    console.log(`🗑️  Deleted ${type} id=${id}`);
    res.json({ success: true });
});

// ── UPDATE item ──
app.put('/api/:type/:id', (req, res) => {
    const { type, id } = req.params;
    const validTypes = ['importers', 'certifiers', 'factories', 'rawMaterials', 'signatures'];
    if (!validTypes.includes(type)) {
        return res.status(400).json({ error: 'Invalid type: ' + type });
    }

    const numId = parseInt(id);
    const idx = masterData[type].findIndex(i => i.id === numId);
    if (idx === -1) {
        return res.status(404).json({ error: 'Item not found' });
    }

    masterData[type][idx] = { ...masterData[type][idx], ...req.body, id: numId };
    saveData();
    console.log(`✏️  Updated ${type} id=${id}`);
    res.json({ success: true, item: masterData[type][idx] });
});

// ============================================================
// Start server
// ============================================================
app.listen(PORT, () => {
    console.log(`\n🚀 Server running at http://localhost:${PORT}`);
    console.log(`   Open this URL in your browser to use the app.\n`);
});
