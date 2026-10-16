import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatCurrency } from './currency'
import { formatLongDate, todayISO } from './dateUtils'
import { sumAll, goalStats, sumForMonth } from './savingsCalculations'

// ---------- Palette ----------
const ORANGE = [244, 119, 33]
const NAVY   = [23, 36, 58]
const MUTED  = [132, 145, 165]
const BORDER = [232, 237, 244]
const BG     = [247, 249, 252]
const SUCCESS = [35, 150, 106]

// Paper + decor tones (warm cream, matching the reference)
const PAPER      = [250, 248, 243]
const GHOST_TEXT = [216, 208, 192]
const ICON_LINE  = [200, 190, 172]

// ============================================================
// Tiny finance icons (drawn inside a circular badge)
// ============================================================

function iconCoin(doc, x, y, s) {
  doc.circle(x, y, 2.4 * s, 'S')
  doc.line(x, y - 1.3 * s, x, y + 1.3 * s)
  doc.line(x - 0.9 * s, y - 0.55 * s, x + 0.9 * s, y - 0.55 * s)
  doc.line(x - 0.9 * s, y + 0.55 * s, x + 0.9 * s, y + 0.55 * s)
}

function iconBars(doc, x, y, s) {
  const w = 1.1 * s
  doc.rect(x - 2.1 * s, y + 0.2 * s, w, 1.8 * s, 'S')
  doc.rect(x - 0.55 * s, y - 1.4 * s, w, 3.4 * s, 'S')
  doc.rect(x + 1.0 * s, y - 0.4 * s, w, 2.4 * s, 'S')
}

function iconPiggy(doc, x, y, s) {
  doc.circle(x - 0.2 * s, y, 2.1 * s, 'S')
  doc.circle(x + 1.4 * s, y - 0.1 * s, 0.7 * s, 'S')
  doc.circle(x + 0.7 * s, y - 0.85 * s, 0.22 * s, 'F')
  doc.line(x - 0.8 * s, y + 2.0 * s, x - 0.8 * s, y + 2.5 * s)
  doc.line(x + 0.6 * s, y + 2.0 * s, x + 0.6 * s, y + 2.5 * s)
}

function iconWallet(doc, x, y, s) {
  doc.roundedRect(x - 2.6 * s, y - 1.7 * s, 5.2 * s, 3.4 * s, 0.5 * s, 0.5 * s, 'S')
  doc.line(x + 0.6 * s, y - 1.7 * s, x + 0.6 * s, y + 1.7 * s)
  doc.circle(x + 1.6 * s, y, 0.4 * s, 'S')
}

function iconGrowth(doc, x, y, s) {
  doc.line(x - 2.6 * s, y + 1.6 * s, x - 1.0 * s, y + 0.2 * s)
  doc.line(x - 1.0 * s, y + 0.2 * s, x + 0.6 * s, y + 1.0 * s)
  doc.line(x + 0.6 * s, y + 1.0 * s, x + 2.6 * s, y - 1.6 * s)
  doc.circle(x - 2.6 * s, y + 1.6 * s, 0.32 * s, 'F')
  doc.circle(x + 2.6 * s, y - 1.6 * s, 0.32 * s, 'F')
}

function iconTarget(doc, x, y, s) {
  doc.circle(x, y, 2.4 * s, 'S')
  doc.circle(x, y, 1.4 * s, 'S')
  doc.circle(x, y, 0.5 * s, 'F')
}

// 2 rows × 3 columns of circular icon badges, top-right corner
function drawIconGrid(doc, rightX, topY, scale = 1) {
  const icons = [iconCoin, iconBars, iconGrowth, iconPiggy, iconWallet, iconTarget]
  const cellW = 15 * scale
  const cellH = 15 * scale
  const badgeR = 5.4 * scale

  icons.forEach((fn, i) => {
    const col = i % 3
    const row = Math.floor(i / 3)
    const cx = rightX - (2 - col) * cellW
    const cy = topY + row * cellH

    doc.setLineWidth(0.35 * scale)
    doc.circle(cx, cy, badgeR, 'S')
    fn(doc, cx, cy, 0.85 * scale)
  })
}

