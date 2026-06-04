import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import usersRoutes from '../modules/users/users.routes';
import candidatesRoutes from '../modules/candidates/candidates.routes';
import employerAuthRoutes from '../modules/employers/employer-auth.routes';
import employerRoutes from '../modules/employers/employer.routes';
import companiesRoutes from '../modules/companies/companies.routes';
import jobsRoutes from '../modules/jobs/jobs.routes';
import applicationsRoutes from '../modules/applications/applications.routes';
import adminRoutes from '../modules/admin/admin.routes';
import uploadsRoutes from '../modules/uploads/uploads.routes';

/** Mounts every module router under the API prefix. */
const router = Router();

router.get('/health', (_req, res) => {
  res.json({ success: true, message: 'OK', data: { status: 'healthy', uptime: process.uptime() } });
});

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/candidates', candidatesRoutes);
router.use('/employers', employerAuthRoutes);
router.use('/employer', employerRoutes);
router.use('/companies', companiesRoutes);
router.use('/jobs', jobsRoutes);
router.use('/applications', applicationsRoutes);
router.use('/admin', adminRoutes);
router.use('/uploads', uploadsRoutes);

export default router;
