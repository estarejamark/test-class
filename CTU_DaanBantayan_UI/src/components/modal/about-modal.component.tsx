"use client";
import React from "react";

import {
  InformationCircleIcon,
  AcademicCapIcon,
  UserIcon,
  ClipboardDocumentCheckIcon,
} from "@heroicons/react/24/outline";
import ModalWrapper from "../utils/modal-wrapper";

export default function AboutModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalWrapper
      title={
        <>
          <InformationCircleIcon className="inline w-5 h-5 mr-2" /> About the
          System
        </>
      }
      onClose={onClose}
      size="lg"
      headerClass="bg-info">
      <h6 className="font-semibold text-info mb-2">
        <AcademicCapIcon className="inline w-4 h-4 mr-1" /> What is MCMT?
      </h6>
      <p className="mb-3">
        <strong>Multifunctional Classroom Management Tool (MCMT)</strong> is a digital
        platform designed for Academia de San Martin to improve the recording
        and monitoring of academic progress.
      </p>

      <h6 className="font-semibold text-info mb-2">
        <UserIcon className="inline w-4 h-4 mr-1" /> Who uses it?
      </h6>
      <ul className="list-disc pl-5 space-y-2 mb-3 text-sm text-foreground/90">
        <li>Teachers encode grades, manage attendance, and give feedback</li>
        <li>
          Students view grades, attendance summaries, and teacher messages
        </li>
        <li>Admins oversee academic data and generate reports</li>
      </ul>

      <h6 className="font-semibold text-info mb-2">
        <ClipboardDocumentCheckIcon className="inline w-4 h-4 mr-1" /> Why it
        matters
      </h6>
      <p>
        The goal is to enhance transparency, reduce paperwork, and empower
        students in their academic journey.
      </p>
    </ModalWrapper>
  );
}
