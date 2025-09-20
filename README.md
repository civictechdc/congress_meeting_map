# 🏛️ Congressional Hackathon Breakout Explorer

LIVE: https://civictechdc.github.io/congress_meeting_map/

Made by Civic Tech DC
- Michael Deeb (mdeeb@civictechdc.org)

An interactive knowledge graph visualization that transforms congressional hackathon breakout discussions into an explorable, intuitive interface. Built with React, TypeScript, D3.js, and Tailwind CSS.

## 🧪 How This Was Made

- Prototyping: Early concepts and the [`data_analysis/idea.md`](data_analysis/idea.md) brief were drafted in Gemini. The static prototype in [`data_analysis/`](data_analysis/) was bootstrapped from those notes in gemini.
- Data analysis: Dataset exploration and JSON‑LD shaping were performed using a mix of Gemini and ChatGPT, with artifacts preserved under [`data_analysis/data/`](data_analysis/data/), [`data_analysis/raw_data/`](data_analysis/raw_data/), and [`data_analysis/schemas/`](data_analysis/schemas/).
- Explorer build: The Vite + React + TypeScript explorer in [`congressional-insight-explorer/`](congressional-insight-explorer/) was built in Cursor, leveraging Claude Opus (thinking mode) during initial scaffolding and design iteration, then refined through GPT‑5 Codex via Codex for code improvements and polish.
- Provenance: This README and AGENTS.md document the repo layout and workflow. Commit messages follow conventional commits to reflect iteration stages.


## 🚀 Features

- **Interactive Force-Directed Graph**: Visualize the relationships between different discussion topics
- **Progressive Disclosure**: Start with high-level themes and drill down into specific conversations
- **Rich Detail Views**: Explore key ideas, discussion threads, and individual comments
- **Smooth Animations**: Framer Motion-powered transitions for a polished user experience
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Real Congressional Data**: Based on actual committee discussions about modernizing Congress

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn

## 🛠️ Installation

1. Clone the repository:
```bash
cd congressional-insight-explorer
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:5173](http://localhost:5173) in your browser

## 🏗️ Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## 🌍 Deployment

This project ships with a GitHub Actions workflow (`.github/workflows/deploy.yml`) that publishes the site to GitHub Pages.

1. In the repository settings, set **Pages → Source** to **GitHub Actions** (required on the first deployment).
2. Push to the `main` branch or trigger the `Deploy to GitHub Pages` workflow manually.
3. The workflow installs dependencies, builds the Vite site, and deploys the contents of `dist/` to the `github-pages` environment.

The build uses the `BASE_PATH` environment variable so that assets resolve correctly when served from `https://<user>.github.io/<repository>/`. Custom domains can override this by setting a different `BASE_PATH` value in the workflow or repository secrets.

## 🎯 Usage

### Exploring the Graph
- **Click** on nodes to view detailed information in the side panel
- **Hover** over nodes to see descriptions and highlight connections
- **Drag** nodes to rearrange the graph layout
- **Zoom** in/out using mouse wheel or touchpad gestures

### Understanding the Visualization
- **Node Size**: Larger nodes indicate more discussion activity (more comments)
- **Node Colors**: Each topic cluster has a distinct color for easy identification
- **Edge Labels**: Show the type of relationship between topics
- **Edge Thickness**: Indicates the strength of the connection

## 🗂️ Project Structure

Top-level folders:
- `congressional-insight-explorer/`: Main Vite + React application described below.
- `data_analysis/`: Primary data analysis and prototype preserved for reference.

### Data Analysis and Prototype (`data_analysis/`)
- The `data/`, `raw_data/`, and `schemas/` folders contain source datasets that informed the live explorer.
- `app.js` and `index.html` compose a quick static prototype that loads the breakout JSON-LD without a build step.
- `styles.css` is the original Tailwind CSS file that guided the transition to the Vite app.
- `idea.md` stores the original product brief written by Gemini and guided the transition to the Vite app.

Structure within `congressional-insight-explorer/src/`:
```
components/
├── Graph/           # D3.js force-directed graph components
├── DetailPane/      # Cluster details, threads, and comments
└── Layout/          # Header and control components
lib/
├── data-processor.ts # JSON-LD to graph data transformation
├── store.ts         # Zustand state management
├── types.ts         # TypeScript type definitions
└── utils.ts         # Utility functions
data/
└── data.jsonld      # Congressional discussion data
styles/
└── index.css        # Tailwind CSS and custom styles
```

## 🔧 Technology Stack

- **React 18**: UI framework
- **TypeScript**: Type safety and better developer experience
- **D3.js v7**: Force-directed graph visualization
- **Tailwind CSS**: Utility-first styling
- **Framer Motion**: Smooth animations
- **Zustand**: Lightweight state management
- **Vite**: Fast build tool

## 📊 Data Schema

The application uses JSON-LD formatted data representing:
- **Clusters**: High-level topic groupings
- **Ideas**: Key points within each cluster
- **Threads**: Discussion topics with summaries
- **Comments**: Individual statements with timestamps and speakers
- **Edges**: Relationships between clusters

## 🎨 Design System

- **Colors**: Congressional blue theme with cluster-specific accent colors
- **Typography**: Inter for headings, Source Sans Pro for body text
- **Spacing**: Consistent 4px grid system
- **Shadows**: Subtle elevation for depth

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

MIT License - feel free to use this project for your own purposes.