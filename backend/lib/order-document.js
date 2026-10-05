import pdfMakeModule from 'pdfmake/build/pdfmake.js';
import pdfFontsModule from 'pdfmake/build/vfs_fonts.js';

const pdfMake = pdfMakeModule?.default || pdfMakeModule;
const pdfFonts = pdfFontsModule?.default || pdfFontsModule;

if (typeof pdfMake.addVirtualFileSystem === 'function') {
  pdfMake.addVirtualFileSystem(pdfFonts);
} else {
  pdfMake.vfs = pdfFonts?.pdfMake?.vfs || pdfFonts?.vfs || pdfFonts;
}

pdfMake.fonts = {
  Roboto: {
    normal: 'Roboto-Regular.ttf',
    bold: 'Roboto-Medium.ttf',
    italics: 'Roboto-Italic.ttf',
    bolditalics: 'Roboto-MediumItalic.ttf',
  },
};

function toIso(value) {
  return value ? new Date(value).toISOString() : null;
}

function normalizeItem(item) {
  return {
    materialKey: item.materialKey,
    materialName: item.materialName,
    categoryKey: item.categoryKey,
    categoryLabel: item.categoryLabel,
    diameter: item.diameter,
    thickness: item.thickness || null,
    type: item.type,
    unit: item.unit,
    quantity: Number(item.quantity),
  };
}

export function buildOrderSnapshot(order, overrides = {}) {
  return {
    version: 1,
    createdAt: new Date().toISOString(),
    order: {
      id: order.id,
      number: order.number,
      title: order.title,
      category: order.category || null,
      note: order.note || null,
      status: overrides.status || order.status,
      submittedAt: toIso(overrides.submittedAt ?? order.submittedAt),
      completedAt: toIso(overrides.completedAt ?? order.completedAt),
      createdAt: toIso(order.createdAt),
    },
    company: order.company ? {
      id: order.company.id,
      name: order.company.name,
    } : null,
    project: order.project ? {
      id: order.project.id,
      name: order.project.name,
      address: order.project.address || null,
    } : null,
    worker: order.createdByMembership?.user ? {
      id: order.createdByMembership.user.id,
      name: order.createdByMembership.user.name,
      email: order.createdByMembership.user.email,
    } : null,
    items: (order.items || []).map(normalizeItem),
  };
}

const STATUS_LABELS_CS = {
  DRAFT: 'ROZPRACOVÁNO',
  SUBMITTED: 'ODESLÁNO',
  COMPLETED: 'DOKONČENO',
};

const CATEGORY_LABELS_CS = {
  'Опалення': 'Vytápění',
  'Водопостачання': 'Vodoinstalace',
  'Каналізація': 'Kanalizace',
  'Сантехніка': 'Sanitární technika',
  'Інше': 'Ostatní',
};

export function formatOrderStatusCs(value) {
  const normalized = String(value ?? '').trim();
  return STATUS_LABELS_CS[normalized] || normalized || '-';
}

export function formatOrderCategoryCs(value) {
  const normalized = String(value ?? '').trim();
  return CATEGORY_LABELS_CS[normalized] || normalized || '-';
}

function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('cs-CZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function text(value, fallback = '-') {
  const normalized = String(value ?? '').trim();
  return normalized || fallback;
}

