// Генератор PDF сертификатов

interface CertificateData {
  studentName: string
  courseName: string
  certificateNumber: string
  issueDate: string
  score?: number
  completionPercentage?: number
}

export function generateCertificateHTML(data: CertificateData): string {
  return `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Сертификат</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 0;
    }
    body {
      margin: 0;
      padding: 0;
      font-family: 'Times New Roman', serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    .certificate-container {
      width: 29.7cm;
      height: 21cm;
      background: white;
      padding: 3cm;
      box-sizing: border-box;
      position: relative;
      border: 2mm solid #667eea;
    }
    .certificate-border {
      position: absolute;
      top: 1cm;
      left: 1cm;
      right: 1cm;
      bottom: 1cm;
      border: 1mm solid #764ba2;
      border-radius: 5mm;
    }
    .certificate-header {
      text-align: center;
      margin-bottom: 2cm;
    }
    .certificate-title {
      font-size: 48pt;
      font-weight: bold;
      color: #667eea;
      margin-bottom: 0.5cm;
      text-transform: uppercase;
      letter-spacing: 3pt;
    }
    .certificate-subtitle {
      font-size: 18pt;
      color: #666;
      margin-top: 0.5cm;
    }
    .certificate-body {
      text-align: center;
      margin: 2cm 0;
    }
    .certificate-text {
      font-size: 16pt;
      line-height: 1.8;
      color: #333;
      margin-bottom: 1cm;
    }
    .student-name {
      font-size: 32pt;
      font-weight: bold;
      color: #667eea;
      margin: 0.5cm 0;
      text-decoration: underline;
      text-decoration-color: #764ba2;
      text-decoration-thickness: 2pt;
    }
    .course-name {
      font-size: 24pt;
      font-weight: bold;
      color: #764ba2;
      margin: 0.5cm 0;
      font-style: italic;
    }
    .certificate-footer {
      margin-top: 2cm;
      display: flex;
      justify-content: space-between;
      font-size: 12pt;
      color: #666;
    }
    .certificate-number {
      position: absolute;
      bottom: 1cm;
      left: 50%;
      transform: translateX(-50%);
      font-size: 10pt;
      color: #999;
    }
    .signature-line {
      margin-top: 2cm;
      border-top: 1pt solid #333;
      width: 6cm;
      display: inline-block;
      padding-top: 0.3cm;
    }
    @media print {
      body {
        background: white;
      }
      .certificate-container {
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="certificate-container">
    <div class="certificate-border"></div>
    <div class="certificate-header">
      <div class="certificate-title">Сертификат</div>
      <div class="certificate-subtitle">о прохождении курса</div>
    </div>
    <div class="certificate-body">
      <div class="certificate-text">
        Настоящим подтверждается, что
      </div>
      <div class="student-name">${escapeHtml(data.studentName)}</div>
      <div class="certificate-text">
        успешно завершил(а) курс
      </div>
      <div class="course-name">«${escapeHtml(data.courseName)}»</div>
      ${data.score !== undefined || data.completionPercentage !== undefined ? `
      <div class="certificate-text" style="margin-top: 1cm;">
        ${data.completionPercentage !== undefined ? `Процент выполнения: ${data.completionPercentage}%` : ''}
        ${data.score !== undefined && data.completionPercentage !== undefined ? ' • ' : ''}
        ${data.score !== undefined ? `Набранные баллы: ${data.score}` : ''}
      </div>
      ` : ''}
    </div>
    <div class="certificate-footer">
      <div>
        <div class="signature-line">Дата выдачи</div>
        <div style="margin-top: 0.3cm;">${escapeHtml(data.issueDate)}</div>
      </div>
      <div>
        <div class="signature-line">Подпись</div>
      </div>
    </div>
    <div class="certificate-number">
      Номер сертификата: ${escapeHtml(data.certificateNumber)}
    </div>
  </div>
</body>
</html>
  `.trim()
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

