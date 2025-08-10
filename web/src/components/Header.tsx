import { Link, useLocation } from 'react-router-dom';
import { 
  CloudArrowUpIcon, 
  DocumentMagnifyingGlassIcon, 
  CheckCircleIcon,
  ChevronDownIcon,
  ClipboardDocumentListIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { Listbox } from '@headlessui/react';

interface HeaderProps {
  selectedTenant: string;
  onTenantChange: (tenantId: string) => void;
  tenants: { id: string; name: string }[];
  onChatToggle: () => void;
}

const navigation = [
  { name: 'Upload', href: '/', icon: CloudArrowUpIcon },
  { name: 'Reconcile', href: '/reconcile', icon: DocumentMagnifyingGlassIcon },
  { name: 'Review', href: '/review', icon: CheckCircleIcon },
  { name: 'Audit', href: '/audit', icon: ClipboardDocumentListIcon },
];

export default function Header({ selectedTenant, onTenantChange, tenants, onChatToggle }: HeaderProps) {
  const location = useLocation();
  const selectedTenantData = tenants.find(t => t.id === selectedTenant);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Logo and Tenant */}
          <div className="flex items-center">
            {/* Logo */}
            <div className="flex-shrink-0 mr-8">
              <h1 className="text-2xl font-bold text-gray-900">PayFast</h1>
            </div>
            
            {/* Tenant Selector */}
            <div className="relative">
              <Listbox value={selectedTenant} onChange={onTenantChange}>
                <Listbox.Button className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                  <span className="truncate max-w-32">{selectedTenantData?.name || selectedTenant}</span>
                  <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                </Listbox.Button>
                <Listbox.Options className="absolute z-10 mt-1 w-64 bg-white shadow-lg rounded-lg border border-gray-200 py-1 max-h-60 overflow-auto">
                  {tenants.map((tenant) => (
                    <Listbox.Option
                      key={tenant.id}
                      value={tenant.id}
                      className={({ active }) =>
                        `cursor-pointer select-none relative py-2 px-4 text-sm ${
                          active ? 'bg-blue-50 text-blue-900' : 'text-gray-900'
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

          {/* Right side - Navigation */}
          <nav className="flex items-center space-x-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-100 text-blue-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
            
            {/* Chat Button */}
            <button
              onClick={onChatToggle}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200"
            >
              <ChatBubbleLeftRightIcon className="h-4 w-4" />
              <span>AI Chat</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
