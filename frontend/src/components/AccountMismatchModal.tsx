import { Modal } from './ui/Modal';
import { Button } from './ui/Button';

interface AccountMismatchModalProps {
  isOpen: boolean;
  typedEmail: string;
  actualEmail: string;
  onContinueAs: () => void;
  onSwitchAccount: () => void;
}

export function AccountMismatchModal({
  isOpen,
  typedEmail,
  actualEmail,
  onContinueAs,
  onSwitchAccount,
}: AccountMismatchModalProps) {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={() => {}} // Prevent closing by clicking backdrop
      title="Account Mismatch"
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          You entered <strong>{typedEmail}</strong> but signed in as <strong>{actualEmail}</strong>.
        </p>
        
        <div className="space-y-3">
          <Button 
            onClick={onContinueAs}
            className="w-full"
            size="lg"
          >
            Continue as {actualEmail}
          </Button>
          
          <Button 
            onClick={onSwitchAccount}
            variant="outline"
            className="w-full"
            size="lg"
          >
            Switch Account
          </Button>
        </div>
      </div>
    </Modal>
  );
}
