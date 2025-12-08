"use client";
import React, { useState } from "react";
import {
  EnvelopeIcon,
  PhoneIcon,
  ClockIcon,
  MapPinIcon,
  ChatBubbleBottomCenterTextIcon,
} from "@heroicons/react/24/outline";
import ModalWrapper from "../utils/modal-wrapper";

export default function ContactModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      console.log("contact message", { name, email, message });
      await new Promise((r) => setTimeout(r, 600));
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalWrapper
      title={
        <>
          <EnvelopeIcon className="inline w-5 h-5 mr-2" /> Contact Us
        </>
      }
      onClose={onClose}
      size="md"
      headerClass="bg-info">
      <div className="text-sm text-foreground/90 space-y-3">
        <p>
          <EnvelopeIcon className="inline w-4 h-4 mr-1 text-info" />{" "}
          <strong>Email:</strong> adsm@school.edu.ph
        </p>
        <p>
          <PhoneIcon className="inline w-4 h-4 mr-1 text-info" />{" "}
          <strong>Phone:</strong> (032) 123-4567
        </p>
        <p>
          <ClockIcon className="inline w-4 h-4 mr-1 text-info" />{" "}
          <strong>Office Hours:</strong> Mon–Fri, 8:00 AM – 5:00 PM
        </p>
        <p>
          <MapPinIcon className="inline w-4 h-4 mr-1 text-info" />{" "}
          <strong>Address:</strong> Academia de San Martin, Poblacion,
          Daanbantayan, Cebu
        </p>

        <hr />

        <h6 className="font-semibold text-info mb-2">
          <ChatBubbleBottomCenterTextIcon className="inline w-4 h-4 mr-1" />{" "}
          Send us a message
        </h6>
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label htmlFor="contactName" className="block text-sm mb-1">
              Name
            </label>
            <input
              id="contactName"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label htmlFor="contactEmail" className="block text-sm mb-1">
              Email address
            </label>
            <input
              id="contactEmail"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label htmlFor="contactMessage" className="block text-sm mb-1">
              Message
            </label>
            <textarea
              id="contactMessage"
              rows={4}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 rounded border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded bg-card text-foreground border border-border">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded bg-info text-white disabled:opacity-60">
              {submitting ? "Sending…" : "Send"}
            </button>
          </div>
        </form>
      </div>
    </ModalWrapper>
  );
}
