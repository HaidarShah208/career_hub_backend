import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import { env } from './env';
import {
  APPLICATION_STATUSES,
  EMPLOYMENT_TYPES,
  JOB_STATUSES,
  USER_ROLES,
} from '../shared/constants';

/**
 * Central OpenAPI 3 spec — all API documentation lives in this file only.
 * When you add a new route, add its path entry to `paths` below.
 * Swagger UI is mounted from `setupSwagger()` in `app.ts`.
 */
const bearerAuth = [{ bearerAuth: [] }];

const jsonContent = (schemaRef: string) => ({
  'application/json': { schema: { $ref: schemaRef } },
});

const multipartFileBody = {
  content: {
    'multipart/form-data': {
      schema: {
        type: 'object',
        properties: {
          file: { type: 'string', format: 'binary' },
        },
      },
    },
  },
};

const openApiDefinition = {
  openapi: '3.0.3',
  info: {
    title: 'Pakistan Career Hub API',
    version: '1.0.0',
    description:
      'Production-grade monolithic backend for the Pakistan Career Hub job portal. ' +
      'Authenticate via `/auth/signin`, then pass the returned access token as a Bearer token.',
  },
  servers: [
    {
      url: `http://localhost:${env.PORT}${env.API_PREFIX}`,
      description: 'Local development',
    },
    { url: env.API_PREFIX, description: 'Relative (same host)' },
  ],
  tags: [
    { name: 'Health', description: 'Service health' },
    { name: 'Auth', description: 'Authentication & token management' },
    { name: 'Users', description: 'Current user profile' },
    { name: 'Candidates', description: 'Candidate profile management' },
    { name: 'Employer Auth', description: 'Employer signup & signin' },
    { name: 'Employer', description: 'Employer recruiter workflow (own company, jobs, applicants)' },
    { name: 'Companies', description: 'Company directory' },
    { name: 'Jobs', description: 'Job listings (Redis-cached)' },
    { name: 'Applications', description: 'Job applications' },
    { name: 'Uploads', description: 'File uploads (Cloudinary)' },
    { name: 'Billing', description: 'Plans, subscriptions & payments' },
    { name: 'Public', description: 'Public stats & metadata' },
    { name: 'Admin', description: 'Admin-only dashboard & moderation' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Success' },
          data: { type: 'object' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Error' },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: USER_ROLES },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      SignInRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: env.ADMIN_EMAIL },
          password: { type: 'string', example: env.ADMIN_PASSWORD },
        },
      },
      RefreshRequest: {
        type: 'object',
        required: ['refreshToken'],
        properties: { refreshToken: { type: 'string' } },
      },
      SignUpRequest: {
        type: 'object',
        required: ['firstName', 'lastName', 'email', 'password'],
        properties: {
          firstName: { type: 'string', example: 'Ali' },
          lastName: { type: 'string', example: 'Khan' },
          email: { type: 'string', format: 'email', example: 'ali.khan@example.pk' },
          password: { type: 'string', minLength: 8, example: 'Candidate@123' },
        },
      },
      CandidateProfile: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          headline: { type: 'string', nullable: true },
          bio: { type: 'string', nullable: true },
          skills: { type: 'array', items: { type: 'string' }, nullable: true },
          experienceYears: { type: 'integer' },
          city: { type: 'string', nullable: true },
          resumeUrl: { type: 'string', nullable: true },
        },
      },
      UpdateProfileRequest: {
        type: 'object',
        properties: {
          headline: { type: 'string' },
          bio: { type: 'string' },
          skills: { type: 'array', items: { type: 'string' } },
          experienceYears: { type: 'integer' },
          city: { type: 'string' },
          resumeUrl: { type: 'string' },
        },
      },
      UpdateApplicationStatusRequest: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { type: 'string', enum: APPLICATION_STATUSES },
          note: { type: 'string' },
        },
      },
      EmployerCompanyRequest: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', example: 'Acme Technologies' },
          logo: { type: 'string', example: 'https://cdn.example.pk/acme.png' },
          website: { type: 'string', example: 'https://acme.pk' },
          description: { type: 'string' },
          industry: { type: 'string', example: 'Software' },
          companySize: { type: 'string', example: '11-50' },
          foundedYear: { type: 'integer', example: 2015 },
          location: { type: 'string', example: 'Lahore, Pakistan' },
        },
      },
      EmployerJobRequest: {
        type: 'object',
        required: ['title', 'description'],
        properties: {
          title: { type: 'string', example: 'Senior Backend Engineer' },
          description: { type: 'string' },
          location: { type: 'string', example: 'Karachi, Pakistan' },
          employmentType: { type: 'string', enum: EMPLOYMENT_TYPES },
          salaryMin: { type: 'integer', example: 200000 },
          salaryMax: { type: 'integer', example: 400000 },
          status: { type: 'string', enum: JOB_STATUSES },
        },
      },
      EmployerDashboard: {
        type: 'object',
        properties: {
          company: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' } } },
          totalJobs: { type: 'integer' },
          activeJobs: { type: 'integer' },
          totalApplicants: { type: 'integer' },
          hiredCandidates: { type: 'integer' },
          recentApplications: { type: 'array', items: { type: 'object' } },
        },
      },
      Company: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          description: { type: 'string', nullable: true },
          website: { type: 'string', nullable: true },
          location: { type: 'string', nullable: true },
          logo: { type: 'string', nullable: true },
          ownerId: { type: 'string', format: 'uuid' },
        },
      },
      CreateCompanyRequest: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          website: { type: 'string' },
          location: { type: 'string' },
          logo: { type: 'string' },
          ownerId: { type: 'string', format: 'uuid' },
        },
      },
      UpdateCompanyRequest: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          website: { type: 'string' },
          location: { type: 'string' },
          logo: { type: 'string' },
          ownerId: { type: 'string', format: 'uuid' },
        },
      },
      Job: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          slug: { type: 'string' },
          description: { type: 'string' },
          location: { type: 'string', nullable: true },
          employmentType: { type: 'string', enum: EMPLOYMENT_TYPES },
          salaryMin: { type: 'integer', nullable: true },
          salaryMax: { type: 'integer', nullable: true },
          status: { type: 'string', enum: JOB_STATUSES },
          companyId: { type: 'string', format: 'uuid' },
        },
      },
      CreateJobRequest: {
        type: 'object',
        required: ['title', 'description', 'companyId'],
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          location: { type: 'string' },
          employmentType: { type: 'string', enum: EMPLOYMENT_TYPES },
          salaryMin: { type: 'integer' },
          salaryMax: { type: 'integer' },
          status: { type: 'string', enum: JOB_STATUSES },
          companyId: { type: 'string', format: 'uuid' },
        },
      },
      Application: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          candidateId: { type: 'string', format: 'uuid' },
          jobId: { type: 'string', format: 'uuid' },
          status: { type: 'string', enum: APPLICATION_STATUSES },
        },
      },
      CreateApplicationRequest: {
        type: 'object',
        required: ['jobId'],
        properties: { jobId: { type: 'string', format: 'uuid' } },
      },
    },
  },
} as const;

