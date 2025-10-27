import { body, query, param, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

// Middleware to handle validation errors
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'خطأ في التحقق من البيانات',
      errors: errors.array(),
    });
  }
  next();
};

// Password validation regex - at least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// Register validation
export const registerValidation = [
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('الاسم الكامل مطلوب')
    .isLength({ min: 3, max: 100 })
    .withMessage('الاسم يجب أن يكون بين 3 و 100 حرف'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('البريد الإلكتروني مطلوب')
    .isEmail()
    .withMessage('البريد الإلكتروني غير صالح')
    .normalizeEmail(),

  body('phone')
    .trim()
    .notEmpty()
    .withMessage('رقم الهاتف مطلوب')
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('رقم الهاتف غير صالح'),

  body('password')
    .notEmpty()
    .withMessage('كلمة المرور مطلوبة')
    .matches(passwordRegex)
    .withMessage('كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل، حرف كبير، حرف صغير، رقم، ورمز خاص'),

  body('country')
    .trim()
    .notEmpty()
    .withMessage('البلد مطلوب')
    .isLength({ min: 2, max: 100 })
    .withMessage('البلد غير صالح'),

  handleValidationErrors,
];

// Login validation
export const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('البريد الإلكتروني مطلوب')
    .isEmail()
    .withMessage('البريد الإلكتروني غير صالح')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('كلمة المرور مطلوبة'),

  handleValidationErrors,
];

// Transaction creation validation
export const createTransactionValidation = [
  body('senderName')
    .trim()
    .notEmpty()
    .withMessage('اسم المرسل مطلوب')
    .isLength({ min: 3, max: 100 })
    .withMessage('اسم المرسل غير صالح'),

  body('senderPhone')
    .trim()
    .notEmpty()
    .withMessage('هاتف المرسل مطلوب')
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('رقم هاتف المرسل غير صالح'),

  body('senderCountry')
    .trim()
    .notEmpty()
    .withMessage('بلد المرسل مطلوب'),

  body('recipientName')
    .trim()
    .notEmpty()
    .withMessage('اسم المستلم مطلوب')
    .isLength({ min: 3, max: 100 })
    .withMessage('اسم المستلم غير صالح'),

  body('recipientPhone')
    .trim()
    .notEmpty()
    .withMessage('هاتف المستلم مطلوب')
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('رقم هاتف المستلم غير صالح'),

  body('recipientBankName')
    .trim()
    .notEmpty()
    .withMessage('اسم البنك مطلوب'),

  body('recipientAccountNumber')
    .trim()
    .notEmpty()
    .withMessage('رقم الحساب مطلوب'),

  body('recipientCountry')
    .trim()
    .notEmpty()
    .withMessage('بلد المستلم مطلوب'),

  body('fromCurrency')
    .trim()
    .notEmpty()
    .withMessage('العملة المرسلة مطلوبة')
    .isLength({ min: 3, max: 3 })
    .withMessage('رمز العملة غير صالح'),

  body('toCurrency')
    .trim()
    .notEmpty()
    .withMessage('العملة المستلمة مطلوبة')
    .isLength({ min: 3, max: 3 })
    .withMessage('رمز العملة غير صالح'),

  body('amountSent')
    .notEmpty()
    .withMessage('المبلغ المرسل مطلوب')
    .isFloat({ min: 0.01 })
    .withMessage('المبلغ المرسل يجب أن يكون أكبر من صفر'),

  handleValidationErrors,
];

// Exchange rate query validation
export const exchangeRateValidation = [
  query('from')
    .trim()
    .notEmpty()
    .withMessage('العملة المصدر مطلوبة')
    .isLength({ min: 3, max: 3 })
    .withMessage('رمز العملة غير صالح'),

  query('to')
    .trim()
    .notEmpty()
    .withMessage('العملة الهدف مطلوبة')
    .isLength({ min: 3, max: 3 })
    .withMessage('رمز العملة غير صالح'),

  handleValidationErrors,
];

// Transaction ID param validation
export const transactionIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('معرف المعاملة غير صالح'),

  handleValidationErrors,
];

// Admin approve transaction validation
export const approveTransactionValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('معرف المعاملة غير صالح'),

  body('paymentMethod')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('طريقة الدفع غير صالحة'),

  body('paymentReference')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('مرجع الدفع غير صالح'),

  body('adminNotes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('الملاحظات طويلة جداً'),

  handleValidationErrors,
];

// Admin reject transaction validation
export const rejectTransactionValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('معرف المعاملة غير صالح'),

  body('rejectionReason')
    .trim()
    .notEmpty()
    .withMessage('سبب الرفض مطلوب')
    .isLength({ min: 10, max: 500 })
    .withMessage('سبب الرفض يجب أن يكون بين 10 و 500 حرف'),

  body('adminNotes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('الملاحظات طويلة جداً'),

  handleValidationErrors,
];

// Update exchange rate validation
export const updateExchangeRateValidation = [
  body('fromCurrency')
    .trim()
    .notEmpty()
    .withMessage('العملة المصدر مطلوبة')
    .isLength({ min: 3, max: 3 })
    .withMessage('رمز العملة غير صالح'),

  body('toCurrency')
    .trim()
    .notEmpty()
    .withMessage('العملة الهدف مطلوبة')
    .isLength({ min: 3, max: 3 })
    .withMessage('رمز العملة غير صالح'),

  body('rate')
    .notEmpty()
    .withMessage('سعر الصرف مطلوب')
    .isFloat({ min: 0.000001 })
    .withMessage('سعر الصرف يجب أن يكون أكبر من صفر'),

  body('adminFeePercent')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('نسبة رسوم الإدارة يجب أن تكون بين 0 و 100'),

  handleValidationErrors,
];

// Pagination validation
export const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('رقم الصفحة غير صالح'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('حد الصفحة يجب أن يكون بين 1 و 100'),

  handleValidationErrors,
];
