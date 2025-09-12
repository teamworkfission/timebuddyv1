import { Button } from '../ui/Button';

export function EmployeeEarnings() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <span className="text-4xl">💰</span>
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Earnings Tracker
        </h1>
        
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
          Track your earnings from local gig work, manage payments, and analyze your income trends. 
          This feature is coming soon to help you maximize your earning potential.
        </p>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-2xl mx-auto mb-8">
          <h3 className="text-lg font-medium text-green-900 mb-3">
            Coming Soon Features
          </h3>
          <ul className="text-sm text-green-700 space-y-2 text-left">
            <li>• Track earnings from multiple gigs</li>
            <li>• View payment history and status</li>
            <li>• Generate earning reports and tax documents</li>
            <li>• Set income goals and track progress</li>
            <li>• Analyze hourly rates across different jobs</li>
            <li>• Export data for tax preparation</li>
          </ul>
        </div>

        <div className="space-x-4">
          <Button
            variant="outline"
            onClick={() => window.history.back()}
          >
            ← Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}
