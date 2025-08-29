import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';

interface DataPoint {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  title: string;
  data: DataPoint[];
  className?: string;
  centerText?: string;
  centerValue?: string | number;
}

export default function DonutChart({ title, data, className, centerText, centerValue }: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  // Calculate angles for each segment
  let currentAngle = 0;
  const segments = data.map(item => {
    const angle = (item.value / total) * 360;
    const segment = {
      ...item,
      startAngle: currentAngle,
      angle: angle,
      percentage: ((item.value / total) * 100).toFixed(1)
    };
    currentAngle += angle;
    return segment;
  });

  // SVG path generator for donut segments
  const createPath = (centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(centerX, centerY, radius, endAngle);
    const end = polarToCartesian(centerX, centerY, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    
    return [
      "M", start.x, start.y, 
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(" ");
  };

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  const size = 120;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          {/* Chart */}
          <div className="relative">
            <svg width={size} height={size} className="transform -rotate-90">
              {/* Background circle */}
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth={strokeWidth}
              />
              
              {/* Data segments */}
              {segments.map((segment, index) => {
                const startAngle = segment.startAngle;
                const endAngle = segment.startAngle + segment.angle;
                
                if (segment.value === 0) return null;
                
                return (
                  <circle
                    key={index}
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    stroke={segment.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${(segment.angle / 360) * (2 * Math.PI * radius)} ${2 * Math.PI * radius}`}
                    strokeDashoffset={`-${(startAngle / 360) * (2 * Math.PI * radius)}`}
                    className="transition-all duration-500"
                  />
                );
              })}
            </svg>
            
            {/* Center text */}
            {(centerText || centerValue) && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  {centerValue && (
                    <div className="text-2xl font-bold">{centerValue}</div>
                  )}
                  {centerText && (
                    <div className="text-xs text-muted-foreground">{centerText}</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-2">
            {segments.map((segment, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: segment.color }}
                  />
                  <span className="text-muted-foreground">{segment.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{segment.value}</span>
                  <Badge variant="outline" className="text-xs">
                    {segment.percentage}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
