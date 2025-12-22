import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ number: string }> }
) {
  try {
    const { number } = await params
    const uploadDir = process.env.UPLOAD_DIR || './uploads'
    const certificatesDir = `${uploadDir}/certificates`
    const filePath = join(certificatesDir, `${number}.html`)

    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Сертификат не найден' },
        { status: 404 }
      )
    }

    const htmlContent = await readFile(filePath, 'utf-8')

    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="certificate-${number}.html"`,
      },
    })
  } catch (error) {
    console.error('Certificate download error:', error)
    return NextResponse.json(
      { error: 'Ошибка получения сертификата' },
      { status: 500 }
    )
  }
}

