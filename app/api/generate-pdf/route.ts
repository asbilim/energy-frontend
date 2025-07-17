import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";
import { remark } from "remark";
import html from "remark-html";

import { formatCurrency, formatNumber } from "@/lib/utils"; // Assuming you have these helpers
import { calculateEneoBill } from "@/lib/billing";

export async function POST(req: NextRequest) {
  try {
    const {
      aiSummary,
      formData,
      results,
      totalKwh,
      applianceCostBreakdown,
      systemDiagram,
    } = await req.json();

    if (!aiSummary || !formData || !results) {
      return NextResponse.json(
        { error: "aiSummary, formData, and results are required" },
        { status: 400 }
      );
    }

    const billDetails = calculateEneoBill(totalKwh);

    const htmlSummary = (
      await remark().use(html).process(aiSummary)
    ).toString();

    const { projectDetails, systemParameters, energyConsumption } = formData;
    const { appliances } = energyConsumption;
    const {
      panelsNeeded,
      batteryCapacityAh,
      chargeControllerRating,
      inverterSizeKw,
      energyNeededWithLosses,
    } = results;

    const systemType = projectDetails.systemType;

    // Recalculate costs (duplicate logic from client for accuracy)
    const costPerPanel = 131200;
    const costPerAh = 328;
    const costPerInverterKw = 98400;
    const costPerControllerA = 1312;
    const costKwhGrid = 85;

    const estimatedPanelCost = panelsNeeded * costPerPanel;
    const estimatedBatteryCost =
      systemType !== "grid-tied" ? batteryCapacityAh * costPerAh : 0;
    const estimatedInverterCost = inverterSizeKw * costPerInverterKw;
    const estimatedControllerCost = chargeControllerRating * costPerControllerA;
    const totalSystemCost =
      estimatedPanelCost +
      estimatedBatteryCost +
      estimatedInverterCost +
      estimatedControllerCost;

    const annualSavings =
      systemType !== "off-grid"
        ? energyNeededWithLosses * 365 * costKwhGrid
        : energyNeededWithLosses * 365 * costKwhGrid; // Changed to calculate savings even for off-grid
    const roiYears =
      totalSystemCost > 0 && annualSavings > 0
        ? (totalSystemCost / annualSavings).toFixed(1)
        : "N/A";

    // HTML content
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
          .mermaid { text-align: center; }
        </style>
        <script src="https://unpkg.com/mermaid@10.6.1/dist/mermaid.min.js"></script>
        <script>
          mermaid.initialize({ startOnLoad: true });
        </script>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Rapport d'Analyse de Projet Solaire</h1>
            <p><strong>Projet:</strong> ${projectDetails.projectName}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString(
              "fr-FR"
            )}</p>
            <p><strong>Type de Système:</strong> ${systemType}</p>
            <p><strong>Tension du Système:</strong> ${
              systemParameters.systemVoltage
            }V</p>
            <p><strong>Coefficient K:</strong> ${
              systemParameters.coefficientK
            }</p>
          </div>

          <div class="section">
            <h2>Analyse Financière et Économies</h2>
            <h3>Estimation de la Facture Eneo Actuelle</h3>
            <p>Consommation mensuelle: ${formatNumber(totalKwh)} kWh</p>
            <p>Montant Total Estimé (TTC): ${formatCurrency(
              billDetails.totalCost
            )}</p>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Élément</th>
                  <th>Montant</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Coût de la consommation</td><td>${formatCurrency(
                  billDetails.consumptionCost
                )}</td></tr>
                <tr><td>Redevance Fixe</td><td>${formatCurrency(
                  billDetails.fixedFee
                )}</td></tr>
                <tr><td>TVA (19.25%)</td><td>${formatCurrency(
                  billDetails.vatAmount
                )}</td></tr>
                <tr><td>Taxe municipale</td><td>${formatCurrency(
                  billDetails.municipalTax
                )}</td></tr>
                <tr><td>Droit de timbre</td><td>${formatCurrency(
                  billDetails.stampDuty
                )}</td></tr>
              </tbody>
            </table>

            <h3>Détail des Coûts par Appareil</h3>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Appareil</th>
                  <th>Coût / jour</th>
                  <th>Coût / semaine</th>
                  <th>Coût / mois</th>
                </tr>
              </thead>
              <tbody>
                ${applianceCostBreakdown
                  .map(
                    (item: any) =>
                      `<tr>
                    <td>${item.name}</td>
                    <td>${formatCurrency(item.dailyCost)}</td>
                    <td>${formatCurrency(item.weeklyCost)}</td>
                    <td>${formatCurrency(item.monthlyCost)}</td>
                  </tr>`
                  )
                  .join("")}
              </tbody>
            </table>

            <h3>Analyse de l'Investissement Solaire</h3>
            <h4>Détail du Coût du Système</h4>
            <table class="data-table">
              <tbody>
                <tr><td>Coût des Panneaux (${panelsNeeded} unités)</td><td>${formatCurrency(
      estimatedPanelCost
    )}</td></tr>
                ${
                  systemType !== "grid-tied"
                    ? `<tr><td>Coût des Batteries (${formatNumber(
                        Math.round(batteryCapacityAh)
                      )} Ah)</td><td>${formatCurrency(
                        estimatedBatteryCost
                      )}</td></tr>`
                    : ""
                }
                <tr><td>Coût de l'Onduleur (${inverterSizeKw} kW)</td><td>${formatCurrency(
      estimatedInverterCost
    )}</td></tr>
                <tr><td>Coût du Régulateur de Charge (${chargeControllerRating} A)</td><td>${formatCurrency(
      estimatedControllerCost
    )}</td></tr>
                <tr><td><strong>Coût Total Estimé</strong></td><td><strong>${formatCurrency(
                  totalSystemCost
                )}</strong></td></tr>
              </tbody>
            </table>

            ${
              systemType !== "off-grid"
                ? `
            <h4>Bénéfices Financiers</h4>
            <p>Économies annuelles estimées: ${formatCurrency(
              annualSavings
            )}</p>
            <p>Retour sur investissement: ${roiYears} ans</p>
            `
                : `
            <h4>Indépendance Énergétique et Bénéfices Financiers</h4>
            <p>Ce système vous affranchit du réseau Eneo, vous protégeant des coupures et des hausses de tarifs.</p>
            <p>Équivalent d'économies annuelles: ${formatCurrency(
              annualSavings
            )}</p>
            <p>Retour sur investissement estimé: ${roiYears} ans</p>
            `
            }
          </div>

          <div class="section">
            <h2>Analyse du Système Recommandé</h2>
            <table class="data-table">
              <tbody>
                <tr><td>Panneaux requis</td><td>${formatNumber(
                  panelsNeeded
                )}</td></tr>
                <tr><td>Taille de l'Onduleur</td><td>${inverterSizeKw} kW</td></tr>
                <tr><td>Régulateur de Charge</td><td>${formatNumber(
                  chargeControllerRating
                )} A</td></tr>
                <tr><td>Capacité des Batteries</td><td>${
                  systemType !== "grid-tied"
                    ? formatNumber(Math.round(batteryCapacityAh)) + " Ah"
                    : "N/A"
                }</td></tr>
                ${
                  systemType !== "grid-tied"
                    ? `
                <tr><td>Batteries en série (NBS)</td><td>${formatNumber(
                  results.batteriesInSeries
                )}</td></tr>
                <tr><td>Batteries en parallèle (NBP)</td><td>${formatNumber(
                  results.batteriesInParallel
                )}</td></tr>
                <tr><td>Nombre total de batteries</td><td>${formatNumber(
                  results.totalBatteries
                )}</td></tr>
                `
                    : ""
                }
              </tbody>
            </table>

            <h3>Puissance et Énergie</h3>
            <table class="data-table">
              <tbody>
                <tr><td>Puissance Crête (PC)</td><td>${formatNumber(
                  Math.round(results.peakPowerW)
                )} W</td></tr>
                <tr><td>Énergie Produite</td><td>${formatNumber(
                  results.energyProduced
                )} kWh/jour</td></tr>
              </tbody>
            </table>

            <h3>Diagramme du Système</h3>
            <div class="mermaid">${systemDiagram}</div>
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
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    // Add a small delay to allow Mermaid to initialize and render
    // Instead of waiting for a specific function that might not be available
    try {
      // Add the mermaid initialization script directly
      await page.evaluate(() => {
        // Add type assertion for mermaid on window
        const win = window as any;
        if (typeof win.mermaid !== "undefined") {
          win.mermaid.init();
        }
      });

      // Add a reasonable delay to allow rendering
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.warn("Mermaid initialization warning:", error);
      // Continue anyway - we'll still generate the PDF even if Mermaid fails
    }

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20mm",
        right: "20mm",
        bottom: "20mm",
        left: "20mm",
      },
    });

    await browser.close();

    // Convert Uint8Array to Buffer for proper handling in Response
    const buffer = Buffer.from(pdfBuffer);

    // Fix the NextResponse type issue
    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${projectDetails.projectName.replace(
          /\s/g,
          "_"
        )}_Rapport_Solaire.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF." },
      { status: 500 }
    );
  }
}
