import { useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import { selectUser } from '../../features/auth/authSlice.js';
import { useGetOrderQuery } from '../../features/orders/ordersApi.js';
import { AddMaterialPage } from './AddMaterialPage.jsx';
import './CartAwareAddMaterialPage.css';

export function CartAwareAddMaterialPage() {
  const { orderId } = useParams();
  const user = useSelector(selectUser);
  const membership = (user?.memberships || []).find(item => item.status === 'ACTIVE');
  const { data: order } = useGetOrderQuery(orderId);
  const canEdit = order?.status === 'DRAFT' && (membership?.role === 'MANAGER' || order?.createdByMembershipId === membership?.id);

  return (
    <div className="materialCartShell">
      <AddMaterialPage />
      {canEdit ? (
        <Link className="materialCartShortcut" to={`/orders/${orderId}/cart`} aria-label={`Відкрити кошик: ${order.items?.length || 0} позицій`}>
          <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 4h2l2 11h11l2-8H6" /><circle cx="9" cy="20" r="1" /><circle cx="18" cy="20" r="1" />
          </svg>
          {order.items?.length ? <span className="materialCartBadge">{order.items.length > 99 ? '99+' : order.items.length}</span> : null}
        </Link>
      ) : null}
    </div>
  );
}
