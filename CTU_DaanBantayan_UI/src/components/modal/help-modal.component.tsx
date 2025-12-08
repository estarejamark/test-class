"use client";
import React from "react";
import ModalWrapper from "../utils/modal-wrapper";
import {
  QuestionMarkCircleIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";

export default function HelpModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalWrapper
      title={
        <>
          <QuestionMarkCircleIcon className="inline w-5 h-5 mr-2" /> Help & FAQs
        </>
      }
      onClose={onClose}
      size="md"
      headerClass="bg-info">
      <h6 className="font-semibold text-info mb-2">
        <DocumentTextIcon className="inline w-4 h-4 me-1 mr-1" /> How can I
        check my grades?
      </h6>
      <p className="mb-3">
        Go to the <strong>“Grade Report”</strong> section after logging in.
        Select your grading period to view subject-wise scores.
      </p>

      <h6 className="font-semibold text-info mb-2">
        <CheckCircleIcon className="inline w-4 h-4 me-1 mr-1" /> Where can I see
        my attendance?
      </h6>
      <p className="mb-3">
        Visit the <strong>“Attendance Report”</strong> tab under your dashboard.
        You can view your presence, absence, and late entries.
      </p>

      <h6 className="font-semibold text-info mb-2">
        <PhoneIcon className="inline w-4 h-4 me-1 mr-1" /> Who should I contact
        for technical help?
      </h6>
      <p>
        Please refer to the contact modal or email the school&apos;s IT support
        team.
      </p>
    </ModalWrapper>
  );
}
