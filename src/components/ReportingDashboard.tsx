import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  Target,
  Download,
  Filter,
  Calendar,
  DollarSign,
  Wrench,
  MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReportingDashboardProps {
  className?: string;
}

interface MetricCard {
  title: string;
  value: string;
  change: number;
  changeType: 'increase' | 'decrease';
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface ChartData {
  name: string;
  value: number;
  color?: string;
}

export default function ReportingDashboard({ className }: ReportingDashboardProps) {
  const [timeRange, setTimeRange] = useState('30d');
  const [loading, setLoading] = useState(true);

  // Mock data - in a real app, this would come from API
  const metrics: MetricCard[] = [
    {
      title: 'Total Tickets',
      value: '1,247',
      change: 12.5,
      changeType: 'increase',
      icon: BarChart3,
      color: 'text-blue-600'
    },
    {
      title: 'Resolution Rate',
      value: '89.2%',
      change: 5.3,
      changeType: 'increase',
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      title: 'Avg Resolution Time',
      value: '2.4h',
      change: -8.1,
      changeType: 'decrease',
      icon: Clock,
      color: 'text-orange-600'
    },
    {
      title: 'Critical Issues',
      value: '23',
      change: -15.2,
      changeType: 'decrease',
      icon: AlertTriangle,
      color: 'text-red-600'
    }
  ];

  const ticketsByStatus: ChartData[] = [
    { name: 'Open', value: 156, color: '#3b82f6' },
    { name: 'In Progress', value: 89, color: '#f59e0b' },
    { name: 'Resolved', value: 234, color: '#10b981' },
    { name: 'Verified', value: 167, color: '#8b5cf6' },
    { name: 'Closed', value: 601, color: '#6b7280' }
  ];

  const ticketsByPriority: ChartData[] = [
    { name: 'Low', value: 412, color: '#10b981' },
    { name: 'Medium', value: 356, color: '#f59e0b' },
    { name: 'High', value: 189, color: '#f97316' },
    { name: 'Critical', value: 23, color: '#ef4444' }
  ];

  const monthlyTrends = [
    { month: 'Jan', tickets: 98, resolved: 87, avgTime: 2.8 },
    { month: 'Feb', tickets: 112, resolved: 101, avgTime: 2.6 },
    { month: 'Mar', tickets: 134, resolved: 119, avgTime: 2.4 },
    { month: 'Apr', tickets: 145, resolved: 132, avgTime: 2.2 },
    { month: 'May', tickets: 167, resolved: 149, avgTime: 2.1 },
    { month: 'Jun', tickets: 189, resolved: 171, avgTime: 2.3 }
  ];

  const equipmentMetrics = [
    { name: 'HVAC Systems', tickets: 234, mtbf: 720, cost: 15420 },
    { name: 'Elevators', tickets: 89, mtbf: 2160, cost: 8900 },
    { name: 'Fire Safety', tickets: 45, mtbf: 4320, cost: 5600 },
    { name: 'Security Systems', tickets: 67, mtbf: 1440, cost: 7800 },
    { name: 'Electrical', tickets: 123, mtbf: 960, cost: 12100 }
  ];

  const engineerPerformance = [
    { name: 'John Smith', tickets: 87, resolved: 82, avgTime: 2.1, rating: 4.8 },
    { name: 'Sarah Johnson', tickets: 92, resolved: 89, avgTime: 1.9, rating: 4.9 },
    { name: 'Mike Wilson', tickets: 76, resolved: 71, avgTime: 2.6, rating: 4.6 },
    { name: 'Emily Davis', tickets: 65, resolved: 63, avgTime: 2.0, rating: 4.7 },
    { name: 'Alex Brown', tickets: 58, resolved: 54, avgTime: 2.8, rating: 4.5 }
  ];

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, [timeRange]);

