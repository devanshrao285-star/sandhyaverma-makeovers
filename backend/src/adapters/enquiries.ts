import type { Enquiry, EnquiryRepository } from '../modules/enquiries/service';
export function d1Enquiries(db: D1Database): EnquiryRepository {
  return { async save(e: Enquiry) {
    await db.prepare('INSERT INTO enquiries (id,name,phone,email,interest,preferred_date,message,contact_consent,marketing_consent,consent_version,created_at,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)')
      .bind(e.id,e.name,e.phone,e.email,e.interest,e.date,e.message,1,e.marketingConsent ? 1 : 0,'2026-11-07',e.createdAt,e.status).run();
  }};
}
