import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import type { StylistListItem } from '@/features/stylistInvite/stylistInvite.types';
import { stylistInviteService } from '@/services/stylistInvite.service';
import { Loader } from '@/components/common/Loader';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import StylistDetailsView from './StylistDetailsView';

const LIST_PATH = '/admin/stylists';

/** The paginated list is the one that includes the stylist's public URL name. */
async function findStylist(id?: string): Promise<StylistListItem | null> {
  for (let page = 1; ; page++) {
    const response = await stylistInviteService.getPaginatedStylists({ page, limit: 50 });
    const { data, pagination } = response.data.data;
    const match = data.find((item) => item.id === id);
    if (match) return match;
    if (page >= pagination.totalPages) return null;
  }
}

export default function StylistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [stylist, setStylist] = useState<StylistListItem | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'missing'>('loading');

  const listSearch = (location.state as { from?: string } | null)?.from ?? '';
  const backTo = `${LIST_PATH}${listSearch}`;

  useEffect(() => {
    let active = true;
    findStylist(id)
      .then((found) => {
        if (!active) return;
        setStylist(found);
        setLoadState(found ? 'ready' : 'missing');
      })
      .catch(() => active && setLoadState('missing'));
    return () => {
      active = false;
    };
  }, [id]);

  const title = stylist?.name || 'Manage Stylist';

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={stylist?.specialization}
        breadcrumbs={[{ label: 'Stylists', href: backTo }, { label: title }]}
        backTo={backTo}
      />
      {loadState === 'loading' && (
        <div className="flex justify-center py-16">
          <Loader label="Loading stylist" />
        </div>
      )}
      {loadState === 'missing' && (
        <div className="space-y-4 py-12 text-center">
          <p className="text-muted-foreground">This stylist could not be found.</p>
          <Button asChild variant="outline">
            <Link to={backTo}>Back to stylists</Link>
          </Button>
        </div>
      )}
      {loadState === 'ready' && stylist && (
        <StylistDetailsView stylist={stylist} onClose={() => navigate(backTo)} />
      )}
    </div>
  );
}
