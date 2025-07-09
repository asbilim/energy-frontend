# SolarCal: Solar PV System Calibration Application

SolarCal is a professional-grade solar PV system calibration application designed to help users design optimal solar systems based on their energy needs and environmental conditions. This application provides a comprehensive calibration workflow with an intuitive user interface.

## Features

*   **Energy Consumption Calculator:** Manual device input and automatic daily consumption calculation.
*   **System Type Selection:** Choose between off-grid (standalone) and grid-connected systems.
*   **Environmental Data Collection:** Location-specific solar irradiation and temperature data.
*   **Automatic Component Sizing:** Automated sizing for panels, batteries, charge controllers, and inverters.
*   **Comprehensive Results Display:** Detailed results with visualizations and component specifications.
*   **Project Management:** Save and load project capabilities.
*   **PDF Export:** Export detailed reports in PDF format.
*   **Responsive Design:** Works seamlessly across all devices (mobile, tablet, desktop).

## Design Elements

*   **Color System:** Clean and professional color palette with primary blue (#0ea5e9), secondary green (#22c55e), amber accent (#f59e0b), plus success, alert, and error states.
*   **Visuals:** Solar-themed visual elements with subtle sunny animations.
*   **Information Hierarchy:** Clear information prioritization with a progressive workflow.
*   **Interactive Calculators:** Real-time feedback for interactive calculations.
*   **Modular Design:** Card-based component design for modular information display.
*   **Intuitive Navigation:** Easy navigation through the calibration process.

## Technologies Used

*   Next.js
*   React
*   TypeScript
*   Tailwind CSS
*   Shadcn UI
*   OpenRouter (for AI operations)

## Getting Started

Follow these steps to set up and run the project locally:

### Prerequisites

*   Node.js (v18 or later)
*   npm or Yarn

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd energy
    ```
2.  Install dependencies:
    ```bash
    npm install
    # or
    yarn install
    ```

### Running the Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Project Instructions (for Contributors)

This section outlines the core objectives for contributors to the Solar PV System Calibration Application:

1.  **Develop a comprehensive PV system calibration application** that assists users in designing optimal photovoltaic systems.
2.  **Implement a step-by-step workflow** guiding users from documenting energy needs to generating detailed system specifications.
3.  **Integrate sophisticated calculation algorithms** for accurate component sizing based on industry-standard formulas, considering factors like solar irradiation, temperature effects, and autonomy days.
4.  **Ensure a modular architecture** for high performance, maintainability, and organized code.
5.  **Enable users to save projects, compare configurations, and export detailed reports** including component specifications and cost estimations.