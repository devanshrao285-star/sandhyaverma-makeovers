import { ValidationError } from '../content/model';
export interface Enquiry { id: string; name: string; phone: string; email: string; interest: string; date: string; message: string; marketingConsent: boolean; contactConsent: boolean; createdAt: string; status: string }
export interface EnquiryRepository { save(enquiry: Enquiry): Promise<void> }
export function parseEnquiry(input: Record<string, unknown>) {
  const field = (key: string, max: number, required = false) => {
    const value = input[key];
    if (typeof value !== 'string' || value.length > max || (required && !value.trim())) throw new ValidationError('Please check ' + key + '.');
    return value.trim();
  };
  const name = field('name', 100, true);
  const phone = field('phone', 20, true).replace(/[\s()-]/g, '');
  if (!/^(?:\+91|91)?[6-9]\d{9}$/.test(phone)) throw new ValidationError('Enter a valid 10-digit Indian mobile number.');
  const email = field('email', 150);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ValidationError('Enter a valid email address.');
  const date = field('date', 10);
  if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date)) throw new ValidationError('Choose a valid preferred date.');
  if (input.contactConsent !== true) throw new ValidationError('Please allow us to contact you about this enquiry.');
  return { name, phone: '+91' + phone.slice(-10), email, interest: field('interest', 100, true), date, message: field('message', 1500), contactConsent: true, marketingConsent: input.marketingConsent === true };
}
export function createEnquiryService(repo: EnquiryRepository, clock: () => Date, id: () => string) {
  return async (input: Record<string, unknown>) => {
    const data = parseEnquiry(input);
    const enquiry: Enquiry = { ...data, id: id(), createdAt: clock().toISOString(), status: 'new' };
    await repo.save(enquiry);
    return { id: enquiry.id };
  };
}
