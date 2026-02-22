import { GroupDetailPageClient } from '@/components/group-detail-page';

export default async function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <GroupDetailPageClient groupId={id} />;
}
