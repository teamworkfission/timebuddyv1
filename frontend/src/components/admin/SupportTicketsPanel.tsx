import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { SupportTicketCard } from './SupportTicketCard';
import { SupportTicket, getSupportTickets } from '../../lib/admin-api';

export function SupportTicketsPanel() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<SupportTicket[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved' | 'closed'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate stats from tickets
  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    in_progress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    closed: tickets.filter(t => t.status === 'closed').length,
  };

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const ticketsData = await getSupportTickets();
      setTickets(ticketsData);
      
      // Apply current filter
      filterTickets(ticketsData, activeFilter);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const filterTickets = (ticketsData: SupportTicket[], filter: string) => {
    if (filter === 'all') {
      setFilteredTickets(ticketsData);
    } else {
      setFilteredTickets(ticketsData.filter(ticket => ticket.status === filter));
    }
  };

  const handleFilterChange = (filter: 'all' | 'open' | 'in_progress' | 'resolved' | 'closed') => {
    setActiveFilter(filter);
    filterTickets(tickets, filter);
  };

  const handleTicketUpdate = () => {
    loadTickets(); // Reload all tickets when one is updated
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const filterOptions = [
    { value: 'all', label: 'All Tickets', count: stats.total, color: 'text-gray-600' },
    { value: 'open', label: 'Open', count: stats.open, color: 'text-red-600' },
    { value: 'in_progress', label: 'In Progress', count: stats.in_progress, color: 'text-yellow-600' },
    { value: 'resolved', label: 'Resolved', count: stats.resolved, color: 'text-green-600' },
    { value: 'closed', label: 'Closed', count: stats.closed, color: 'text-gray-600' },
  ];

  if (loading && tickets.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading support tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          {filterOptions.map((option) => (
            <div key={option.value} className="bg-white rounded-lg shadow p-6">
              <div className={`text-2xl font-bold ${option.color}`}>
                {option.count}
              </div>
              <div className="text-sm text-gray-600">{option.label}</div>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleFilterChange(option.value as any)}
                  className={`py-4 text-sm font-medium border-b-2 ${
                    activeFilter === option.value
                      ? `border-blue-500 ${option.color}`
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {option.label} ({option.count})
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Header Actions */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {activeFilter === 'all' ? 'All Support Tickets' : 
                   filterOptions.find(f => f.value === activeFilter)?.label + ' Tickets'}
                </h2>
                <p className="text-sm text-gray-600">
                  Showing {filteredTickets.length} of {stats.total} tickets
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadTickets}
                disabled={loading}
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
                {error}
                <button 
                  onClick={loadTickets}
                  className="ml-4 text-red-600 underline hover:no-underline"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-3"></div>
                <span className="text-gray-600">Loading tickets...</span>
              </div>
            )}

            {/* Empty State */}
            {!loading && filteredTickets.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">No tickets found</h3>
                <p className="text-gray-500">
                  {activeFilter === 'all' 
                    ? 'No support tickets have been created yet.'
                    : `No ${activeFilter.replace('_', ' ')} tickets found.`
                  }
                </p>
              </div>
            ) : (
              /* Tickets List */
              <div className="space-y-6">
                {filteredTickets.map((ticket) => (
                  <SupportTicketCard
                    key={ticket.id}
                    ticket={ticket}
                    onStatusChange={handleTicketUpdate}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
