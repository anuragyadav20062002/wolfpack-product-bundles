/**
 * Shared discount progress renderer.
 *
 * Accepts prepared progress data so FPB and PPB can keep their pricing and
 * discount calculation ownership while sharing the DOM contract.
 */

'use strict';

export function renderDiscountProgress(progressData = {}, options = {}) {
  const progressPercent = normalizePercent(progressData.progressPercent);
  const mode = options.mode || 'bar';
  const message = progressData.message || '';
  const milestones = Array.isArray(progressData.milestones) ? progressData.milestones : [];
  const rootClasses = [
    'bw-discount-progress',
    `bw-discount-progress--mode-${escapeAttribute(mode)}`,
    progressData.success ? 'bw-discount-progress--success' : '',
    options.className || '',
  ].filter(Boolean).join(' ');

  return `
    <div class="${rootClasses}" data-bw-discount-progress="true" style="--bw-discount-progress-width:${progressPercent}%">
      ${message ? `<div class="bw-discount-progress__message ${escapeAttribute(options.messageClassName || '')}">${escapeHtml(message)}</div>` : ''}
      ${renderMilestones(milestones, options)}
      <div class="bw-discount-progress__track ${escapeAttribute(options.trackClassName || '')}" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progressPercent}">
        <div class="bw-discount-progress__fill ${escapeAttribute(options.fillClassName || '')}"></div>
      </div>
      ${options.renderSubtitleList ? renderMilestoneSubtitleList(milestones, options) : ''}
    </div>
  `;
}

function renderMilestones(milestones, options) {
  if (!milestones.length) return '';

  const listClassName = escapeAttribute(options.milestoneListClassName || 'bw-discount-progress__milestones');
  const itemClassName = options.milestoneClassName || 'bw-discount-progress__milestone';
  const reachedClassName = options.milestoneReachedClassName || 'bw-discount-progress__milestone--reached';
  const titleClassName = escapeAttribute(options.milestoneTitleClassName || 'bw-discount-progress__milestone-title');
  const subtitleClassName = escapeAttribute(options.milestoneSubtitleClassName || 'bw-discount-progress__milestone-subtitle');
  const includeInlineSubtitle = options.renderInlineSubtitles !== false;

  const items = milestones.map((milestone) => {
    const classes = [
      itemClassName,
      milestone?.isReached ? reachedClassName : '',
    ].filter(Boolean).map(escapeAttribute).join(' ');
    const title = escapeHtml(milestone?.title || '');
    const subtitle = escapeHtml(milestone?.subTitle || '');

    return `
      <div class="${classes}">
        <span class="${titleClassName}">${title}</span>
        ${includeInlineSubtitle && subtitle ? `<span class="${subtitleClassName}">${subtitle}</span>` : ''}
      </div>
    `;
  }).join('');

  return `<div class="${listClassName}">${items}</div>`;
}

function renderMilestoneSubtitleList(milestones, options) {
  if (!milestones.length) return '';

  const listClassName = escapeAttribute(options.subtitleListClassName || 'bw-discount-progress__milestone-subtitles');
  const subtitleClassName = options.milestoneSubtitleClassName || 'bw-discount-progress__milestone-subtitle';
  const reachedClassName = options.milestoneReachedClassName || 'bw-discount-progress__milestone--reached';
  const items = milestones.map((milestone) => {
    const classes = [
      subtitleClassName,
      milestone?.isReached ? reachedClassName : '',
    ].filter(Boolean).map(escapeAttribute).join(' ');

    return `<span class="${classes}">${escapeHtml(milestone?.subTitle || '')}</span>`;
  }).join('');

  return `<div class="${listClassName}">${items}</div>`;
}

function normalizePercent(value) {
  const numericValue = Number(value || 0);
  if (!Number.isFinite(numericValue)) return 0;
  return Math.max(0, Math.min(100, Math.round(numericValue)));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}
