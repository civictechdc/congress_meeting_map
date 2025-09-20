import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { GraphData, GraphNode, GraphEdge } from '../../lib/types';
import { useStore } from '../../lib/store';
import { motion } from 'framer-motion';

const LABEL_BIAS_DEFAULT = 0.38;
const LABEL_BIAS_MULTI = 0.32;
const LABEL_BIAS_HUB = 0.26;
const CURVE_SCALE_MULTI = 1.6;
const CURVE_SCALE_HUB = 1.2;
const HUB_LABEL_OFFSET_SCALE = 1.05;
const EDGE_COLOR_PALETTE = [
  '#0ea5e9',
  '#22c55e',
  '#f97316',
  '#a855f7',
  '#ec4899',
  '#14b8a6',
  '#facc15',
  '#ef4444',
  '#6366f1',
  '#8b5cf6',
  '#fb7185',
  '#2dd4bf'
];

// Layout spacing controls
const LINK_DISTANCE = 620; // increase to spread nodes along links
const CHARGE_STRENGTH = -2200; // stronger repulsion between nodes
const COLLISION_PADDING = 80; // extra padding around node radius

const clamp = (value: number) => Math.max(0, Math.min(255, value));

const adjustHexColor = (hex: string, amount: number) => {
  const sanitized = hex.replace('#', '');
  if (sanitized.length !== 6 && sanitized.length !== 3) return hex;
  const normalized = sanitized.length === 3
    ? sanitized.split('').map((char) => char + char).join('')
    : sanitized;

  const num = parseInt(normalized, 16);
  if (Number.isNaN(num)) return hex;

  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;

  const adjust = (channel: number) => clamp(Math.round(channel + amount * 255));

  const newR = adjust(r);
  const newG = adjust(g);
  const newB = adjust(b);

  return `#${((newR << 16) | (newG << 8) | newB).toString(16).padStart(6, '0')}`;
};

const lightenColor = (hex: string, amount = 0.2) => adjustHexColor(hex, Math.abs(amount));
const darkenColor = (hex: string, amount = 0.2) => adjustHexColor(hex, -Math.abs(amount));

interface ForceDirectedGraphProps {
  data: GraphData;
}

