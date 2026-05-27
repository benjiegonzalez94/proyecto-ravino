/**
 * generate_report.js
 * 
 * Generates a filled .docx report using the template and data from the Excel file.
 * 
 * Usage:
 *   node generate_report.js                  → Interactive mode (lists importers to choose)
 *   node generate_report.js --importer 1     → Generate for importer at index 1
 *   node generate_report.js --all            → Generate for all importers
 *   node generate_report.js --data data.json → Generate from JSON data file
 */

const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const XLSX = require('xlsx');

const TEMPLATE_FILE = 'template.docx';
const EXCEL_FILE = 'Lista de Rabanut2.xlsx';
const OUTPUT_DIR = 'output';

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// ============================================================
// Load data from Excel
// ============================================================
function loadExcelData() {
    const wb = XLSX.readFile(EXCEL_FILE);

    // Parse Clientes (Importers)
    const clientesSheet = XLSX.utils.sheet_to_json(wb.Sheets['Clientes'], { header: 1 });
    const importers = clientesSheet.slice(1).filter(r => r[0]).map((row, i) => ({
        index: i,
        name: row[0] || '',
        phone: String(row[1] || ''),
        email: row[2] || ''
    }));

    // Parse from Sheet1 for Hebrew names
    const sheet1 = XLSX.utils.sheet_to_json(wb.Sheets['Sheet1'], { header: 1 });
    const importersHebrew = sheet1.slice(1).filter(r => r[6]).map((row, i) => ({
        index: i,
        nameHeb: row[6] || '',
        phone: String(row[4] || ''),
        email: row[3] || ''
    }));

    // Merge Hebrew names into importers
    importers.forEach((imp, i) => {
        if (importersHebrew[i]) {
            imp.nameHeb = importersHebrew[i].nameHeb;
        }
    });

    // Parse Certificadores
    const certSheet = XLSX.utils.sheet_to_json(wb.Sheets['Certificadores'], { header: 1 });
    const certifiers = certSheet.slice(1).filter(r => r[0]).map(row => ({
        name: row[0] || '',
        email: row[1] || '',
        fax: row[2] || '',
        phone: String(row[3] || '')
    }));

    // Parse Fabricantes (Factories)
    const fabSheet = XLSX.utils.sheet_to_json(wb.Sheets['Fabricantes'], { header: 1 });
    const factories = fabSheet.slice(1).filter(r => r[0]).map(row => ({
        name: row[0] || '',
        city: row[1] || '',
        country: row[2] || '',
        email: row[3] || '',
        phone: String(row[4] || ''),
        contact: row[5] || ''
    }));

    return { importers, certifiers, factories };
}

// ============================================================
// Format date
// ============================================================
function formatDate(date) {
    if (!date) return '';
    if (date instanceof Date) {
        const d = date.getDate().toString().padStart(2, '0');
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const y = date.getFullYear();
        return `${d}.${m}.${y}`;
    }
    // If string, try to parse
    if (typeof date === 'string') {
        const parts = date.split('-');
        if (parts.length === 3) {
            return `${parts[2]}.${parts[1]}.${parts[0]}`;
        }
    }
    return String(date);
}

// ============================================================
// Generate report
// ============================================================
function generateReport(data, outputFilename) {
    // Load the template
    const templateContent = fs.readFileSync(TEMPLATE_FILE, 'binary');
    const zip = new PizZip(templateContent);

    const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: { start: '{', end: '}' }
    });

    doc.setData(data);

    try {
        doc.render();
    } catch (error) {
        console.error('Error rendering template:', error);
        if (error.properties && error.properties.errors) {
            error.properties.errors.forEach(e => {
                console.error('  -', e.message, e.properties);
            });
        }
        return false;
    }

    // Generate output
    const buf = doc.getZip().generate({
        type: 'nodebuffer',
        compression: 'DEFLATE'
    });

    const outputPath = path.join(OUTPUT_DIR, outputFilename);
    fs.writeFileSync(outputPath, buf);
    console.log(`✅ Report generated: ${outputPath}`);
    return true;
}

