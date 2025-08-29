import React from 'react';
import { Badge } from './ui/badge';
import { Shield } from 'lucide-react';

interface AdminBadgeProps {
  className?: string;
}

const AdminBadge: React.FC<AdminBadgeProps> = ({ className = '' }) => {
  return (
    <Badge 
      variant="secondary" 
      className={`bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0 ${className}`}
    >
      <Shield className="w-3 h-3 mr-1" />
      Admin
    </Badge>
  );
};

export default AdminBadge;