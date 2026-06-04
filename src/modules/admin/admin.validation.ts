/**
 * Admin list endpoints reuse the same query validation as their public
 * counterparts, re-exported here so the admin module stays self-describing.
 */
export { listJobsSchema } from '../jobs/jobs.validation';
export { listApplicationsSchema } from '../applications/applications.validation';
export { listCompaniesSchema } from '../companies/companies.validation';
