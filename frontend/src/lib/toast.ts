import toast from 'react-hot-toast';

export const showToast = {
  success: (message: string) => {
    toast.success(message, {
      style: {
        background: '#f0fdf4',
        color: '#166534',
        border: '1px solid #bbf7d0',
      },
    });
  },

  error: (message: string) => {
    toast.error(message, {
      style: {
        background: '#fef2f2',
        color: '#dc2626',
        border: '1px solid #fecaca',
      },
    });
  },

  loading: (message: string) => {
    return toast.loading(message, {
      style: {
        background: '#f8fafc',
        color: '#475569',
        border: '1px solid #e2e8f0',
      },
    });
  },

  dismiss: (toastId?: string) => {
    toast.dismiss(toastId);
  },

  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    return toast.promise(promise, messages, {
      style: {
        fontFamily: 'IBM Plex Sans Arabic, system-ui, -apple-system, sans-serif',
        direction: 'rtl',
      },
      success: {
        style: {
          background: '#f0fdf4',
          color: '#166534',
          border: '1px solid #bbf7d0',
        },
      },
      error: {
        style: {
          background: '#fef2f2',
          color: '#dc2626',
          border: '1px solid #fecaca',
        },
      },
    });
  },
};