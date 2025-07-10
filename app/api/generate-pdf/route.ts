import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { remark } from 'remark';
import html from 'remark-html';

export async function POST(req: NextRequest) {
  try {
    const { aiSummary, formData } = await req.json();

    if (!aiSummary || !formData) {
      return NextResponse.json(
        { error: 'aiSummary and formData are required' },
        { status: 400 }
      );
    }

    const htmlSummary = (await remark().use(html).process(aiSummary)).toString();

    const { projectDetails, systemParameters } = formData;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Rapport d'Analyse Solaire - ${projectDetails.projectName}</title>
        <style>
          body { font-family: 'Roboto', sans-serif; margin: 20mm; color: #333; line-height: 1.6; }
          h1, h2, h3, h4, h5, h6 { font-family: 'Orbitron', sans-serif; color: #0056b3; margin-top: 1em; margin-bottom: 0.5em; }
          h1 { font-size: 2.2em; text-align: center; color: #004085; }
          h2 { font-size: 1.8em; border-bottom: 2px solid #0056b3; padding-bottom: 5px; margin-top: 1.5em; }
          h3 { font-size: 1.4em; color: #0056b3; }
          p { margin-bottom: 1em; }
          ul { list-style-type: disc; margin-left: 20px; margin-bottom: 1em; }
          li { margin-bottom: 0.5em; }
          .container { max-width: 800px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .header img { width: 100px; margin-bottom: 10px; }
          .footer { text-align: center; margin-top: 50px; font-size: 0.8em; color: #777; border-top: 1px solid #eee; padding-top: 10px; }
          .section { margin-bottom: 30px; padding: 15px; background-color: #f9f9f9; border-left: 5px solid #007bff; }
          .data-table { width: 100%; border-collapse: collapse; margin-top: 1em; }
          .data-table th, .data-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .data-table th { background-color: #e9ecef; }
          .highlight { background-color: #fff3cd; padding: 5px; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Rapport d'Analyse de Projet Solaire</h1>
            <p><strong>Projet:</strong> ${projectDetails.projectName}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
            <p><strong>Type de Système:</strong> ${projectDetails.systemType}</p>
            <p><strong>Tension du Système:</strong> ${systemParameters.systemVoltage}V</p>
          </div>

          <div class="section">
            <h2>Résumé de l'Analyse AI</h2>
            ${htmlSummary}
          </div>

          <div class="footer">
            <p>Généré par SolarCal pour votre projet de doctorat.</p>
            <p>&copy; ${new Date().getFullYear()} SolarCal. Tous droits réservés.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm',
      },
    });

    await browser.close();

    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Disposition', `attachment; filename="${projectDetails.projectName.replace(/\s/g, '_')}_Rapport_Solaire.pdf"`);

    return new NextResponse(pdfBuffer, { status: 200, headers });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF.' },
      { status: 500 }
    );
  }
}
