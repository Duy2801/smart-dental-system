export type FieldErrors<T extends string> = Partial<Record<T, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,72}$/;

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const isValidEmail = (email: string) =>
  EMAIL_PATTERN.test(normalizeEmail(email));

export const validateLogin = (email: string, password: string) => {
  const errors: FieldErrors<'email' | 'password'> = {};
  if (!email.trim()) errors.email = 'Vui lòng nhập email';
  else if (!isValidEmail(email)) errors.email = 'Email không đúng định dạng';
  if (!password) errors.password = 'Vui lòng nhập mật khẩu';
  return errors;
};

export const validateRegister = (values: {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
}) => {
  const errors: FieldErrors<
    'fullName' | 'email' | 'password' | 'confirmPassword' | 'terms'
  > = {};

  if (values.fullName.trim().length < 2) {
    errors.fullName = 'Họ tên phải có ít nhất 2 ký tự';
  }
  if (!values.email.trim()) errors.email = 'Vui lòng nhập email';
  else if (!isValidEmail(values.email)) {
    errors.email = 'Email không đúng định dạng';
  }
  if (!PASSWORD_PATTERN.test(values.password)) {
    errors.password = 'Tối thiểu 8 ký tự, gồm chữ hoa, chữ thường và số';
  }
  if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Mật khẩu xác nhận không khớp';
  }
  if (!values.acceptedTerms) {
    errors.terms = 'Bạn cần đồng ý với điều khoản để đăng ký';
  }
  return errors;
};
