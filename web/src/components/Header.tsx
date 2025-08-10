import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { 
  CloudArrowUpIcon, 
  DocumentMagnifyingGlassIcon, 
  CheckCircleIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { Listbox } from '@headlessui/react';

interface HeaderProps {
  selectedTenant: string;
  onTenantChange: (tenantId: string) => void;
  tenants: { id: string; name: string }[];
}

const navigation = [
  { name: 'Upload', href: '/', icon: CloudArrowUpIcon },
  { name: 'Reconcile', href: '/reconcile', icon: DocumentMagnifyingGlassIcon },
  { name: 'Review & Approve', href: '/review', icon: CheckCircleIcon },
];

export default function Header({ selectedTenant, onTenantChange, tenants }: HeaderProps) {
  const location = useLocation();
  const selectedTenantData = tenants.find(t => t.id === selectedTenant);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-gray-900">PayFast</h1>
            </div>
            
            {/* Tenant Selector */}
            <div className="relative">
              <Listbox value={selectedTenant} onChange={onTenantChange}>
                <Listbox.Button className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <span>{selectedTenantData?.name || selectedTenant}</span>
                  <ChevronDownIcon className="h-4 w-4" />
                </Listbox.Button>
                <Listbox.Options className="absolute z-10 mt-1 w-56 bg-white shadow-lg rounded-md border border-gray-200 py-1">
                  {tenants.map((tenant) => (
                    <Listbox.Option
                      key={tenant.id}
                      value={tenant.id}
                      className={({ active }) =>
                        `cursor-pointer select-none relative py-2 px-3 ${
                          active ? 'bg-primary-50 text-primary-900' : 'text-gray-900'
                        }`
                      }
                    >
                      {tenant.name}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Listbox>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex space-x-8">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
