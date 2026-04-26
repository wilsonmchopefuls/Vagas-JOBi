import { getApprovedJobs } from '../../services/job.service';
import { getAllFormConfig } from '../../services/form-config.service';
import MuralClient from './MuralClient';
import s from './mural.module.css';

export const metadata = {
  title: 'Mural Público — Trampo',
  description: 'Explore vagas e perfis de freelancers aprovados na comunidade.',
};

export default async function MuralPage() {
  const [jobs, config] = await Promise.all([
    getApprovedJobs(),
    getAllFormConfig()
  ]);

  return (
    <main className={s.page}>
      <MuralClient initialJobs={jobs} config={config} />
    </main>
  );
}