function createDefinition(snapshot) {
  const order = snapshot.order || {};
  const project = snapshot.project || {};
  const worker = snapshot.worker || {};
  const company = snapshot.company || {};
  const items = snapshot.items || [];

  return {
    pageSize: 'A4',
    pageMargins: [40, 44, 40, 46],
    info: {
      title: `PipeStock zakázka #${order.number || ''}`,
      subject: 'Soupis materiálu PipeStock',
      author: text(company.name, 'PipeStock'),
      creator: 'PipeStock',
    },
    defaultStyle: {
      font: 'Roboto',
      fontSize: 10,
      color: '#111827',
    },
    footer(currentPage, pageCount) {
      return {
        columns: [
          { text: 'PipeStock', color: '#667085', fontSize: 8 },
          { text: `${currentPage} / ${pageCount}`, alignment: 'right', color: '#667085', fontSize: 8 },
        ],
        margin: [40, 10, 40, 0],
      };
    },
    content: [
      {
        columns: [
          [
            { text: 'PipeStock', style: 'brand' },
            { text: text(company.name, 'Firma'), style: 'company' },
          ],
          [
            { text: `#${text(order.number)}`, style: 'orderNumber', alignment: 'right' },
            { text: formatOrderStatusCs(order.status), style: 'status', alignment: 'right' },
          ],
        ],
        margin: [0, 0, 0, 22],
      },
      { text: text(order.title, 'Zakázka'), style: 'title' },
      { text: text(project.name, 'Objekt'), style: 'subtitle', margin: [0, 2, 0, 16] },
      {
        table: {
          widths: [90, '*'],
          body: [
            [{ text: 'Objekt', style: 'label' }, text(project.name)],
            [{ text: 'Adresa', style: 'label' }, text(project.address)],
            [{ text: 'Pracovník', style: 'label' }, text(worker.name)],
            [{ text: 'E-mail', style: 'label' }, text(worker.email)],
            [{ text: 'Kategorie', style: 'label' }, formatOrderCategoryCs(order.category)],
            [{ text: 'Odesláno', style: 'label' }, formatDate(order.submittedAt)],
            [{ text: 'Dokončeno', style: 'label' }, formatDate(order.completedAt)],
          ],
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 22],
      },
      { text: `Materiály (${items.length})`, style: 'sectionTitle', margin: [0, 0, 0, 8] },
      {
        table: {
          headerRows: 1,
          widths: [24, 68, 52, 46, '*', 48],
          body: [
            [
              { text: '#', style: 'tableHeader' },
              { text: 'Materiál', style: 'tableHeader' },
              { text: 'Průměr', style: 'tableHeader' },
              { text: 'Tloušťka', style: 'tableHeader' },
              { text: 'Typ', style: 'tableHeader' },
              { text: 'Množství', style: 'tableHeader', alignment: 'right' },
            ],
            ...items.map((item, index) => [
              String(index + 1),
              text(item.categoryLabel || item.materialName),
              text(item.diameter),
              text(item.thickness),
              text(item.type || item.materialName),
              { text: `${item.quantity} ${text(item.unit, '')}`.trim(), alignment: 'right' },
            ]),
          ],
        },
        layout: {
          fillColor(rowIndex) {
            return rowIndex === 0 ? '#EAF3FF' : null;
          },
          hLineColor: '#E5E7EB',
          vLineColor: '#E5E7EB',
          paddingLeft: () => 7,
          paddingRight: () => 7,
          paddingTop: () => 6,
          paddingBottom: () => 6,
        },
      },
      {
        stack: [
          { text: 'Poznámka', style: 'sectionTitle', margin: [0, 0, 0, 8] },
          {
            table: {
              widths: ['*'],
              body: [[{ text: text(order.note), margin: [8, 8, 8, 8] }]],
            },
            layout: {
              hLineColor: '#E5E7EB',
              vLineColor: '#E5E7EB',
            },
          },
        ],
        margin: [0, 18, 0, 0],
      },
      {
        columns: [
          {
            width: '*',
            stack: [
              { text: 'Podpis', style: 'label', margin: [0, 0, 0, 14] },
              { text: '____________________________', color: '#98A2B3' },
            ],
          },
          {
            width: 150,
            stack: [
              { text: 'Datum', style: 'label', margin: [0, 0, 0, 14] },
              { text: '____________________', color: '#98A2B3' },
            ],
          },
        ],
        columnGap: 24,
        margin: [0, 24, 0, 0],
      },
      {
        text: `Verze dokumentu ${snapshot.version || 1} · ${formatDate(snapshot.createdAt)}`,
        color: '#98A2B3',
        fontSize: 8,
        margin: [0, 18, 0, 0],
      },
    ],
    styles: {
      brand: { fontSize: 20, bold: true, color: '#1263EB' },
      company: { fontSize: 9, color: '#667085', margin: [0, 3, 0, 0] },
      orderNumber: { fontSize: 16, bold: true, color: '#172554' },
      status: { fontSize: 9, color: '#1263EB', margin: [0, 3, 0, 0] },
      title: { fontSize: 20, bold: true, color: '#111827' },
      subtitle: { fontSize: 11, color: '#667085' },
      sectionTitle: { fontSize: 13, bold: true, color: '#111827' },
      label: { bold: true, color: '#667085' },
      tableHeader: { bold: true, color: '#172554' },
    },
  };
}

export async function createOrderPdf(snapshot) {
  const definition = createDefinition(snapshot);
  return new Promise((resolve, reject) => {
    try {
      pdfMake.createPdf(definition).getBuffer(buffer => resolve(Buffer.from(buffer)));
    } catch (error) {
      reject(error);
    }
  });
}
