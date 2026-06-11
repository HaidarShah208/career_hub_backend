import { ApplicationStatus } from '../constants';
import { env } from '../../config/env';
import { logger } from '../logger';
import { applicationsRepository } from '../../modules/applications/applications.repository';
import { candidatesRepository } from '../../modules/candidates/candidates.repository';
import { companiesRepository } from '../../modules/companies/companies.repository';
import { jobsRepository } from '../../modules/jobs/jobs.repository';
import { usersRepository } from '../../modules/users/users.repository';
import { emailService } from './email.service';

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function frontendUrl(path: string): string {
  const base = env.FRONTEND_URL.replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  [ApplicationStatus.APPLIED]: 'Applied',
  [ApplicationStatus.UNDER_REVIEW]: 'Under review',
  [ApplicationStatus.SHORTLISTED]: 'Shortlisted',
  [ApplicationStatus.INTERVIEW_SCHEDULED]: 'Interview scheduled',
  [ApplicationStatus.REJECTED]: 'Not selected',
  [ApplicationStatus.HIRED]: 'Hired',
};

const STATUS_MESSAGES: Record<ApplicationStatus, string> = {
  [ApplicationStatus.APPLIED]: 'Your application has been received.',
  [ApplicationStatus.UNDER_REVIEW]: 'Your application is being reviewed by the hiring team.',
  [ApplicationStatus.SHORTLISTED]: 'Great news — you have been shortlisted for this role.',
  [ApplicationStatus.INTERVIEW_SCHEDULED]:
    'An interview has been scheduled (or is being arranged) for this position.',
  [ApplicationStatus.REJECTED]:
    'Unfortunately, your application was not selected to move forward at this time.',
  [ApplicationStatus.HIRED]: 'Congratulations — you have been hired for this position!',
};

function formatSkills(skills?: string[] | null): string {
  if (!skills?.length) return '—';
  return skills.join(', ');
}

function row(label: string, value: string): string {
  return `<tr><td style="padding:6px 12px 6px 0;color:#666;vertical-align:top">${esc(label)}</td><td style="padding:6px 0"><strong>${esc(value)}</strong></td></tr>`;
}

export class ApplicationEmailService {
  /** Notify the employer when a candidate applies to their job. */
  async notifyEmployerNewApplication(applicationId: string): Promise<void> {
    const application = await applicationsRepository.findById(applicationId);
    if (!application) return;

    const job = await jobsRepository.findById(application.jobId);
    if (!job?.companyId) return;

    const company = await companiesRepository.findByIdWithOwner(job.companyId);
    const employerEmail = company?.owner?.email;
    if (!employerEmail) return;

    const candidate =
      application.candidate ?? (await usersRepository.findById(application.candidateId));
    if (!candidate) return;

    const profile = await candidatesRepository.findByUserId(candidate.id);
    const candidateName = candidate.fullName;
    const companyName = company?.name ?? 'your company';
    const appliedAt = application.createdAt.toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' });
    const applicantUrl = frontendUrl(`/employer/applicants/${application.id}`);

    const html = `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <h2>New job application</h2>
        <p>Hi ${esc(company?.owner?.firstName ?? 'there')},</p>
        <p><strong>${esc(candidateName)}</strong> applied to <strong>${esc(job.title)}</strong> at ${esc(companyName)}.</p>
        <h3 style="margin-top:24px;font-size:16px">Job details</h3>
        <table style="font-size:14px;border-collapse:collapse">
          ${row('Position', job.title)}
          ${row('Company', companyName)}
          ${row('Location', job.location ?? '—')}
          ${row('Type', job.employmentType ?? '—')}
          ${row('Applied on', appliedAt)}
        </table>
        <h3 style="margin-top:24px;font-size:16px">Candidate details</h3>
        <table style="font-size:14px;border-collapse:collapse">
          ${row('Name', candidateName)}
          ${row('Email', candidate.email)}
          ${row('Headline', profile?.headline ?? '—')}
          ${row('City', profile?.city ?? '—')}
          ${row('Experience', profile ? `${profile.experienceYears} year(s)` : '—')}
          ${row('Skills', formatSkills(profile?.skills))}
          ${profile?.resumeUrl ? row('Resume', profile.resumeUrl) : ''}
        </table>
        <p style="margin-top:20px">
          <a href="${applicantUrl}" style="display:inline-block;padding:12px 24px;background:#16a34a;color:#fff;text-decoration:none;border-radius:6px">View application</a>
        </p>
      </div>
    `;

    const text = [
      `New application for ${job.title} at ${companyName}`,
      `Candidate: ${candidateName} (${candidate.email})`,
      profile?.headline ? `Headline: ${profile.headline}` : '',
      profile?.skills?.length ? `Skills: ${profile.skills.join(', ')}` : '',
      `View: ${applicantUrl}`,
    ]
      .filter(Boolean)
      .join('\n');

    await emailService.sendApplicationEmail(
      employerEmail,
      `New application — ${job.title} (${companyName})`,
      html,
      text,
      'NEW APPLICATION EMAIL',
    );
  }

