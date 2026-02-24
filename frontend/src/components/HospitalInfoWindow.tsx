import type { Hospital } from '../types/hospital'
import { formatDistance, formatDate } from '../utils/format'

interface HospitalInfoWindowProps {
  hospital: Hospital
  distanceMeters: number
}

export function buildInfoWindowHtml({ hospital, distanceMeters }: HospitalInfoWindowProps): string {
  const h = hospital
  const rows: string[] = []

  const row = (icon: string, content: string) =>
    `<div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px;"><span style="flex-shrink:0;">${icon}</span>${content}</div>`

  if (h.address) rows.push(row('📍', escapeHtml(h.address)))
  if (h.phone) {
    const tel = h.phone.replace(/-/g, '')
    rows.push(
      row(
        '📞',
        `<a href="tel:${escapeHtml(
          tel
        )}" style="color:#2563eb;text-decoration:none;font-weight:500;">${escapeHtml(h.phone)}</a>`
      )
    )
  }
  if (h.department) rows.push(row('🏥', escapeHtml(h.department)))
  if (h.doctorTotalCount != null && h.doctorTotalCount > 0)
    rows.push(row('👨‍⚕️', `의사 ${h.doctorTotalCount}명`))
  if (h.establishedDate) rows.push(row('📅', formatDate(h.establishedDate)))
  rows.push(row('📏', formatDistance(distanceMeters)))
  rows.push(
    row(
      '🕐',
      '<span style="color:#6b7280;font-size:12px;">※ 진료 시간은 병원에 문의해 주세요</span>'
    )
  )

  const lat = h.latitude ?? 0
  const lng = h.longitude ?? 0
  const navLinks = `
    <div style="margin-top:10px;">
      <button
        type="button"
        data-action="directions"
        data-dest-lat="${lat}"
        data-dest-lng="${lng}"
        style="display:flex;align-items:center;justify-content:center;gap:6px;width:100%;padding:8px 12px;background:#0ea5e9;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;"
      >🗺️ 앱 내 길찾기</button>
    </div>
  `

  return `
    <div class="hospital-info-popup" style="
      min-width:260px;max-width:300px;
      font-family:-apple-system,sans-serif;font-size:13px;line-height:1.5;
      background:#fff;
      border-radius:16px;
      box-shadow:0 10px 40px rgba(0,0,0,0.12);
      overflow:hidden;
    ">
      <div style="padding:14px 16px;background:linear-gradient(135deg,#f0f9ff 0%,#e0f2fe 100%);border-bottom:1px solid #e5e7eb;">
        <div style="font-size:15px;font-weight:700;color:#0c4a6e;">${escapeHtml(h.name)}</div>
        <div style="font-size:12px;color:#0369a1;margin-top:2px;">${formatDistance(distanceMeters)}</div>
      </div>
      <div style="padding:12px 16px;color:#374151;">
        ${rows.join('')}
        ${navLinks}
      </div>
    </div>
  `
}

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}
