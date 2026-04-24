/**
 * Layout Server Component para /admin/theme-editor
 * Bloqueia no servidor o acesso de admins não-Root.
 * Admins comuns são redirecionados de volta ao painel.
 */
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../api/auth/[...nextauth]/route';
import { isRootAdmin } from '../../../services/job.service';

export default async function ThemeEditorLayout({ children }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/');
  }

  const root = await isRootAdmin(session.user.id);
  if (!root) {
    // Admin comum: volta pro painel sem acesso ao editor
    redirect('/admin');
  }

  return children;
}