  /** Notify the candidate when an employer updates their application status. */
  async notifyCandidateStatusChange(
    applicationId: string,
    status: ApplicationStatus,
    note?: string | null,
  ): Promise<void> {
    if (status === ApplicationStatus.APPLIED) return;

    const application = await applicationsRepository.findById(applicationId);
    if (!application) return;

    const job = await jobsRepository.findById(application.jobId);
    if (!job?.companyId) return;

    const company = await companiesRepository.findByIdWithOwner(job.companyId);
    const companyName = company?.name ?? 'the company';

    const candidate =
      application.candidate ?? (await usersRepository.findById(application.candidateId));
    if (!candidate?.email) return;

    const statusLabel = STATUS_LABELS[status];
    const statusMessage = STATUS_MESSAGES[status];
    const applicationsUrl = frontendUrl('/candidate/applications');

    const html = `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <h2>Application update</h2>
        <p>Hi ${esc(candidate.firstName)},</p>
        <p>There is an update on your application for <strong>${esc(job.title)}</strong> at <strong>${esc(companyName)}</strong>.</p>
        <p style="margin:16px 0;padding:12px 16px;background:#f4f4f5;border-radius:8px">
          <span style="display:block;font-size:12px;color:#666;text-transform:uppercase;letter-spacing:0.05em">Status</span>
          <strong style="font-size:18px">${esc(statusLabel)}</strong><br/>
          <span style="font-size:14px;color:#444">${esc(statusMessage)}</span>
        </p>
        <table style="font-size:14px;border-collapse:collapse;margin-top:8px">
          ${row('Job', job.title)}
          ${row('Company', companyName)}
          ${row('Location', job.location ?? '—')}
          ${note ? row('Note from employer', note) : ''}
        </table>
        <p style="margin-top:20px">
          <a href="${applicationsUrl}" style="display:inline-block;padding:12px 24px;background:#16a34a;color:#fff;text-decoration:none;border-radius:6px">View my applications</a>
        </p>
      </div>
    `;

    const text = [
      `Application update for ${job.title} at ${companyName}`,
      `Status: ${statusLabel}`,
      statusMessage,
      note ? `Note: ${note}` : '',
      `View applications: ${applicationsUrl}`,
    ]
      .filter(Boolean)
      .join('\n');

    await emailService.sendApplicationEmail(
      candidate.email,
      `Application update — ${job.title} at ${companyName}`,
      html,
      text,
      'APPLICATION STATUS EMAIL',
    );
  }
}

export const applicationEmailService = new ApplicationEmailService();

/** Fire-and-forget helper — email failures must not block API responses. */
export function sendApplicationEmailAsync(task: () => Promise<void>): void {
  task().catch((err) => {
    logger.error(`Application email failed: ${(err as Error).message}`);
  });
}
