import { useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import { selectUser } from '../../features/auth/authSlice.js';
import { useGetOrderQuery } from '../../features/orders/ordersApi.js';
import { AddMaterialPage } from './AddMaterialPage.jsx';
import './CartAwareAddMaterialPage.css';

export function CartAwareAddMaterialPage() {
  const { orderId, sectionId } = useParams();
  const user = useSelector(selectUser);
  const membership = (user?.memberships || []).find(item => item.status === 'ACTIVE');
  const {
    data: order,
    isLoading: orderLoading,
    isError: orderError,
    refetch: refetchOrder,
  } = useGetOrderQuery(orderId);
  const canEdit = order?.status === 'DRAFT' && (membership?.role === 'MANAGER' || order?.createdByMembershipId === membership?.id);
  const sectionItems = sectionId ? (order?.items || []).filter(item => item.sectionId === sectionId) : (order?.items || []);
  const shortcutPath = sectionId ? `/orders/${orderId}/sections/${sectionId}` : `/orders/${orderId}/cart`;

  return (
    <div className="materialCartShell">
      <AddMaterialPage order={order} orderLoading={orderLoading} orderError={orderError} refetchOrder={refetchOrder} />
      {canEdit ? (
        <Link className="materialCartShortcut" to={shortcutPath} aria-label={sectionId ? `Відкрити розділ: ${sectionItems.length} позицій` : `Відкрити кошик: ${sectionItems.length} позицій`}>
          <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 4h2l2 11h11l2-8H6" /><circle cx="9" cy="20" r="1" /><circle cx="18" cy="20" r="1" />
          </svg>
          {sectionItems.length ? <span className="materialCartBadge">{sectionItems.length > 99 ? '99+' : sectionItems.length}</span> : null}
        </Link>
      ) : null}
    </div>
  );
}
