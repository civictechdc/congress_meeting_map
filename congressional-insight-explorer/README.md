# 🏛️ Congressional Insight Explorer

An interactive knowledge graph visualization that transforms congressional committee discussions into an explorable, intuitive interface. Built with React, TypeScript, D3.js, and Tailwind CSS.

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

```
src/
├── components/
│   ├── Graph/           # D3.js force-directed graph components
│   ├── DetailPane/      # Cluster details, threads, and comments
│   └── Layout/          # Header and control components
├── lib/
│   ├── data-processor.ts # JSON-LD to graph data transformation
│   ├── store.ts         # Zustand state management
│   ├── types.ts         # TypeScript type definitions
│   └── utils.ts         # Utility functions
├── data/
│   └── data.jsonld      # Congressional discussion data
└── styles/
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

## 🙏 Acknowledgments

- Data sourced from Congressional Hackathon discussions
- Inspired by modern data visualization best practices
- Built for improving congressional transparency and understanding