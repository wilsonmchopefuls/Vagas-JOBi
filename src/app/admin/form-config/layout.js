/**
 * Layout guard para /admin/form-config
 * Permite acesso a admins comuns E Root Admin.
 */
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../api/auth/[...nextauth]/route';
import { isAdmin } from '../../../services/job.service';

export default async function FormConfigLayout({ children }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/');
  const ok = await isAdmin(session.user.id);
  if (!ok) redirect('/admin');
  return children;
}