// ============================================================
// Build data object for template
// ============================================================
function buildReportData(options = {}) {
    const {
        importer = {},
        certifier = {},
        factory = {},
        reportDate = new Date(),
        // Additional data can be passed
        ...extra
    } = options;

    const today = formatDate(reportDate);

    return {
        // Date
        fecha: today,

        // Importer
        importador: importer.nameHeb || importer.name || '',
        imp_telefono: importer.phone || '',
        imp_fax: importer.fax || '',
        imp_email: importer.email || '',

        // Certifier
        certificador: certifier.name || '',
        cert_telefono: certifier.phone || '',
        cert_fax: certifier.fax || '',
        cert_email: certifier.email || '',

        // Factory
        fabrica: factory.name || '',
        fab_contacto: factory.contact || '',
        fab_telefono: factory.phone || '',
        fab_web: factory.website || '',
        fab_pais: factory.country || '',
        fab_ciudad: factory.city || '',

        // Products
        productos: extra.productos || '',

        // Production method
        limpieza: extra.limpieza || '',
        pesaj: extra.pesaj || '',
        productos_supervisados: extra.productos_supervisados || '',
        bishul_por: extra.bishul_por || '',
        bishul_porque: extra.bishul_porque || '',

        // Baking
        dias_produccion: extra.dias_produccion || '',
        mashgiaj_presencia: extra.mashgiaj_presencia || '',

        // Close supervision
        mashgiaj_nombre: extra.mashgiaj_nombre || '',
        mashgiajim_adicionales: extra.mashgiajim_adicionales || '',
        mashgiaj_tel: extra.mashgiaj_tel || '',
        mashgiaj_email: extra.mashgiaj_email || '',
        fechas_supervision: extra.fechas_supervision || '',
        hora_inicio: extra.hora_inicio || '',
        hora_fin: extra.hora_fin || '',

        // Packaging
        texto_kashrut: extra.texto_kashrut || '',
        codigo_produccion: extra.codigo_produccion || '',
        fecha_vencimiento: extra.fecha_vencimiento || '',
        hologramas: extra.hologramas || '',
        sellos: extra.sellos || '',

        // Regular supervision
        mashgiaj_regular: extra.mashgiaj_regular || '',
        fecha_visita: extra.fecha_visita || today,
        frecuencia_visitas: extra.frecuencia_visitas || '',
        mashgiaj_reg_tel: extra.mashgiaj_reg_tel || '',
        mashgiaj_reg_email: extra.mashgiaj_reg_email || '',

        // Raw materials
        materias_primas: extra.materias_primas || '',

        // Signatures 
        firma_mashgiaj: '',
        firma_mashgiaj_2: '',
        firma_certificador: '',
        firma_certificador_2: '',
        firma_certificador_3: '',

        // Production process
        proceso_produccion: extra.proceso_produccion || '',
        proceso_produccion_2: '',

        // Final
        firma_final: '',
        fecha_final: today,
    };
}

