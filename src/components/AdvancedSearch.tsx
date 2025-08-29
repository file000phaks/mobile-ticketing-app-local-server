import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { Checkbox } from './ui/checkbox';
import { 
  Search, 
  Filter, 
  X, 
  Calendar as CalendarIcon,
  MapPin,
  User,
  Wrench,
  AlertTriangle,
  Reset
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface SearchFilters {
  query: string;
  status: string[];
  priority: string[];
  type: string[];
  assignedTo: string[];
  createdBy: string[];
  dateRange: {
    from?: Date;
    to?: Date;
  };
  location: string;
  equipment: string[];
  hasAttachments: boolean | null;
}

interface AdvancedSearchProps {
  onSearch?: (filters: SearchFilters) => void;
  onReset?: () => void;
  className?: string;
}

const statusOptions = [
  { value: 'open', label: 'Open', color: 'bg-blue-500' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-yellow-500' },
  { value: 'resolved', label: 'Resolved', color: 'bg-green-500' },
  { value: 'verified', label: 'Verified', color: 'bg-purple-500' },
  { value: 'closed', label: 'Closed', color: 'bg-gray-500' }
];

const priorityOptions = [
  { value: 'low', label: 'Low', color: 'bg-green-500' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-500' },
  { value: 'high', label: 'High', color: 'bg-orange-500' },
  { value: 'critical', label: 'Critical', color: 'bg-red-500' }
];

const typeOptions = [
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'repair', label: 'Repair' },
  { value: 'inspection', label: 'Inspection' },
  { value: 'installation', label: 'Installation' },
  { value: 'emergency', label: 'Emergency' }
];

const mockUsers = [
  { value: 'admin@test.com', label: 'Admin User' },
  { value: 'supervisor@test.com', label: 'Supervisor User' },
  { value: 'engineer@test.com', label: 'Field Engineer' }
];

const mockEquipment = [
  { value: 'hvac-1', label: 'HVAC Unit A-2' },
  { value: 'elevator-1', label: 'Elevator B-1' },
  { value: 'fire-1', label: 'Fire Safety System C' },
  { value: 'generator-1', label: 'Backup Generator' }
];

export default function AdvancedSearch({ 
  onSearch, 
  onReset, 
  className 
}: AdvancedSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    status: [],
    priority: [],
    type: [],
    assignedTo: [],
    createdBy: [],
    dateRange: {},
    location: '',
    equipment: [],
    hasAttachments: null
  });

  const [showFilters, setShowFilters] = useState(false);

  const updateFilter = <K extends keyof SearchFilters>(
    key: K,
    value: SearchFilters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayFilter = <K extends keyof SearchFilters>(
    key: K,
    value: string
  ) => {
    const currentArray = filters[key] as string[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    
    updateFilter(key, newArray as SearchFilters[K]);
  };

  const resetFilters = () => {
    setFilters({
      query: '',
      status: [],
      priority: [],
      type: [],
      assignedTo: [],
      createdBy: [],
      dateRange: {},
      location: '',
      equipment: [],
      hasAttachments: null
    });
    onReset?.();
  };

  const handleSearch = () => {
    onSearch?.(filters);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.query) count++;
    if (filters.status.length) count++;
    if (filters.priority.length) count++;
    if (filters.type.length) count++;
    if (filters.assignedTo.length) count++;
    if (filters.createdBy.length) count++;
    if (filters.dateRange.from || filters.dateRange.to) count++;
    if (filters.location) count++;
    if (filters.equipment.length) count++;
    if (filters.hasAttachments !== null) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Advanced Search
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search Query */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search tickets by title, description, or ticket number..."
              value={filters.query}
              onChange={(e) => updateFilter('query', e.target.value)}
              className="pl-10"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button onClick={handleSearch}>
            Search
          </Button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="space-y-6 pt-4 border-t">
            {/* Status Filter */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Status
              </Label>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={filters.status.includes(option.value) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleArrayFilter('status', option.value)}
                    className="gap-2"
                  >
                    <div className={cn("w-2 h-2 rounded-full", option.color)} />
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Priority Filter */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Priority
              </Label>
              <div className="flex flex-wrap gap-2">
                {priorityOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={filters.priority.includes(option.value) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleArrayFilter('priority', option.value)}
                    className="gap-2"
                  >
                    <div className={cn("w-2 h-2 rounded-full", option.color)} />
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Type Filter */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Wrench className="w-4 h-4" />
                Type
              </Label>
              <div className="flex flex-wrap gap-2">
                {typeOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={filters.type.includes(option.value) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleArrayFilter('type', option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !filters.dateRange.from && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateRange.from ? (
                        format(filters.dateRange.from, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.dateRange.from}
                      onSelect={(date) => updateFilter('dateRange', { ...filters.dateRange, from: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>To Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !filters.dateRange.to && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateRange.to ? (
                        format(filters.dateRange.to, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.dateRange.to}
                      onSelect={(date) => updateFilter('dateRange', { ...filters.dateRange, to: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Location
              </Label>
              <Input
                placeholder="Enter location..."
                value={filters.location}
                onChange={(e) => updateFilter('location', e.target.value)}
              />
            </div>

            {/* Assigned To */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Assigned To
              </Label>
              <Select
                value={filters.assignedTo[0] || ''}
                onValueChange={(value) => updateFilter('assignedTo', value ? [value] : [])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Users</SelectItem>
                  {mockUsers.map((user) => (
                    <SelectItem key={user.value} value={user.value}>
                      {user.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Equipment */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Wrench className="w-4 h-4" />
                Equipment
              </Label>
              <div className="space-y-2">
                {mockEquipment.map((equipment) => (
                  <div key={equipment.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={equipment.value}
                      checked={filters.equipment.includes(equipment.value)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          toggleArrayFilter('equipment', equipment.value);
                        } else {
                          toggleArrayFilter('equipment', equipment.value);
                        }
                      }}
                    />
                    <Label htmlFor={equipment.value} className="text-sm font-normal">
                      {equipment.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Has Attachments */}
            <div className="space-y-2">
              <Label>Attachments</Label>
              <Select
                value={filters.hasAttachments === null ? '' : filters.hasAttachments.toString()}
                onValueChange={(value) => 
                  updateFilter('hasAttachments', value === '' ? null : value === 'true')
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any</SelectItem>
                  <SelectItem value="true">With Attachments</SelectItem>
                  <SelectItem value="false">Without Attachments</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t">
              <Button onClick={resetFilters} variant="outline" className="flex-1 gap-2">
                <Reset className="w-4 h-4" />
                Reset Filters
              </Button>
              <Button onClick={handleSearch} className="flex-1 gap-2">
                <Search className="w-4 h-4" />
                Apply Filters
              </Button>
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        {activeFilterCount > 0 && (
          <div className="space-y-2">
            <Label className="text-sm">Active Filters:</Label>
            <div className="flex flex-wrap gap-2">
              {filters.status.map((status) => (
                <Badge key={status} variant="secondary" className="gap-1">
                  Status: {status}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => toggleArrayFilter('status', status)}
                  />
                </Badge>
              ))}
              {filters.priority.map((priority) => (
                <Badge key={priority} variant="secondary" className="gap-1">
                  Priority: {priority}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => toggleArrayFilter('priority', priority)}
                  />
                </Badge>
              ))}
              {filters.type.map((type) => (
                <Badge key={type} variant="secondary" className="gap-1">
                  Type: {type}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => toggleArrayFilter('type', type)}
                  />
                </Badge>
              ))}
              {filters.location && (
                <Badge variant="secondary" className="gap-1">
                  Location: {filters.location}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => updateFilter('location', '')}
                  />
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
