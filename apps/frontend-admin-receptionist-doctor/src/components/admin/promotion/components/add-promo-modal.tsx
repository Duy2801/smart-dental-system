import { PromoFormModal } from "./promo-form-modal";
import type { SavePromotionPayload } from "../types";

export function AddPromoModal({
  onAdd,
  onClose,
}: {
  onAdd: (payload: SavePromotionPayload) => void;
  onClose: () => void;
}) {
  return (
    <PromoFormModal
      onClose={onClose}
      onSubmit={onAdd}
      submitting={false}
    />
  );
}