// ============================================================
// Main
// ============================================================
async function main() {
    const args = process.argv.slice(2);
    const data = loadExcelData();

    console.log('📋 Data loaded from Excel:');
    console.log(`   ${data.importers.length} importers`);
    console.log(`   ${data.certifiers.length} certifiers`);
    console.log(`   ${data.factories.length} factories`);
    console.log('');

    // Check for --data flag (JSON data file)
    const dataFlagIdx = args.indexOf('--data');
    if (dataFlagIdx !== -1 && args[dataFlagIdx + 1]) {
        const jsonFile = args[dataFlagIdx + 1];
        console.log(`📄 Loading data from ${jsonFile}...`);
        const jsonData = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));

        // Look up references
        const importer = jsonData.importerIndex !== undefined
            ? data.importers[jsonData.importerIndex] || {}
            : {};
        const certifier = jsonData.certifierIndex !== undefined
            ? data.certifiers[jsonData.certifierIndex] || {}
            : {};
        const factory = jsonData.factoryIndex !== undefined
            ? data.factories[jsonData.factoryIndex] || {}
            : {};

        const reportData = buildReportData({
            importer,
            certifier,
            factory,
            ...jsonData
        });

        const filename = `reporte_${(importer.name || 'custom').replace(/[^\w]/g, '_')}_${formatDate(new Date()).replace(/\./g, '-')}.docx`;
        generateReport(reportData, filename);
        return;
    }

    // Check for --importer flag
    const impFlagIdx = args.indexOf('--importer');
    if (impFlagIdx !== -1 && args[impFlagIdx + 1]) {
        const impIdx = parseInt(args[impFlagIdx + 1]);
        const certIdx = parseInt(args[args.indexOf('--certifier') + 1]) || 0;
        const factIdx = parseInt(args[args.indexOf('--factory') + 1]) || 0;

        const importer = data.importers[impIdx];
        const certifier = data.certifiers[certIdx];
        const factory = data.factories[factIdx];

        if (!importer) {
            console.error(`❌ Importer index ${impIdx} not found`);
            return;
        }

        const reportData = buildReportData({ importer, certifier, factory });
        const filename = `reporte_${importer.name.replace(/[^\w]/g, '_')}_${formatDate(new Date()).replace(/\./g, '-')}.docx`;
        generateReport(reportData, filename);
        return;
    }

    // Check for --all flag
    if (args.includes('--all')) {
        console.log('📦 Generating reports for all importers...\n');
        data.importers.forEach((imp, i) => {
            const reportData = buildReportData({
                importer: imp,
                certifier: data.certifiers[0] || {},
                factory: data.factories[0] || {}
            });
            const filename = `reporte_${imp.name.replace(/[^\w]/g, '_')}.docx`;
            generateReport(reportData, filename);
        });
        return;
    }

    // Interactive mode - list importers
    console.log('📋 Available importers:');
    data.importers.forEach((imp, i) => {
        console.log(`  ${i}: ${imp.name} ${imp.nameHeb ? '(' + imp.nameHeb + ')' : ''} - ${imp.phone}`);
    });
    console.log('\n📋 Available certifiers:');
    data.certifiers.forEach((cert, i) => {
        console.log(`  ${i}: ${cert.name} - ${cert.phone}`);
    });
    console.log('\n📋 Available factories:');
    data.factories.forEach((fact, i) => {
        console.log(`  ${i}: ${fact.name} (${fact.city}, ${fact.country}) - ${fact.contact}`);
    });

    console.log('\n💡 Usage examples:');
    console.log('  node generate_report.js --importer 0 --certifier 0 --factory 0');
    console.log('  node generate_report.js --all');
    console.log('  node generate_report.js --data report_data.json');
    console.log('\n💡 You can also create a JSON file with all report data.');
    console.log('   See report_data_example.json for the format.');

    // Generate example JSON
    const example = {
        importerIndex: 0,
        certifierIndex: 0,
        factoryIndex: 0,
        productos: 'שם המוצר כאן',
        limpieza: 'כן',
        pesaj: 'כשר לכל ימות השנה',
        productos_supervisados: 'רשימת מוצרים',
        bishul_por: 'המשגיח',
        bishul_porque: '',
        dias_produccion: '3',
        mashgiaj_presencia: 'בכל ימי הייצור',
        mashgiaj_nombre: 'שם המשגיח',
        mashgiaj_tel: '050-1234567',
        mashgiaj_email: 'mashgiach@email.com',
        fechas_supervision: '01.01.2025 - 03.01.2025',
        hora_inicio: '08:00',
        hora_fin: '18:00',
        texto_kashrut: 'כשר בהשגחת...',
        codigo_produccion: 'ABC123',
        fecha_vencimiento: '01.01.2026',
        hologramas: 'כן',
        sellos: 'כן',
        mashgiaj_regular: 'שם הרב',
        frecuencia_visitas: '4 פעמים בשנה',
        mashgiaj_reg_tel: '050-7654321',
        mashgiaj_reg_email: 'rav@email.com',
        materias_primas: 'רשימת חומרי גלם...',
        proceso_produccion: 'תיאור תהליך הייצור בפירוט...'
    };

    if (!fs.existsSync('report_data_example.json')) {
        fs.writeFileSync('report_data_example.json', JSON.stringify(example, null, 2), 'utf8');
        console.log('\n📝 Created report_data_example.json with example data.');
    }
}

main().catch(console.error);
