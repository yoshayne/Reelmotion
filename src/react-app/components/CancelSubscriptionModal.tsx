import { X } from "lucide-react";

interface CancelSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

export default function CancelSubscriptionModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}: CancelSubscriptionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold mb-2">Leave the community?</h2>
        <p className="text-gray-400 mb-6 text-sm">
          If you cancel, you'll lose access to:
        </p>

        <div className="space-y-2.5 mb-6">
          {[
            "All films and series in the community library",
            "Filmmaker Q&As and early access content",
            "Support for independent film culture",
            "Ad-free viewing experience",
          ].map((item) => (
            <div key={item} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
              <div className="w-2 h-2 bg-red-600 rounded-full flex-shrink-0" />
              <span className="text-sm text-gray-200">{item}</span>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-500 mb-5">
          Your membership stays active until the end of your current billing period.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 rounded-lg font-medium text-sm transition-colors"
          >
            Keep Membership
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 rounded-lg font-medium text-sm transition-colors"
          >
            {isLoading ? "Cancelling..." : "Yes, Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}
