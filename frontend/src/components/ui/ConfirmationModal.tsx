interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  isLoading?: boolean
  loading?: boolean
  title: string
  message: string
  confirmButtonText?: string
  confirmText?: string
  cancelButtonText?: string
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
  confirmText,
  cancelButtonText = 'Cancel',
  cancelText,
  isDestructive = false
}: ConfirmationModalProps) {
  const actualLoading = isLoading || loading
  const actualConfirmText = confirmText || confirmButtonText
  const actualCancelText = cancelText || cancelButtonText
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
              disabled={actualLoading}
              className={`px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors ${
                actualLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {actualCancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={actualLoading}
              className={`flex items-center justify-center gap-2 px-4 py-2 text-white ${
                isDestructive ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
              } rounded-lg transition-colors ${
                actualLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {actualLoading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              {actualLoading ? 'Processing...' : actualConfirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}