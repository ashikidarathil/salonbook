import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { branchService } from '@/services/branch.service';

interface BranchPageHeaderProps {
  branchId?: string;
  title: string;
}

/** Header for a branch's inner pages: Branches > branch name > this page. */
export function BranchPageHeader({ branchId, title }: BranchPageHeaderProps) {
  const location = useLocation();
  const [branchName, setBranchName] = useState('');
  const listSearch = (location.state as { from?: string } | null)?.from ?? '';
  const backTo = `/admin/branches${listSearch}`;

  useEffect(() => {
    let active = true;
    branchService
      .list(true)
      .then((response) => {
        const branch = response.data.data.find((item) => item.id === branchId);
        if (active && branch) setBranchName(branch.name);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [branchId]);

  return (
    <PageHeader
      title={title}
      description={branchName || undefined}
      breadcrumbs={[
        { label: 'Branches', href: backTo },
        ...(branchName ? [{ label: branchName, href: `/admin/branches/${branchId}/edit` }] : []),
        { label: title },
      ]}
      backTo={backTo}
    />
  );
}
