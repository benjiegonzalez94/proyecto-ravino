/**
 * create_template.js
 * 
 * Takes the original docx and replaces the underline placeholders (_____)
 * with {tag} markers that docxtemplater can process.
 * 
 * The original document formatting, headers, footers, and images are preserved.
 */

const fs = require('fs');
const AdmZip = require('adm-zip');

const SOURCE = 'Archivos Para Prompt/טופס דוח רבנות מעודכן 2025 תשפו-1.docx';
const OUTPUT = 'template.docx';

// Read the original docx
const zip = new AdmZip(SOURCE);
let docXml = zip.readAsText('word/document.xml');

// Define replacement mappings: each entry maps a Hebrew label (or context) to a tag name
// The approach: find the underlines that follow specific Hebrew text and replace them
// We need to be careful because the underlines are in separate <w:r> elements

// Strategy: Replace underline runs (____+) that appear after specific labels
// The XML pattern is: <w:t>label text</w:t>...</w:r><w:r ...><w:rPr>...<w:u .../>...</w:rPr><w:t>_____</w:t></w:r>

// Let's define all the replacements in order of appearance
const replacements = [
    // Section: Date  
    { label: 'תאריך:', tag: '{fecha}' },

    // Section: Importer
    { label: 'שם היבואן שעבורו נעשה הייצור והובא למטרת שיווקו בארץ:', tag: '{importador}' },
    { label: 'טלפון/נייד:', tag: '{imp_telefono}', occurrence: 1 },
    { label: 'פקס:', tag: '{imp_fax}', occurrence: 1 },
    { label: 'דוא"ל:', tag: '{imp_email}', occurrence: 1 },

    // Section: Certifier
    { label: 'שם גוף הכשרות/ רב נותן הכשרות בחו"ל', tag: '{certificador}' },
    { label: 'טלפון/נייד:', tag: '{cert_telefono}', occurrence: 2 },
    { label: 'פקס:', tag: '{cert_fax}', occurrence: 2 },
    { label: 'דוא"ל:', tag: '{cert_email}', occurrence: 2 },

    // Section: Factory
    { label: 'שם המפעל', tag: '{fabrica}' },
    { label: 'איש קשר במפעל:', tag: '{fab_contacto}' },
    { label: 'טלפון/נייד של איש הקשר:', tag: '{fab_telefono}' },
    { label: 'אתר הבית באינטרנט:', tag: '{fab_web}' },
    { label: 'שם המדינה בה קיים המפעל:', tag: '{fab_pais}' },
    { label: 'עיר:', tag: '{fab_ciudad}' },

    // Section: Products
    { label: 'המוצר/ים המוגמר שעליו ניתן הכשרות', tag: '{productos}' },

    // Section: Production method
    { label: 'במידה וכן, האם בוצע ניקון/הכשרה על פי הנהלים', tag: '{limpieza}' },
    { label: 'כשר לכל ימות השנה כולל פסח/ייצור מיוחד לפסח:', tag: '{pesaj}' },
    { label: 'כמות ושמות המוצרים שנעשו בהשגחה צמודה', tag: '{productos_supervisados}' },
    { label: 'במידה ונעשה בישול ישראל, ע"י מי?', tag: '{bishul_por}' },
    { label: 'במידה ואין צורך בבישול ישראל, יש לציין מדוע:', tag: '{bishul_porque}' },

    // Section: Page 2 - Baking
    { label: 'כמה ימים ערך הייצור?', tag: '{dias_produccion}' },
    { label: 'האם משגיח נמצא בהדלקה הראשונית או בכל ימי היצור?', tag: '{mashgiaj_presencia}' },

    // Section: Close supervision
    { label: 'שם המשגיח שנכח בשעת הייצור:', tag: '{mashgiaj_nombre}' },
    { label: 'במקרה של מספר משגיחים', tag: '{mashgiajim_adicionales}' },
    { label: 'טלפון/נייד:', tag: '{mashgiaj_tel}', occurrence: 3 },
    { label: 'דוא"ל', tag: '{mashgiaj_email}', occurrence: 3 },
    { label: 'תאריכי ההשגחה/ייצור, בהם היה נוכח המשגיח:', tag: '{fechas_supervision}' },
    { label: 'שעת התחלת ייצור:', tag: '{hora_inicio}' },
    { label: 'שעת הסייום ייצור', tag: '{hora_fin}' },

    // Section: Packaging
    { label: 'ציין את נוסח הכשרות המלא המצויין ע"ג האריזה:', tag: '{texto_kashrut}' },
    { label: 'ציין את קוד הייצור המופיע ע"ג המוצר:', tag: '{codigo_produccion}' },
    { label: 'פג תוקף הייצור בתאריך:', tag: '{fecha_vencimiento}' },
    { label: 'האם הודבקו הולוגרמות על האריזות:', tag: '{hologramas}' },
    { label: 'האם האריזות הוחתמו בחותמות:', tag: '{sellos}' },

    // Section: Regular supervision
    { label: 'שם המשגיח או הרב שערך את הביקור במפעל לצורך בדיקת הכשרות:', tag: '{mashgiaj_regular}' },
    { label: 'תאריך הביקור במפעל:', tag: '{fecha_visita}' },
    { label: 'מה תדירות הביקורים בשנה:', tag: '{frecuencia_visitas}' },
    { label: 'טלפון/נייד:', tag: '{mashgiaj_reg_tel}', occurrence: 4 },
    { label: 'דוא"ל:', tag: '{mashgiaj_reg_email}', occurrence: 4 },

    // Section: Raw materials
    { label: 'חומרי הגלם הינם בכשרות של רבנות מוכרת ומוסמכת', tag: '{materias_primas}' },

    // Section: Production process detail
    { label: 'פירוט תהליך הייצור:', tag: '{proceso_produccion}' },

    // Section: Final signature and date
    { label: 'חתימת המשגיח:', tag: '{firma_final}', occurrence: 2 },
    { label: 'תאריך :', tag: '{fecha_final}' },
];