const paths = {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        responses: { 200: { description: 'Service is healthy' } },
      },
    },
    '/auth/signin': {
      post: {
        tags: ['Auth'],
        summary: 'Sign in and receive an access + refresh token pair',
        requestBody: { required: true, content: jsonContent('#/components/schemas/SignInRequest') },
        responses: {
          200: { description: 'Authenticated', content: jsonContent('#/components/schemas/SuccessResponse') },
          401: { description: 'Invalid credentials', content: jsonContent('#/components/schemas/ErrorResponse') },
        },
      },
    },
    '/auth/signup': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new candidate account',
        requestBody: { required: true, content: jsonContent('#/components/schemas/SignUpRequest') },
        responses: {
          201: { description: 'Account created', content: jsonContent('#/components/schemas/SuccessResponse') },
          409: { description: 'Email already registered', content: jsonContent('#/components/schemas/ErrorResponse') },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Exchange a refresh token for a new token pair',
        requestBody: { required: true, content: jsonContent('#/components/schemas/RefreshRequest') },
        responses: { 200: { description: 'New token pair' }, 401: { description: 'Invalid refresh token' } },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Invalidate the current refresh token',
        security: bearerAuth,
        responses: { 200: { description: 'Logged out' }, 401: { description: 'Unauthorized' } },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get the currently authenticated user',
        security: bearerAuth,
        responses: { 200: { description: 'Current user' }, 401: { description: 'Unauthorized' } },
      },
    },
    '/auth/verify-email': {
      post: {
        tags: ['Auth'],
        summary: 'Verify email with OTP token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'token'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  token: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Email verified' }, 400: { description: 'Invalid token' } },
      },
    },
    '/auth/resend-verification': {
      post: {
        tags: ['Auth'],
        summary: 'Resend email verification OTP',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: { email: { type: 'string', format: 'email' } },
              },
            },
          },
        },
        responses: { 200: { description: 'Verification email sent' } },
      },
    },
    '/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Request a password reset email',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: { email: { type: 'string', format: 'email' } },
              },
            },
          },
        },
        responses: { 200: { description: 'Reset email sent if account exists' } },
      },
    },
    '/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Reset password with token from email',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token', 'password'],
                properties: {
                  token: { type: 'string' },
                  password: { type: 'string', minLength: 8 },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Password updated' }, 400: { description: 'Invalid token' } },
      },
    },
    '/users/me': {
      get: {
        tags: ['Users'],
        summary: 'Get current user profile',
        security: bearerAuth,
        responses: { 200: { description: 'Current user' }, 401: { description: 'Unauthorized' } },
      },
      delete: {
        tags: ['Users'],
        summary: 'Delete the current user account',
        security: bearerAuth,
        responses: { 200: { description: 'Account deleted' }, 401: { description: 'Unauthorized' } },
      },
    },
    '/users/me/password': {
      patch: {
        tags: ['Users'],
        summary: 'Change the current user password',
        security: bearerAuth,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['currentPassword', 'newPassword'],
                properties: {
                  currentPassword: { type: 'string' },
                  newPassword: { type: 'string', minLength: 8 },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Password changed' }, 401: { description: 'Unauthorized' } },
      },
    },
    '/employers/signup': {
      post: {
        tags: ['Employer Auth'],
        summary: 'Register a new employer account',
        requestBody: { required: true, content: jsonContent('#/components/schemas/SignUpRequest') },
        responses: {
          201: { description: 'Employer created' },
          409: { description: 'Email already registered' },
        },
      },
    },
    '/employers/signin': {
      post: {
        tags: ['Employer Auth'],
        summary: 'Sign in as an employer',
        requestBody: { required: true, content: jsonContent('#/components/schemas/SignInRequest') },
        responses: { 200: { description: 'Signed in' }, 403: { description: 'Not an employer account' } },
      },
    },
    '/employer/company': {
      post: {
        tags: ['Employer'],
        summary: 'Create the employer company (one per employer)',
        security: bearerAuth,
        requestBody: { required: true, content: jsonContent('#/components/schemas/EmployerCompanyRequest') },
        responses: { 201: { description: 'Created' }, 409: { description: 'Already owns a company' } },
      },
      get: {
        tags: ['Employer'],
        summary: 'Get the employer company',
        security: bearerAuth,
        responses: { 200: { description: 'Company' }, 404: { description: 'No company yet' } },
      },
      put: {
        tags: ['Employer'],
        summary: 'Update the employer company',
        security: bearerAuth,
        requestBody: { required: true, content: jsonContent('#/components/schemas/EmployerCompanyRequest') },
        responses: { 200: { description: 'Updated' } },
      },
      delete: {
        tags: ['Employer'],
        summary: 'Delete the employer company (cascades jobs)',
        security: bearerAuth,
        responses: { 200: { description: 'Deleted' } },
      },
    },
    '/employer/jobs': {
      post: {
        tags: ['Employer'],
        summary: 'Post a job under the employer company',
        security: bearerAuth,
        requestBody: { required: true, content: jsonContent('#/components/schemas/EmployerJobRequest') },
        responses: { 201: { description: 'Created' } },
      },
      get: {
        tags: ['Employer'],
        summary: "List the employer's own jobs",
        security: bearerAuth,
        responses: { 200: { description: 'Paginated jobs' } },
      },
    },
    '/employer/jobs/{id}': {
      get: {
        tags: ['Employer'],
        summary: 'Get one of the employer jobs',
        security: bearerAuth,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Job' }, 404: { description: 'Not found' } },
      },
      put: {
        tags: ['Employer'],
        summary: 'Update one of the employer jobs',
        security: bearerAuth,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: { required: true, content: jsonContent('#/components/schemas/EmployerJobRequest') },
        responses: { 200: { description: 'Updated' } },
      },
      delete: {
        tags: ['Employer'],
        summary: 'Delete one of the employer jobs',
        security: bearerAuth,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Deleted' } },
      },
    },
    '/employer/jobs/{id}/publish': {
      patch: {
        tags: ['Employer'],
        summary: 'Publish a job',
        security: bearerAuth,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Published' } },
      },
    },
    '/employer/jobs/{id}/close': {
      patch: {
        tags: ['Employer'],
        summary: 'Close a job',
        security: bearerAuth,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Closed' } },
      },
    },
    '/employer/applicants': {
      get: {
        tags: ['Employer'],
        summary: 'List applicants to the employer jobs',
        security: bearerAuth,
        responses: { 200: { description: 'Paginated applicants' } },
      },
    },
    '/employer/applicants/{id}': {
      get: {
        tags: ['Employer'],
        summary: 'Get an applicant (with status timeline)',
        security: bearerAuth,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Applicant' }, 404: { description: 'Not found' } },
      },
    },
    '/employer/applications/{id}/status': {
      patch: {
        tags: ['Employer'],
        summary: 'Change an applicant status (own jobs only)',
        security: bearerAuth,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: jsonContent('#/components/schemas/UpdateApplicationStatusRequest'),
        },
        responses: { 200: { description: 'Updated' }, 404: { description: 'Not found' } },
      },
    },
    '/employer/dashboard': {
      get: {
        tags: ['Employer'],
        summary: 'Employer hiring analytics',
        security: bearerAuth,
        responses: { 200: { description: 'Dashboard', content: jsonContent('#/components/schemas/EmployerDashboard') } },
      },
    },
    '/employer/analytics': {
      get: {
        tags: ['Employer'],
        summary: 'Employer hiring analytics (charts & trends)',
        security: bearerAuth,
        responses: { 200: { description: 'Analytics data' } },
      },
    },
    '/candidates/profile': {
      get: {
        tags: ['Candidates'],
        summary: 'Get the current candidate profile',
        security: bearerAuth,
        responses: {
          200: { description: 'Profile', content: jsonContent('#/components/schemas/CandidateProfile') },
          401: { description: 'Unauthorized' },
        },
      },
      put: {
        tags: ['Candidates'],
        summary: 'Update the current candidate profile',
        security: bearerAuth,
        requestBody: { required: true, content: jsonContent('#/components/schemas/UpdateProfileRequest') },
        responses: { 200: { description: 'Updated profile' }, 401: { description: 'Unauthorized' } },
      },
    },
    '/jobs': {
      get: {
        tags: ['Jobs'],
        summary: 'List jobs (cached for 5 minutes when unfiltered)',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: JOB_STATUSES } },
          { name: 'employmentType', in: 'query', schema: { type: 'string', enum: EMPLOYMENT_TYPES } },
          { name: 'companyId', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'city', in: 'query', schema: { type: 'string' } },
          { name: 'location', in: 'query', schema: { type: 'string' } },
          { name: 'salaryMin', in: 'query', schema: { type: 'integer' } },
          { name: 'salaryMax', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { 200: { description: 'Paginated jobs' } },
      },
      post: {
        tags: ['Jobs'],
        summary: 'Create a job (Admin only)',
        security: bearerAuth,
        requestBody: { required: true, content: jsonContent('#/components/schemas/CreateJobRequest') },
        responses: { 201: { description: 'Created' }, 401: { description: 'Unauthorized' } },
      },
    },
    '/jobs/{id}/view': {
      post: {
        tags: ['Jobs'],
        summary: 'Record a job view (analytics)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'View recorded' }, 404: { description: 'Not found' } },
      },
    },
    '/jobs/{id}': {
      get: {
        tags: ['Jobs'],
        summary: 'Get a job by id',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Job' }, 404: { description: 'Not found' } },
      },
      put: {
        tags: ['Jobs'],
        summary: 'Update a job (Admin only)',
        security: bearerAuth,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: { content: jsonContent('#/components/schemas/CreateJobRequest') },
        responses: { 200: { description: 'Updated' }, 404: { description: 'Not found' } },
      },
      delete: {
        tags: ['Jobs'],
        summary: 'Delete a job (Admin only)',
        security: bearerAuth,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Deleted' }, 404: { description: 'Not found' } },
      },
    },
    '/companies': {
      get: {
        tags: ['Companies'],
        summary: 'List companies',
        responses: { 200: { description: 'Paginated companies' } },
      },
      post: {
        tags: ['Companies'],
        summary: 'Create a company (Admin only)',
        security: bearerAuth,
        requestBody: { required: true, content: jsonContent('#/components/schemas/CreateCompanyRequest') },
        responses: { 201: { description: 'Created' } },
      },
    },
    '/companies/{id}': {
      get: {
        tags: ['Companies'],
        summary: 'Get a company by id',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Company' }, 404: { description: 'Not found' } },
      },
      put: {
        tags: ['Companies'],
        summary: 'Update a company (Admin only)',
        security: bearerAuth,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: { content: jsonContent('#/components/schemas/UpdateCompanyRequest') },
        responses: { 200: { description: 'Updated' }, 404: { description: 'Not found' } },
      },
      delete: {
        tags: ['Companies'],
        summary: 'Delete a company (Admin only)',
        security: bearerAuth,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Deleted' }, 404: { description: 'Not found' } },
      },
    },
    '/applications': {
      get: {
        tags: ['Applications'],
        summary: 'List applications (candidates see their own)',
        security: bearerAuth,
        responses: { 200: { description: 'Paginated applications' } },
      },
      post: {
        tags: ['Applications'],
        summary: 'Apply to a job (Candidate)',
        security: bearerAuth,
        requestBody: { required: true, content: jsonContent('#/components/schemas/CreateApplicationRequest') },
        responses: { 201: { description: 'Created' }, 409: { description: 'Already applied' } },
      },
    },
    '/applications/my': {
      get: {
        tags: ['Applications'],
        summary: "The current candidate's applications",
        security: bearerAuth,
        responses: { 200: { description: 'Paginated applications' }, 401: { description: 'Unauthorized' } },
      },
    },
    '/applications/{id}': {
      get: {
        tags: ['Applications'],
        summary: 'Get an application by id (includes status timeline)',
        security: bearerAuth,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Application' }, 404: { description: 'Not found' } },
      },
    },
    '/applications/{id}/status': {
      patch: {
        tags: ['Applications'],
        summary: 'Change an application status (Admin only)',
        security: bearerAuth,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: jsonContent('#/components/schemas/UpdateApplicationStatusRequest'),
        },
        responses: { 200: { description: 'Updated application' }, 403: { description: 'Forbidden' } },
      },
    },
    '/admin/dashboard': {
      get: {
        tags: ['Admin'],
        summary: 'Aggregated platform metrics',
        security: bearerAuth,
        responses: { 200: { description: 'Dashboard metrics' }, 403: { description: 'Forbidden' } },
      },
    },
    '/admin/jobs': {
      get: { tags: ['Admin'], summary: 'All jobs', security: bearerAuth, responses: { 200: { description: 'Jobs' } } },
    },
    '/admin/applications': {
      get: { tags: ['Admin'], summary: 'All applications', security: bearerAuth, responses: { 200: { description: 'Applications' } } },
    },
    '/admin/companies': {
      get: { tags: ['Admin'], summary: 'All companies', security: bearerAuth, responses: { 200: { description: 'Companies' } } },
    },
    '/admin/users': {
      get: {
        tags: ['Admin'],
        summary: 'List all users',
        security: bearerAuth,
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
          { name: 'role', in: 'query', schema: { type: 'string', enum: USER_ROLES } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Paginated users' } },
      },
    },
    '/admin/users/{id}/status': {
      patch: {
        tags: ['Admin'],
        summary: 'Activate or deactivate a user',
        security: bearerAuth,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['isActive'],
                properties: { isActive: { type: 'boolean' } },
              },
            },
          },
        },
        responses: { 200: { description: 'User updated' } },
      },
    },
    '/admin/employers/pending': {
      get: {
        tags: ['Admin'],
        summary: 'List employers pending company verification',
        security: bearerAuth,
        responses: { 200: { description: 'Pending employers' } },
      },
    },
    '/admin/companies/{id}/verification': {
      patch: {
        tags: ['Admin'],
        summary: 'Approve or reject an employer company',
        security: bearerAuth,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: { type: 'string', enum: ['APPROVED', 'REJECTED'] },
                  note: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Verification updated' } },
      },
    },
    '/admin/analytics': {
      get: {
        tags: ['Admin'],
        summary: 'Platform analytics',
        security: bearerAuth,
        responses: { 200: { description: 'Analytics' } },
      },
    },
    '/admin/categories': {
      get: {
        tags: ['Admin'],
        summary: 'Job categories with live counts from the database',
        security: bearerAuth,
        responses: { 200: { description: 'Categories' } },
      },
    },
    '/admin/revenue': {
      get: {
        tags: ['Admin'],
        summary: 'Revenue & billing metrics',
        security: bearerAuth,
        responses: { 200: { description: 'Revenue data' } },
      },
    },
    '/public/stats': {
      get: {
        tags: ['Public'],
        summary: 'Public platform statistics',
        responses: { 200: { description: 'Stats' } },
      },
    },
    '/plans': {
      get: {
        tags: ['Billing'],
        summary: 'List available subscription plans',
        responses: { 200: { description: 'Plans' } },
      },
    },
    '/employer/billing/overview': {
      get: {
        tags: ['Billing'],
        summary: 'Employer billing overview (plan, usage, payment instructions)',
        security: bearerAuth,
        responses: { 200: { description: 'Billing overview' } },
      },
    },
    '/employer/billing/activate-free': {
      post: {
        tags: ['Billing'],
        summary: 'Activate the free plan for an approved employer',
        security: bearerAuth,
        responses: { 200: { description: 'Free plan activated' } },
      },
    },
    '/employer/billing/payments/manual': {
      post: {
        tags: ['Billing'],
        summary: 'Submit manual payment proof (Easypaisa / JazzCash / bank)',
        security: bearerAuth,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['planId', 'paymentMethod', 'transactionReference'],
                properties: {
                  planId: { type: 'string', format: 'uuid' },
                  paymentMethod: { type: 'string', enum: ['EASYPAISA', 'JAZZCASH', 'BANK_TRANSFER'] },
                  transactionReference: { type: 'string' },
                  screenshotUrl: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Payment submitted for verification' } },
      },
    },
    '/employer/billing/checkout/stripe': {
      post: {
        tags: ['Billing'],
        summary: 'Start Stripe checkout for a plan',
        security: bearerAuth,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['planId', 'successUrl', 'cancelUrl'],
                properties: {
                  planId: { type: 'string', format: 'uuid' },
                  successUrl: { type: 'string', format: 'uri' },
                  cancelUrl: { type: 'string', format: 'uri' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Stripe checkout URL' } },
      },
    },
    '/employer/billing/upgrade': {
      post: {
        tags: ['Billing'],
        summary: 'Request a plan upgrade',
        security: bearerAuth,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['planId'],
                properties: { planId: { type: 'string', format: 'uuid' } },
              },
            },
          },
        },
        responses: { 200: { description: 'Upgrade requested' } },
      },
    },
    '/employer/billing/downgrade': {
      post: {
        tags: ['Billing'],
        summary: 'Schedule a plan downgrade',
        security: bearerAuth,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['planId'],
                properties: { planId: { type: 'string', format: 'uuid' } },
              },
            },
          },
        },
        responses: { 200: { description: 'Downgrade scheduled' } },
      },
    },
    '/admin/billing/plans': {
      get: {
        tags: ['Billing'],
        summary: 'Admin — list all plans',
        security: bearerAuth,
        responses: { 200: { description: 'Plans' } },
      },
      post: {
        tags: ['Billing'],
        summary: 'Admin — create a plan',
        security: bearerAuth,
        responses: { 201: { description: 'Plan created' } },
      },
    },
    '/admin/billing/plans/{id}': {
      put: {
        tags: ['Billing'],
        summary: 'Admin — update a plan',
        security: bearerAuth,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Plan updated' } },
      },
      delete: {
        tags: ['Billing'],
        summary: 'Admin — delete a plan',
        security: bearerAuth,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Plan deleted' } },
      },
    },
    '/admin/billing/subscriptions': {
      get: {
        tags: ['Billing'],
        summary: 'Admin — list subscriptions',
        security: bearerAuth,
        responses: { 200: { description: 'Subscriptions' } },
      },
    },
    '/admin/billing/payments': {
      get: {
        tags: ['Billing'],
        summary: 'Admin — list manual payments',
        security: bearerAuth,
        responses: { 200: { description: 'Payments' } },
      },
    },
    '/admin/billing/payments/{id}/verify': {
      patch: {
        tags: ['Billing'],
        summary: 'Admin — verify or reject a manual payment',
        security: bearerAuth,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: { type: 'string', enum: ['VERIFIED', 'REJECTED'] },
                  note: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Payment updated' } },
      },
    },
    '/uploads/avatar': {
      post: {
        tags: ['Uploads'],
        summary: 'Upload candidate avatar (PNG, JPG, JPEG, WEBP — max 5MB)',
        security: bearerAuth,
        requestBody: multipartFileBody,
        responses: { 201: { description: 'Avatar uploaded' }, 401: { description: 'Unauthorized' } },
      },
      delete: {
        tags: ['Uploads'],
        summary: 'Remove candidate avatar',
        security: bearerAuth,
        responses: { 200: { description: 'Avatar removed' }, 401: { description: 'Unauthorized' } },
      },
    },
    '/uploads/resume': {
      post: {
        tags: ['Uploads'],
        summary: 'Upload candidate resume (PDF, DOC, DOCX — max 10MB)',
        security: bearerAuth,
        requestBody: multipartFileBody,
        responses: { 201: { description: 'Resume uploaded' }, 401: { description: 'Unauthorized' } },
      },
      delete: {
        tags: ['Uploads'],
        summary: 'Remove candidate resume',
        security: bearerAuth,
        responses: { 200: { description: 'Resume removed' }, 401: { description: 'Unauthorized' } },
      },
    },
    '/uploads/company-logo': {
      post: {
        tags: ['Uploads'],
        summary: 'Upload company logo (PNG, JPG, SVG, WEBP — max 5MB)',
        security: bearerAuth,
        requestBody: multipartFileBody,
        responses: { 201: { description: 'Logo uploaded' }, 401: { description: 'Unauthorized' } },
      },
      delete: {
        tags: ['Uploads'],
        summary: 'Remove company logo',
        security: bearerAuth,
        responses: { 200: { description: 'Logo removed' }, 401: { description: 'Unauthorized' } },
      },
    },
    '/uploads/payment-proof': {
      post: {
        tags: ['Uploads'],
        summary: 'Upload payment screenshot (PNG, JPG, WEBP — max 5MB)',
        security: bearerAuth,
        requestBody: multipartFileBody,
        responses: { 201: { description: 'Payment proof uploaded' }, 401: { description: 'Unauthorized' } },
      },
    },
    '/uploads/verification-document': {
      post: {
        tags: ['Uploads'],
        summary: 'Upload employer verification document (PDF, PNG, JPG — max 10MB)',
        security: bearerAuth,
        requestBody: multipartFileBody,
        responses: { 201: { description: 'Document uploaded' }, 401: { description: 'Unauthorized' } },
      },
    },
};

export const swaggerSpec = {
  ...openApiDefinition,
  paths,
};

/** Mounts Swagger UI at `/api-docs`. */
export function setupSwagger(app: Express): void {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec as Record<string, unknown>, {
    customSiteTitle: 'Pakistan Career Hub API Docs',
  }));
  // Raw spec for tooling / client generation.
  app.get('/api-docs.json', (_req, res) => res.json(swaggerSpec));
}
