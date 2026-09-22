import { useEffect, useState } from "react";
import { X, Phone, MessageCircle, Send, CheckCircle2 } from "lucide-react";
import type { Owner, Property } from "../data/types";
import { useLocale } from "../lib/useLocale";
import Avatar from "./Avatar";

interface Props {
  owner: Owner;
  property?: Property;
  open: boolean;
  onClose: () => void;
}

export default function ContactModal({ owner, property, open, onClose }: Props) {
  const { t, L } = useLocale();
  const [sent, setSent] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (open) {
      setSent(false);
      const base = t("contact.prefill");
      setMessage(
        property ? `${base}\n\n"${L(property.title)}"` : base,
      );
    }
  }, [open, property, t, L]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const waText = encodeURIComponent(message);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar
              src={owner.avatar}
              name={L(owner.name)}
              className="h-11 w-11 rounded-full ring-1 ring-ink-100"
            />
            <div>
              <p className="text-sm font-bold text-ink-900">
                {t("contact.title")} {L(owner.name)}
              </p>
              {property && (
                <p className="line-clamp-1 text-xs text-ink-500">
                  {t("contact.aboutProperty")}: {L(property.title)}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full text-ink-500 hover:bg-ink-100"
          >
            <X size={18} />
          </button>
        </div>

        {sent ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <CheckCircle2 size={48} className="text-emerald-500" />
            <p className="font-semibold text-ink-800">{t("contact.sent")}</p>
            <button className="btn-primary mt-2" onClick={onClose}>
              {t("common.close")}
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4 grid grid-cols-2 gap-2">
              <a href={`tel:${owner.phone}`} className="btn-outline">
                <Phone size={16} /> {t("contact.call")}
              </a>
              <a
                href={`https://wa.me/${owner.whatsapp}?text=${waText}`}
                target="_blank"
                rel="noreferrer"
                className="btn-whatsapp"
              >
                <MessageCircle size={16} /> {t("contact.whatsapp")}
              </a>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
              }}
              className="space-y-3"
            >
              <div>
                <label className="field-label">{t("contact.yourName")}</label>
                <input
                  className="input"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="field-label">{t("contact.yourPhone")}</label>
                <input
                  className="input"
                  required
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div>
                <label className="field-label">{t("contact.yourMessage")}</label>
                <textarea
                  className="input min-h-[96px]"
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
              <button type="submit" className="btn-primary w-full">
                <Send size={16} /> {t("contact.send")}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
