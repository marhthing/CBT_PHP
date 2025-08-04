interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  isLoading?: boolean
  loading?: boolean
  title: string
  message: string
  confirmButtonText?: string
  cancelButtonText?: string
  confirmText?: string
  cancelText?: string
  isDestructive?: boolean
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  loading = false,
  title,
  message,
  confirmButtonText = 'Confirm',
  cancelButtonText = 'Cancel',
  confirmText,
  cancelText,
  isDestructive = false
}: ConfirmationModalProps) {
  const finalConfirmText = confirmText || confirmButtonText
  const finalCancelText = cancelText || cancelButtonText
  const finalLoading = loading || isLoading
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600 mb-6">{message}</p>

          <div className="flex justify-end gap-4">
            <button
              onClick={onClose}
              disabled={finalLoading}
              className={`px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors ${
                finalLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {finalCancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={finalLoading}
              className={`flex items-center justify-center gap-2 px-4 py-2 text-white ${
                isDestructive ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
              } rounded-lg transition-colors ${
                finalLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {finalLoading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              {finalLoading ? 'Processing...' : finalConfirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}