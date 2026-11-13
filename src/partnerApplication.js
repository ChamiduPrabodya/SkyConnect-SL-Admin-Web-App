// Registration uses ISO dates; older records can contain Firestore timestamps.
function parseSubmissionDate(value) {
  if (value == null || value === '' || typeof value === 'boolean') return null;
  try {
    let date;
    if (value instanceof Date) date = value;
    else if (typeof value.toDate === 'function') date = value.toDate();
    else if (typeof value === 'object') {
      const seconds = value.seconds ?? value._seconds;
      const nanos = value.nanoseconds ?? value._nanoseconds ?? 0;
      if (!Number.isFinite(seconds) || !Number.isFinite(nanos)) return null;
      date = new Date(seconds * 1000 + nanos / 1e6);
    } else date = new Date(value);
    return date instanceof Date && Number.isFinite(date.getTime()) ? date : null;
  } catch {
    return null;
  }
}

function partnerSubmissionDate(partner) {
  return parseSubmissionDate(partner.submittedAt) || parseSubmissionDate(partner.createdAt);
}

export function sortPartnerApplications(partners) {
  // Keep undated legacy records at the end and preserve order for matching dates.
  return partners.map(partner => ({ partner, time: partnerSubmissionDate(partner)?.getTime() ?? Infinity }))
    .sort((a, b) => a.time === b.time ? 0 : a.time - b.time)
    .map(({ partner }) => partner);
}

export function formatPartnerSubmission(partner) {
  const date = partnerSubmissionDate(partner);
  if (!date) return null;
  return {
    dateTime: date.toISOString(),
    date: new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Colombo', day: '2-digit', month: 'short', year: 'numeric' }).format(date),
    time: new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Colombo', hour: 'numeric', minute: '2-digit', hour12: true }).format(date),
  };
}
