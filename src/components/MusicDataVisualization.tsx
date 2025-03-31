import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { motion, useAnimation } from 'framer-motion';
import theme from '../styles/theme';
import { Chart, ChartData, ChartOptions, registerables } from 'chart.js';

Chart.register(...registerables);

interface DataVisualizationProps {
  type: 'bar' | 'pie' | 'line' | 'radar';
  data: ChartData;
  options?: ChartOptions;
  title?: string;
  description?: string;
  isVisible?: boolean;
}

const VisualizationContainer = styled(motion.div)`
  background-color: ${theme.colors.background.card};
  border-radius: ${theme.borderRadius.lg};
  padding: ${theme.spacing.lg};
  margin: ${theme.spacing.lg} 0;
  box-shadow: ${theme.shadows.md};
  width: 100%;
`;

const Title = styled.h3`
  font-size: ${theme.typography.sizes.lg};
  margin-bottom: ${theme.spacing.sm};
  color: ${theme.colors.text.primary};
`;

const Description = styled.p`
  color: ${theme.colors.text.secondary};
  margin-bottom: ${theme.spacing.lg};
  font-size: ${theme.typography.sizes.sm};
`;

const ChartContainer = styled.div`
  height: 300px;
  width: 100%;
  position: relative;
`;

const MusicDataVisualization: React.FC<DataVisualizationProps> = ({
  type,
  data,
  options = {},
  title,
  description,
  isVisible = true,
}) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const controls = useAnimation();
  
  useEffect(() => {
    if (isVisible) {
      controls.start({
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: "easeOut" }
      });
    }
  }, [isVisible, controls]);
  
  useEffect(() => {
    if (chartRef.current) {
      // Destroy previous chart instance to prevent memory leaks
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
      
      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        // Deep clone the data to avoid mutations
        const clonedData = JSON.parse(JSON.stringify(data));
        
        // Set default options based on chart type
        const defaultOptions: ChartOptions = {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 1500,
            easing: 'easeOutQuart',
          },
          plugins: {
            legend: {
              labels: {
                color: theme.colors.text.primary,
                font: {
                  family: theme.typography.fontFamily,
                },
              },
            },
            tooltip: {
              backgroundColor: theme.colors.background.secondary,
              titleColor: theme.colors.text.primary,
              bodyColor: theme.colors.text.secondary,
              borderColor: theme.colors.primary,
              borderWidth: 1,
              cornerRadius: 6,
              titleFont: {
                family: theme.typography.fontFamily,
                weight: theme.typography.fontWeights.bold.toString(),
              },
              bodyFont: {
                family: theme.typography.fontFamily,
              },
              padding: 10,
            },
          },
          scales: type !== 'pie' && type !== 'radar' ? {
            x: {
              grid: {
                color: 'rgba(255, 255, 255, 0.1)',
              },
              ticks: {
                color: theme.colors.text.secondary,
              },
            },
            y: {
              grid: {
                color: 'rgba(255, 255, 255, 0.1)',
              },
              ticks: {
                color: theme.colors.text.secondary,
              },
            },
          } : {},
        };
        
        // Merge provided options with defaults
        const mergedOptions = {
          ...defaultOptions,
          ...options,
        };
        
        chartInstance.current = new Chart(ctx, {
          type,
          data: clonedData,
          options: mergedOptions,
        });
      }
    }
    
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data, options, type]);

  return (
    <VisualizationContainer
      initial={{ opacity: 0, y: 50 }}
      animate={controls}
    >
      {title && <Title>{title}</Title>}
      {description && <Description>{description}</Description>}
      <ChartContainer>
        <canvas ref={chartRef} />
      </ChartContainer>
    </VisualizationContainer>
  );
};

export default MusicDataVisualization; 