export const ForceDirectedGraph: React.FC<ForceDirectedGraphProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const simulationRef = useRef<d3.Simulation<GraphNode, GraphEdge> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const initializedRef = useRef(false);
  const edgesRef = useRef<GraphEdge[]>([]);
  const edgeColorMapRef = useRef<Record<string, string>>({});
  const edgeColorIndexRef = useRef(0);

  const { 
    selectedClusterId, 
    hoveredClusterId, 
    selectedEdgeId, 
    hoveredEdgeId, 
    setSelectedCluster, 
    setHoveredCluster,
    setSelectedEdge,
    setHoveredEdge 
  } = useStore();

  const ready = dimensions.width > 0 && dimensions.height > 0;

  // Build the graph once when ready or when data changes
  useEffect(() => {
    if (!svgRef.current || !data.nodes.length || !ready) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Add arrowhead marker definition
    svg.append('defs')
      .append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 8)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#64748b');

    const g = svg.append('g');
    const linksGroup = g.append('g').attr('class', 'links');
    const nodesGroup = g.append('g').attr('class', 'nodes');
    g.append('g').attr('class', 'link-labels'); // Labels handled by useEffect
    const nodeLabelsGroup = g.append('g').attr('class', 'node-labels');

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);
    zoomRef.current = zoom;

    // Click on empty space to clear selections
    svg.on('click', (event) => {
      // Only clear if clicking on background (not on nodes or edges)
      if (event.target === event.currentTarget) {
        setSelectedCluster(null);
        setSelectedEdge(null);
      }
    });

    const simulation = d3
      .forceSimulation<GraphNode>()
      .force(
        'link',
        d3
          .forceLink<GraphNode, GraphEdge>()
          .id((d) => d.id)
          .distance(LINK_DISTANCE)
          .strength(0.25)
      )
      .force(
        'charge',
        d3.forceManyBody().strength(CHARGE_STRENGTH).distanceMin(120).distanceMax(1400)
      )
      .force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2))
      .force('collision', d3.forceCollide<GraphNode>().radius((d) => d.size + COLLISION_PADDING));

    simulationRef.current = simulation;
    initializedRef.current = true;

    // Links - use paths instead of lines for curves
    const previousColorMap = edgeColorMapRef.current;
    let nextColorIndex = edgeColorIndexRef.current;
    const nextColorMap: Record<string, string> = {};

    const edgesWithIds = data.edges.map((edge, index) => {
      const id = edge.id || `edge-${edge.source}-${edge.target}-${index}`;
      const colorKey = `${edge.source}-${edge.target}-${edge.relation}`;
      let color = edge.color || previousColorMap[colorKey];
      if (!color) {
        color = EDGE_COLOR_PALETTE[nextColorIndex % EDGE_COLOR_PALETTE.length];
        nextColorIndex += 1;
      }
      nextColorMap[colorKey] = color;
      return {
        ...edge,
        id,
        color
      };
    });

    edgeColorMapRef.current = nextColorMap;
    edgeColorIndexRef.current = nextColorIndex;

    edgesRef.current = edgesWithIds;
    
    const linkGroups = linksGroup
      .selectAll<SVGGElement, GraphEdge>('g.edge-group')
      .data(edgesWithIds, (d) => d.id || `edge-${d.source}-${d.target}`)
      .join(
        (enter) => {
          const gEnter = enter.append('g').attr('class', 'edge-group');
          gEnter.append('path').attr('class', 'edge-hit');
          gEnter.append('path').attr('class', 'edge-visible');
          return gEnter;
        },
        (update) => update,
        (exit) => {
          exit.remove();
          return exit;
        }
      );

    const linkHit = linkGroups
      .select<SVGPathElement>('path.edge-hit')
      .attr('fill', 'none')
      .attr('stroke', '#000000')
      .attr('stroke-opacity', 0.001)
      .attr('stroke-width', (d) => Math.max(18, d.strength * 12))
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round')
      .style('cursor', 'pointer')
      .style('pointer-events', 'stroke')
      .on('click', (event, d) => {
        event.stopPropagation();
        const edgeId = d.id || `edge-${d.source}-${d.target}`;
        setSelectedEdge(edgeId === selectedEdgeId ? null : edgeId);
      })
      .on('mouseenter', (_, d) => setHoveredEdge(d.id || `edge-${d.source}-${d.target}`))
      .on('mouseleave', () => setHoveredEdge(null));

    const linkVisible = linkGroups
      .select<SVGPathElement>('path.edge-visible')
      .attr('stroke', (d) => d.color || (d.isHub ? '#52525b' : '#64748b'))
      .attr('stroke-width', (d) => Math.max(1.25, d.strength * 2))
      .attr('stroke-opacity', (d) => (d.isHub ? 0.55 : d.isMultiple ? 0.65 : 0.75))
      .attr('fill', 'none')
      .attr('marker-end', 'url(#arrowhead)')
      .attr('stroke-dasharray', (d) => d.isHub ? '3,3' : null)
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round')
      .style('pointer-events', 'none');

    // Nodes
    const node = nodesGroup
      .selectAll<SVGCircleElement, GraphNode>('circle')
      .data(data.nodes)
      .join('circle')
      .attr('r', (d) => d.size)
      .attr('fill', (d) => d.color)
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('click', (_, d) => setSelectedCluster(d.id === selectedClusterId ? null : d.id))
      .on('mouseenter', (_, d) => setHoveredCluster(d.id))
      .on('mouseleave', () => setHoveredCluster(null));

    // Edge labels will be handled by useEffect for dynamic updates

    const initialPath = (edge: GraphEdge) => {
      const source = edge.source as any;
      const target = edge.target as any;
      const sourceNode = data.nodes.find((n) => n.id === source);
      const targetNode = data.nodes.find((n) => n.id === target);

      if (
        sourceNode &&
        targetNode &&
        typeof sourceNode.x === 'number' &&
        typeof sourceNode.y === 'number' &&
        typeof targetNode.x === 'number' &&
        typeof targetNode.y === 'number'
      ) {
        return `M ${sourceNode.x} ${sourceNode.y} L ${targetNode.x} ${targetNode.y}`;
      }

      return 'M 0 0 L 0 0';
    };

    linkVisible.attr('d', initialPath);
    linkHit.attr('d', initialPath);

    // Node labels (simple, centered below nodes)
    const labels = nodeLabelsGroup
      .selectAll<SVGTextElement, GraphNode>('text.node-label')
      .data(data.nodes)
      .join('text')
      .attr('class', 'node-label')
      .attr('font-size', '12px')
      .attr('font-weight', '600')
      .attr('text-anchor', 'middle')
      .attr('dy', (d) => d.size + 14)
      .attr('fill', '#1f2937')
      .text((d) => d.name);

    // Drag
    node.call(
      d3
        .drag<SVGCircleElement, GraphNode>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
    );

    // Initial layout placement (wider radial spread)
    const radius = Math.min(dimensions.width, dimensions.height) * 0.45;
    data.nodes.forEach((n, i) => {
      const angle = (i / data.nodes.length) * Math.PI * 2;
      n.x = dimensions.width / 2 + Math.cos(angle) * radius * 1.45;
      n.y = dimensions.height / 2 + Math.sin(angle) * radius * 1.45;
    });

    // Helper function to create curved path
    const createPath = (d: GraphEdge) => {
      const source = d.source as any;
      const target = d.target as any;
      
      // Check if coordinates are available
      if (!source || !target || 
          typeof source.x !== 'number' || typeof source.y !== 'number' ||
          typeof target.x !== 'number' || typeof target.y !== 'number') {
        return 'M 0 0 L 0 0'; // Return minimal valid path if coordinates not ready
      }
      
      const sx = source.x;
      const sy = source.y;
      const tx = target.x;
      const ty = target.y;

      // For straight edges or single edges
      const baseOffset = d.curveOffset || 0;

      if (!d.isMultiple || !d.curveOffset) {
        return `M ${sx} ${sy} L ${tx} ${ty}`;
      }

      const dx = tx - sx;
      const dy = ty - sy;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Avoid division by zero
      if (distance === 0) {
        return `M ${sx} ${sy} L ${tx} ${ty}`;
      }
      
      let mx, my;
      
      if (d.isHub && d.hubTotal && d.hubTotal > 3) {
        // Hub node: create fan-like curves
        const midX = (sx + tx) / 2;
        const midY = (sy + ty) / 2;
        
        // Create control point that fans out from the hub
        const angle = Math.atan2(dy, dx);
        const perpAngle = angle + Math.PI / 2;
        const offset = baseOffset * CURVE_SCALE_HUB;
        
        mx = midX + Math.cos(perpAngle) * offset;
        my = midY + Math.sin(perpAngle) * offset;
      } else {
        // Multiple edges between same pair: perpendicular offset
        const offsetRatio = (baseOffset * CURVE_SCALE_MULTI) / distance;
        mx = (sx + tx) / 2 - dy * offsetRatio;
        my = (sy + ty) / 2 + dx * offsetRatio;
      }

      return `M ${sx} ${sy} Q ${mx} ${my} ${tx} ${ty}`;
    };

    // Tick
    simulation.on('tick', () => {
      // Update curved paths and hit areas
      linkVisible.attr('d', createPath);
      linkHit.attr('d', createPath);

      // Update nodes with coordinate safety checks
      node
        .attr('cx', (d) => typeof d.x === 'number' ? d.x : 0)
        .attr('cy', (d) => typeof d.y === 'number' ? d.y : 0);
      
      // Update labels with coordinate safety checks  
      labels
        .attr('x', (d) => typeof d.x === 'number' ? d.x : 0)
        .attr('y', (d) => typeof d.y === 'number' ? d.y : 0);

      // Position edge label groups at curve midpoints
      svg.selectAll<SVGGElement, GraphEdge>('g.link-label-group')
        .attr('transform', (d) => {
          const source = d.source as GraphNode;
          const target = d.target as GraphNode;

          if (
            !source ||
            !target ||
            typeof source.x !== 'number' ||
            typeof source.y !== 'number' ||
            typeof target.x !== 'number' ||
            typeof target.y !== 'number'
          ) {
            return 'translate(0, 0)';
          }

          const sx = source.x;
          const sy = source.y;
          const tx = target.x;
          const ty = target.y;

          const bias = d.isHub ? LABEL_BIAS_HUB : d.isMultiple ? LABEL_BIAS_MULTI : LABEL_BIAS_DEFAULT;

          const baseOffset = d.curveOffset || 0;

          if (!d.isMultiple || !d.curveOffset) {
            const x = sx + (tx - sx) * bias;
            const y = sy + (ty - sy) * bias;
            return `translate(${x}, ${y})`;
          }

          const dx = tx - sx;
          const dy = ty - sy;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance === 0) {
            return `translate(${sx}, ${sy})`;
          }

          let mx: number;
          let my: number;

          if (d.isHub && d.hubTotal && d.hubTotal > 3) {
            const midX = (sx + tx) / 2;
            const midY = (sy + ty) / 2;
            const angle = Math.atan2(dy, dx);
            const perpAngle = angle + Math.PI / 2;
            const offset = baseOffset * HUB_LABEL_OFFSET_SCALE;
            mx = midX + Math.cos(perpAngle) * offset;
            my = midY + Math.sin(perpAngle) * offset;
          } else {
            const offsetRatio = (baseOffset * CURVE_SCALE_MULTI) / distance;
            mx = (sx + tx) / 2 - dy * offsetRatio;
            my = (sy + ty) / 2 + dx * offsetRatio;
          }

          const oneMinusT = 1 - bias;
          const x = oneMinusT * oneMinusT * sx + 2 * oneMinusT * bias * mx + bias * bias * tx;
          const y = oneMinusT * oneMinusT * sy + 2 * oneMinusT * bias * my + bias * bias * ty;
          return `translate(${x}, ${y})`;
        });
    });

    simulation.nodes(data.nodes);
    (simulation.force('link') as d3.ForceLink<GraphNode, GraphEdge>).links(edgesWithIds);
    simulation.alpha(0.6).restart();

    return () => {
      simulation.stop();
      svg.selectAll('*').remove();
      edgesRef.current = [];
    };
  }, [data, ready]);

  // Smoothly update forces when dimensions change (avoid rebuild jitter)
  useEffect(() => {
    const sim = simulationRef.current;
    if (!sim || !initializedRef.current || !ready) return;
    const t = setTimeout(() => {
      sim.force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2));
      sim.alpha(0.15).restart();
    }, 120);
    return () => clearTimeout(t);
  }, [dimensions.width, dimensions.height, ready]);

  // Update selected styling in a tiny, focused pass
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg
      .selectAll<SVGCircleElement, GraphNode>('circle')
      .attr('stroke', (d) => (selectedClusterId && d.id === selectedClusterId ? '#1e3a8a' : '#ffffff'))
      .attr('stroke-width', (d) => (selectedClusterId && d.id === selectedClusterId ? 4 : 2));
  }, [selectedClusterId]);

  // Update edge styling for selection and hover
  useEffect(() => {
    if (!ready || !svgRef.current) return;
    const svg = d3.select(svgRef.current);
    
    // Update edge styles
    svg
      .select<SVGGElement>('g.links')
      .selectAll<SVGPathElement, GraphEdge>('path.edge-visible')
      .attr('stroke', (d) => {
        if (!d) return '#64748b';
        const baseColor = d.color || (d.isHub ? '#52525b' : '#64748b');
        const edgeId = d.id || `edge-${d.source}-${d.target}`;
        if (selectedEdgeId && edgeId === selectedEdgeId) return darkenColor(baseColor, 0.15);
        if (hoveredEdgeId && edgeId === hoveredEdgeId) return lightenColor(baseColor, 0.2);
        return baseColor;
      })
      .attr('stroke-width', (d) => {
        if (!d) return 1;
        const edgeId = d.id || `edge-${d.source}-${d.target}`;
        if (selectedEdgeId && edgeId === selectedEdgeId) return Math.max(3.6, d.strength * 3.3);
        if (hoveredEdgeId && edgeId === hoveredEdgeId) return Math.max(2.8, d.strength * 2.7);
        return Math.max(1.25, d.strength * 2);
      })
      .attr('stroke-opacity', (d) => {
        if (!d) return 0.7;
        const edgeId = d.id || `edge-${d.source}-${d.target}`;
        if (selectedEdgeId && edgeId === selectedEdgeId) return 0.96;
        if (hoveredEdgeId && edgeId === hoveredEdgeId) return 0.86;
        return d.isHub ? 0.55 : d.isMultiple ? 0.65 : 0.75;
      });

    // Update edge labels
    const linkLabelsGroup = svg.select('g.link-labels');
    const edgeData = edgesRef.current;

    if (!edgeData.length) {
      linkLabelsGroup.selectAll('g.link-label-group').remove();
      return;
    }

    const linkLabelGroups = linkLabelsGroup
      .selectAll<SVGGElement, GraphEdge>('g.link-label-group')
      .data(edgeData, (d) => d.id || `edge-${d.source}-${d.target}`);

    // Remove old labels
    linkLabelGroups.exit().remove();

    // Add new label groups
    const newGroups = linkLabelGroups
      .enter()
      .append('g')
      .attr('class', 'link-label-group');

    // Add background rectangles
    newGroups
      .append('rect')
      .attr('class', 'label-background')
      .attr('fill', 'white')
      .attr('stroke', (d) => d.color || '#94a3b8')
      .attr('stroke-width', 1)
      .attr('rx', 4)
      .attr('opacity', 0.82);

    // Add text
    newGroups
      .append('text')
      .attr('class', 'link-label')
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .attr('fill', (d) => darkenColor(d.color || '#334155', 0.12))
      .attr('text-anchor', 'middle')
      .attr('pointer-events', 'none')
      .attr('dy', '0.35em');

    // Update all label groups (new + existing)
    const allGroups = newGroups.merge(linkLabelGroups);

    allGroups
      .style('pointer-events', 'all')
      .style('cursor', 'pointer')
      .on('mouseenter', (_, edge) => {
        const edgeId = edge.id || `edge-${edge.source}-${edge.target}`;
        setHoveredEdge(edgeId);
      })
      .on('mouseleave', () => setHoveredEdge(null))
      .on('click', (event, edge) => {
        event.stopPropagation();
        const edgeId = edge.id || `edge-${edge.source}-${edge.target}`;
        setSelectedEdge(edgeId === selectedEdgeId ? null : edgeId);
      })
      .select<SVGTextElement>('text.link-label')
      .text((d) => {
        const label = d.relation || '';
        const edgeId = d.id || `edge-${d.source}-${d.target}`;
        const maxLength = edgeId === selectedEdgeId ? 70 : edgeId === hoveredEdgeId ? 60 : 42;
        return label.length > maxLength ? `${label.substring(0, maxLength)}…` : label;
      })
      .attr('fill', (d) => {
        const baseColor = d.color || '#334155';
        const edgeId = d.id || `edge-${d.source}-${d.target}`;
        if (edgeId === selectedEdgeId) return darkenColor(baseColor, 0.25);
        if (edgeId === hoveredEdgeId) return lightenColor(baseColor, 0.2);
        return darkenColor(baseColor, 0.12);
      })
      .attr('font-weight', (d) => {
        const edgeId = d.id || `edge-${d.source}-${d.target}`;
        return edgeId === selectedEdgeId || edgeId === hoveredEdgeId ? '700' : '600';
      });

    allGroups
      .select('rect.label-background')
      .attr('pointer-events', 'all')
      .attr('stroke', (d) => {
        const baseColor = d.color || '#94a3b8';
        const edgeId = d.id || `edge-${d.source}-${d.target}`;
        if (edgeId === selectedEdgeId) return darkenColor(baseColor, 0.15);
        if (edgeId === hoveredEdgeId) return lightenColor(baseColor, 0.2);
        return baseColor;
      })
      .attr('stroke-width', (d) => {
        const edgeId = d.id || `edge-${d.source}-${d.target}`;
        return edgeId === selectedEdgeId ? 1.6 : edgeId === hoveredEdgeId ? 1.3 : 1;
      })
      .attr('opacity', (d) => {
        const edgeId = d.id || `edge-${d.source}-${d.target}`;
        return edgeId === selectedEdgeId ? 0.98 : edgeId === hoveredEdgeId ? 0.9 : 0.82;
      });

    // Size backgrounds to fit text
    allGroups.each(function () {
      const group = d3.select(this);
      const textElement = group.select('text').node() as SVGTextElement | null;
      if (!textElement) return;
      const bbox = textElement.getBBox();
      group
        .select('rect.label-background')
        .attr('width', bbox.width + 12)
        .attr('height', 20)
        .attr('x', -(bbox.width + 12) / 2)
        .attr('y', -10);
    });

  }, [selectedEdgeId, hoveredEdgeId, data.edges, ready]);

  // Basic resize handling (single source of truth for width/height)
  useEffect(() => {
    const measure = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const width = Math.max(400, Math.floor(rect.width));
      const height = Math.max(300, Math.floor(rect.height));
      setDimensions((prev) => (prev.width !== width || prev.height !== height ? { width, height } : prev));
    };

    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener('resize', measure);
    const t = setTimeout(measure, 100); // settle after layout

    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', measure);
      ro.disconnect();
    };
  }, []);

  // Zoom controls
  const handleZoomIn = () => {
    if (!svgRef.current || !zoomRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().call(zoomRef.current.scaleBy, 1.5);
  };

  const handleZoomOut = () => {
    if (!svgRef.current || !zoomRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().call(zoomRef.current.scaleBy, 1 / 1.5);
  };

  const handleResetZoom = () => {
    if (!svgRef.current || !zoomRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(750).call(zoomRef.current.transform, d3.zoomIdentity);
  };

  return (
    <motion.div
      ref={containerRef}
      className="w-full h-full relative bg-gray-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {dimensions.width && dimensions.height ? (
        <>
          <svg ref={svgRef} width={dimensions.width} height={dimensions.height} className="w-full h-full" />

          {/* Zoom Controls */}
          <div className="absolute top-4 right-4 flex flex-col space-y-1">
            <button
              onClick={handleZoomIn}
              className="bg-white p-2 rounded-md shadow-md hover:bg-gray-50 transition-colors"
              title="Zoom In"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <button
              onClick={handleZoomOut}
              className="bg-white p-2 rounded-md shadow-md hover:bg-gray-50 transition-colors"
              title="Zoom Out"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <button
              onClick={handleResetZoom}
              className="bg-white p-2 rounded-md shadow-md hover:bg-gray-50 transition-colors"
              title="Reset Zoom"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          {hoveredClusterId && (
            <div className="absolute top-4 left-4 bg-white p-3 rounded-lg shadow-lg max-w-sm">
              <p className="text-sm text-gray-600">
                {data.nodes.find((n) => n.id === hoveredClusterId)?.description}
              </p>
            </div>
          )}

          {hoveredEdgeId && (
            <div className="absolute top-4 left-4 bg-white p-3 rounded-lg shadow-lg max-w-sm">
              <div className="text-sm">
                {(() => {
                  const edgesWithIds = data.edges.map((edge, index) => ({
                    ...edge,
                    id: edge.id || `edge-${edge.source}-${edge.target}-${index}`
                  }));
                  const edge = edgesWithIds.find((e) => e.id === hoveredEdgeId);
                  if (!edge) return null;
                  const sourceNode = data.nodes.find((n) => n.id === edge.source);
                  const targetNode = data.nodes.find((n) => n.id === edge.target);
                  return (
                    <>
                      <div className="font-semibold text-gray-800 mb-2">
                        {sourceNode?.name} → {targetNode?.name}
                      </div>
                      <div className="text-gray-600">
                        {edge.relation}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary-blue border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading graph...</p>
          </div>
        </div>
      )}
    </motion.div>
  );
};