// ============================================================
// Layout helpers
// ============================================================

function drawHeader(doc, { pageWidth, margin }) {
  doc.setFillColor(...ORANGE)
  doc.roundedRect(margin, margin, 10, 10, 2.5, 2.5, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('O', margin + 5, margin + 7, { align: 'center' })

  doc.setTextColor(...NAVY)
  doc.setFontSize(10)
  doc.text('OverStack', margin + 14, margin + 4.5)

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...MUTED)
  doc.setFontSize(9)
  const subtitle = `Savings report  ·  ${new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })}`
  doc.text(subtitle, margin + 14, margin + 8.5)

  doc.setDrawColor(...BORDER)
  doc.setLineWidth(0.3)
  doc.line(margin, margin + 16, pageWidth - margin, margin + 16)

  return margin + 26
}

function drawTitle(doc, { y, title, blurb, pageWidth, margin }) {
  doc.setTextColor(...NAVY)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.text(title, margin, y)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...MUTED)
  const lines = doc.splitTextToSize(blurb, pageWidth - margin * 2 - 30)
  doc.text(lines, margin, y + 8)

  return y + 8 + lines.length * 4.5 + 6
}

function drawStatCards(doc, { y, cards, pageWidth, margin }) {
  const gap = 6
  const cardW = (pageWidth - margin * 2 - gap * (cards.length - 1)) / cards.length
  const cardH = 24

  cards.forEach((card, i) => {
    const x = margin + i * (cardW + gap)

    doc.setFillColor(...BG)
    doc.setDrawColor(...BORDER)
    doc.setLineWidth(0.3)
    doc.roundedRect(x, y, cardW, cardH, 2.5, 2.5, 'FD')

    doc.setTextColor(...MUTED)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.text(card.label.toUpperCase(), x + 4, y + 6)

    doc.setTextColor(...NAVY)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text(card.value, x + 4, y + 14)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...MUTED)
    doc.text(card.sub, x + 4, y + 19.5)
  })

  return y + cardH + 8
}

function drawSectionTitle(doc, { y, label, margin }) {
  doc.setTextColor(...NAVY)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(label, margin, y)
  return y + 3
}

// ============================================================
// Watermark decor (drawn at end, at low opacity)
// ============================================================

function drawWatermark(doc, { pageWidth, pageHeight }) {
  try {
    doc.setGState(new doc.GState({ opacity: 0.06 }))
  } catch { /* fall back to no-opacity */ }

  // ---- Big ghost brand text, centered horizontally ----
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(104)
  doc.setTextColor(...GHOST_TEXT)
  doc.text('OverStack', pageWidth / 2, pageHeight / 2 + 10, {
    align: 'center',
    baseline: 'middle',
  })

  // ---- Small icon grid, top-right ----
  doc.setDrawColor(...ICON_LINE)
  drawIconGrid(doc, pageWidth - 26, 46, 1)

  try {
    doc.setGState(new doc.GState({ opacity: 1 }))
  } catch { /* ignore */ }
}

function drawFooter(doc, { pageWidth, pageHeight, margin, pageNumber, pageCount }) {
  const footerY = pageHeight - 8

  doc.setDrawColor(...BORDER)
  doc.setLineWidth(0.3)
  doc.line(margin, footerY - 6, pageWidth - margin, footerY - 6)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...MUTED)

  const disclaimer =
    'Generated locally by OverStack. All figures are derived from manually recorded savings ' +
    'stored in this browser. This report is for personal reference only and is not a financial statement.'
  const lines = doc.splitTextToSize(disclaimer, pageWidth - margin * 2 - 30)
  doc.text(lines, margin, footerY)

  doc.text(`Page ${pageNumber} of ${pageCount}`, pageWidth - margin, footerY, {
    align: 'right',
  })
}

// ============================================================
// Main export
// ============================================================

