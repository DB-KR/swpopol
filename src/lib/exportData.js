function downloadBlob(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadJson(data, filename) {
  downloadBlob(JSON.stringify(data, null, 2), filename, "application/json");
}

function csvEscape(value) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export function toCsv(rows) {
  if (!rows || rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  rows.forEach((row) => {
    lines.push(headers.map((h) => csvEscape(row[h])).join(","));
  });
  return lines.join("\n");
}

export function downloadCsv(rows, filename) {
  if (!rows || rows.length === 0) return false;
  // 엑셀에서 한글이 깨지지 않도록 UTF-8 BOM을 붙입니다.
  downloadBlob("\uFEFF" + toCsv(rows), filename, "text/csv;charset=utf-8");
  return true;
}
