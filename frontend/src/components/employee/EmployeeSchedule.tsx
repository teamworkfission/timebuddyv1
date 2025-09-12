import { Button } from '../ui/Button';

export function EmployeeSchedule() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
            <span className="text-4xl">📅</span>
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Schedule Management
        </h1>
        
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
          View your work schedule, manage shift preferences, and coordinate with local employers. 
          This feature is coming soon to help you organize your gig work efficiently.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl mx-auto mb-8">
          <h3 className="text-lg font-medium text-blue-900 mb-3">
            Coming Soon Features
          </h3>
          <ul className="text-sm text-blue-700 space-y-2 text-left">
            <li>• View and manage your work schedule</li>
            <li>• Set availability preferences</li>
            <li>• Coordinate shifts with multiple employers</li>
            <li>• Receive schedule notifications</li>
            <li>• Request time off or schedule changes</li>
            <li>• Track your working hours</li>
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
