import { useNavigate } from "react-router-dom";
import type { Property } from "../data/types";
import { useAuth } from "../context/AuthContext";
import { useMessaging } from "../context/MessagingContext";

export function useContactAgent() {
  const { user } = useAuth();
  const { startConversation } = useMessaging();
  const navigate = useNavigate();

  return async (property: Property) => {
    const loginNext = `/property/${property.slug}`;
    if (!user) {
      navigate(`/client/login?next=${encodeURIComponent(loginNext)}`);
      return;
    }
    if (user.role !== "CLIENT") {
      navigate("/client/login");
      return;
    }
    const conv = await startConversation({
      propertyId: property.id,
      propertySlug: property.slug,
      agentProfileId: property.ownerId,
    });
    if (conv) navigate(`/client/messages/${conv.id}`);
  };
}