export async function exportPdfReport({ goals, savings, currency = 'KSh', displayName = 'Dave' }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 18

  // Paper background (page 1)
  doc.setFillColor(...PAPER)
  doc.rect(0, 0, pageWidth, pageHeight, 'F')

  // ---------- Header ----------
  let y = drawHeader(doc, { pageWidth, margin })

  const total = sumAll(savings)
  const now = new Date()
  const monthTotal = sumForMonth(savings, now.getFullYear(), now.getMonth())
  const goalCount = goals.length
  const activeCount = goals.filter((g) => !goalStats(g, savings).completed).length
  const completedCount = goalCount - activeCount

  // ---------- Title ----------
  y = drawTitle(doc, {
    y: y + 4,
    title: `${displayName}'s savings summary`,
    blurb:
      'A clean snapshot of your manually recorded savings. Balances, goal progress, and monthly ' +
      'totals are calculated from your own contributions — nothing is estimated.',
    pageWidth,
    margin,
  })

  // ---------- Stat cards ----------
  y = drawStatCards(doc, {
    y,
    cards: [
      { label: 'Total saved', value: formatCurrency(total, currency), sub: 'All-time' },
      { label: 'This month',  value: formatCurrency(monthTotal, currency), sub: now.toLocaleDateString('en-US', { month: 'long' }) },
      { label: 'Goals',       value: `${goalCount}`, sub: `${activeCount} active · ${completedCount} done` },
    ],
    pageWidth,
    margin,
  })

  // ---------- Goal breakdown ----------
  y = drawSectionTitle(doc, { y, label: 'Goal breakdown', margin })

  const goalRows = goals.map((g) => {
    const s = goalStats(g, savings)
    return [
      g.name,
      formatCurrency(s.saved, currency),
      formatCurrency(s.target, currency),
      `${Math.round(s.percent)}%`,
      s.completed ? 'Completed' : formatCurrency(s.remaining, currency),
    ]
  })

  autoTable(doc, {
    startY: y + 3,
    margin: { left: margin, right: margin },
    head: [['Goal', 'Saved', 'Target', 'Progress', 'Remaining']],
    body: goalRows.length ? goalRows : [['— No goals yet —', '', '', '', '']],
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 3.2, textColor: NAVY, lineColor: BORDER, lineWidth: 0.2 },
    headStyles: { fillColor: BG, textColor: MUTED, fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: [252, 253, 255] },
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
    },
  })

  y = doc.lastAutoTable.finalY + 10

  // ---------- Recent contributions ----------
  if (y > pageHeight - 60) {
    doc.addPage()
    doc.setFillColor(...PAPER)
    doc.rect(0, 0, pageWidth, pageHeight, 'F')
    y = margin + 10
  }

  y = drawSectionTitle(doc, { y, label: 'Recent contributions', margin })

  const recent = [...savings]
    .sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date)
      return b.createdAt - a.createdAt
    })
    .slice(0, 12)

  const contribRows = recent.map((s) => {
    const goal = goals.find((g) => g.id === s.goalId)
    return [
      formatLongDate(s.date),
      goal?.name || 'Deleted goal',
      s.note || '—',
      `+${formatCurrency(s.amount, currency)}`,
    ]
  })

  autoTable(doc, {
    startY: y + 3,
    margin: { left: margin, right: margin },
    head: [['Date', 'Goal', 'Note', 'Amount']],
    body: contribRows.length ? contribRows : [['— No contributions yet —', '', '', '']],
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 3.2, textColor: NAVY, lineColor: BORDER, lineWidth: 0.2 },
    headStyles: { fillColor: BG, textColor: MUTED, fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: [252, 253, 255] },
    columnStyles: {
      3: { halign: 'right', textColor: SUCCESS, fontStyle: 'bold' },
    },
  })

  // ---------- Watermark + footer on every page ----------
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    drawWatermark(doc, { pageWidth, pageHeight })
    drawFooter(doc, { pageWidth, pageHeight, margin, pageNumber: i, pageCount })
  }

  // ---------- Save ----------
  const stamp = todayISO()
  doc.save(`overstack-summary-${stamp}.pdf`)
}