  const exportReport = (format: 'pdf' | 'excel') => {
    // Mock export functionality
    console.log(`Exporting report as ${format}`);
    // In a real app, this would trigger actual export
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-24 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reporting Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive analytics and insights for maintenance operations
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 3 months</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={() => exportReport('pdf')}>
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          
          <Button variant="outline" onClick={() => exportReport('excel')}>
            <Download className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {metric.title}
                    </p>
                    <p className="text-3xl font-bold">{metric.value}</p>
                    <div className="flex items-center gap-1 mt-2">
                      {metric.changeType === 'increase' ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      )}
                      <span className={cn(
                        "text-sm font-medium",
                        metric.changeType === 'increase' ? "text-green-600" : "text-red-600"
                      )}>
                        {metric.change > 0 ? '+' : ''}{metric.change}%
                      </span>
                      <span className="text-sm text-muted-foreground">vs last period</span>
                    </div>
                  </div>
                  <Icon className={cn("w-8 h-8", metric.color)} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="costs">Costs</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tickets by Status */}
            <Card>
              <CardHeader>
                <CardTitle>Tickets by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ticketsByStatus.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">{item.value}</span>
                        <div className="w-20">
                          <Progress 
                            value={(item.value / Math.max(...ticketsByStatus.map(s => s.value))) * 100} 
                            className="h-2"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tickets by Priority */}
            <Card>
              <CardHeader>
                <CardTitle>Tickets by Priority</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ticketsByPriority.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">{item.value}</span>
                        <div className="w-20">
                          <Progress 
                            value={(item.value / Math.max(...ticketsByPriority.map(p => p.value))) * 100} 
                            className="h-2"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-6 gap-4">
                  {monthlyTrends.map((month) => (
                    <div key={month.month} className="text-center">
                      <div className="text-sm font-medium text-muted-foreground mb-2">
                        {month.month}
                      </div>
                      <div className="space-y-2">
                        <div className="text-2xl font-bold">{month.tickets}</div>
                        <div className="text-xs text-muted-foreground">
                          {month.resolved} resolved
                        </div>
                        <div className="text-xs text-green-600">
                          {month.avgTime}h avg
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Equipment Tab */}
        <TabsContent value="equipment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Equipment Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {equipmentMetrics.map((equipment, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">{equipment.name}</h3>
                      <Badge variant="outline">{equipment.tickets} tickets</Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {equipment.tickets}
                        </div>
                        <div className="text-sm text-muted-foreground">Total Tickets</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {equipment.mtbf}h
                        </div>
                        <div className="text-sm text-muted-foreground">MTBF</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          ${equipment.cost.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">Maintenance Cost</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Engineer Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {engineerPerformance.map((engineer, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">{engineer.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">⭐ {engineer.rating}</span>
                        <Badge variant="outline">
                          {((engineer.resolved / engineer.tickets) * 100).toFixed(1)}% success
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">
                          {engineer.tickets}
                        </div>
                        <div className="text-xs text-muted-foreground">Assigned</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">
                          {engineer.resolved}
                        </div>
                        <div className="text-xs text-muted-foreground">Resolved</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-orange-600">
                          {engineer.avgTime}h
                        </div>
                        <div className="text-xs text-muted-foreground">Avg Time</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-600">
                          {engineer.rating}
                        </div>
                        <div className="text-xs text-muted-foreground">Rating</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cost Analysis Tab */}
        <TabsContent value="costs" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Cost Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Labor Costs</span>
                    <span className="font-bold">$45,200</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Parts & Materials</span>
                    <span className="font-bold">$28,900</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Equipment Rental</span>
                    <span className="font-bold">$12,400</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>External Services</span>
                    <span className="font-bold">$8,600</span>
                  </div>
                  <div className="border-t pt-2 flex items-center justify-between font-bold">
                    <span>Total</span>
                    <span>$95,100</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost per Equipment Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {equipmentMetrics.map((equipment, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{equipment.name}</span>
                      <span className="font-medium">${equipment.cost.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Key Performance Indicators</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">94.2%</div>
                  <div className="text-sm text-muted-foreground">First-Time Fix Rate</div>
                  <div className="text-xs text-green-600 mt-1">↑ 3.1% vs last month</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">1.8h</div>
                  <div className="text-sm text-muted-foreground">Avg Response Time</div>
                  <div className="text-xs text-green-600 mt-1">↓ 12% vs last month</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600 mb-2">98.5%</div>
                  <div className="text-sm text-muted-foreground">Customer Satisfaction</div>
                  <div className="text-xs text-green-600 mt-1">↑ 1.2% vs last month</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">$127</div>
                  <div className="text-sm text-muted-foreground">Cost per Ticket</div>
                  <div className="text-xs text-red-600 mt-1">↑ 5.3% vs last month</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
