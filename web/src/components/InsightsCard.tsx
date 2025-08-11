import React from 'react';
import { 
  LightBulbIcon, 
  ExclamationTriangleIcon, 
  CheckCircleIcon,
  ClockIcon,
  UserGroupIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { ReconciliationInsights } from '../lib/api';

interface InsightsCardProps {
  insights: ReconciliationInsights;
  isLoading?: boolean;
}

const getRiskColor = (risk: string) => {
  switch (risk.toLowerCase()) {
    case 'low':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'medium':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'high':
      return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'critical':
      return 'text-red-600 bg-red-50 border-red-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

const getRiskIcon = (risk: string) => {
  switch (risk.toLowerCase()) {
    case 'low':
      return <CheckCircleIcon className="h-4 w-4" />;
    case 'medium':
    case 'high':
      return <ExclamationTriangleIcon className="h-4 w-4" />;
    case 'critical':
      return <ExclamationTriangleIcon className="h-5 w-5" />;
    default:
      return <ExclamationTriangleIcon className="h-4 w-4" />;
  }
};

export default function InsightsCard({ insights, isLoading = false }: InsightsCardProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            <div className="h-3 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <LightBulbIcon className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Auto-Reconciliation Insights</h3>
        </div>
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${getRiskColor(insights.risk_assessment)}`}>
          {getRiskIcon(insights.risk_assessment)}
          <span className="text-sm font-medium">{insights.risk_assessment} Risk</span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CurrencyDollarIcon className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Total Impact</span>
          </div>
          <p className="text-2xl font-bold text-blue-900 mt-1">
            ${insights.total_impact.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <UserGroupIcon className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-900">Affected Employees</span>
          </div>
          <p className="text-2xl font-bold text-green-900 mt-1">{insights.affected_employees}</p>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <ClockIcon className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">Generated</span>
          </div>
          <p className="text-sm text-purple-900 mt-1">
            {new Date(insights.created_at).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Top Causes */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Top Causes</h4>
        <div className="space-y-2">
          {Object.entries(insights.top_causes).map(([cause, count]) => (
            <div key={cause} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
              <span className="text-sm text-gray-700 capitalize">
                {cause.replace('_', ' ')}
              </span>
              <span className="text-sm font-semibold text-gray-900">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Priority Actions */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Priority Actions</h4>
        <div className="space-y-2">
          {insights.priority_actions.map((action, index) => (
            <div key={index} className="flex items-start space-x-2">
              <div className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full mt-2"></div>
              <p className="text-sm text-gray-700">{action}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Suggested Fixes */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Suggested Fixes</h4>
        <div className="space-y-2">
          {insights.suggested_fixes.map((fix, index) => (
            <div key={index} className="flex items-start space-x-2">
              <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <p className="text-sm text-gray-700">{fix}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