// Instead of complex label matching, let's do a simpler approach:
// Replace ALL underline sequences (_____+) with numbered tags, then manually map them

// First, let's count and list all underline patterns
const underlinePattern = /(<w:t[^>]*>)([^<]*?)(_{3,})([^<]*)(<\/w:t>)/g;
let match;
let underlineCount = 0;
const positions = [];

while ((match = underlinePattern.exec(docXml)) !== null) {
    underlineCount++;
    positions.push({
        index: match.index,
        fullMatch: match[0],
        startTag: match[1],
        textBefore: match[2],
        underlines: match[3],
        textAfter: match[4],
        closeTag: match[5],
        position: underlineCount
    });
}

console.log(`Found ${underlineCount} underline placeholders in the document.`);

// Map position number to tag name based on document order
const positionToTag = {
    1: '{fecha}',
    2: '{importador}',
    3: '{imp_telefono}',
    4: '{imp_fax}',
    5: '{imp_email}',
    6: '{certificador}',
    7: '{cert_telefono}',
    8: '{cert_fax}',
    9: '{cert_email}',
    10: '{fabrica}',
    11: '{fab_contacto}',
    12: '{fab_telefono}',
    13: '{fab_web}',
    14: '{fab_pais}',
    15: '{fab_ciudad}',
    16: '{productos}',
    17: '{limpieza}',
    18: '{pesaj}',
    19: '{productos_supervisados}',
    20: '{bishul_por}',
    21: '{bishul_porque}',
    22: '{dias_produccion}',
    23: '{mashgiaj_presencia}',
    24: '{mashgiaj_nombre}',
    25: '{mashgiajim_adicionales}',
    26: '{mashgiaj_tel}',
    27: '{mashgiaj_email}',
    28: '{fechas_supervision}',
    29: '{hora_inicio}',
    30: '{hora_fin}',
    31: '{texto_kashrut}',
    32: '{codigo_produccion}',
    33: '{fecha_vencimiento}',
    34: '{hologramas}',
    35: '{sellos}',
    36: '{mashgiaj_regular}',
    37: '{fecha_visita}',
    38: '{frecuencia_visitas}',
    39: '{mashgiaj_reg_tel}',
    40: '{mashgiaj_reg_email}',
    41: '{materias_primas}',
    
    // Signatures area
    // The new template has certifier first in XML order due to table layout
    42: '{%firma_certificador}',      
    43: '{firma_certificador_2}',    
    44: '{firma_certificador_3}',    
    45: '{%firma_mashgiaj}',          
    46: '{firma_mashgiaj_2}',        

    // Production process detail
    47: '{proceso_produccion}',      
    48: '{proceso_produccion_2}',    

    // Final signature
    49: '{%firma_final}',             
    50: '{fecha_final}'
};

// Replace each underline with its tag
let newDocXml = docXml;
let offset = 0;

positions.forEach((pos, i) => {
    const tagNum = i + 1;
    const tag = positionToTag[tagNum] || `{campo_${tagNum}}`;

    const oldText = pos.fullMatch;
    const newText = `${pos.startTag}${pos.textBefore}${tag}${pos.textAfter}${pos.closeTag}`;

    const adjustedIndex = pos.index + offset;
    newDocXml = newDocXml.substring(0, adjustedIndex) + newText + newDocXml.substring(adjustedIndex + oldText.length);
    offset += newText.length - oldText.length;

    console.log(`  #${tagNum}: ${tag} (was ${pos.underlines.length} underscores)`);
});

// Update the document.xml in the zip
zip.updateFile('word/document.xml', Buffer.from(newDocXml, 'utf8'));

// Save as template
zip.writeZip(OUTPUT);
console.log(`\n✅ Template saved as: ${OUTPUT}`);
console.log(`   Total fields: ${positions.length}`);
console.log('\nYou can now open template.docx in Word to verify the tags are correct.');
