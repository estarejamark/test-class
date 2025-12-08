"use client";
import React, { JSX, useEffect, useState } from "react";
import { MotionCard } from "../utils/motion-wrapper";
import {
  AcademicCapIcon,
  ClockIcon,
  DocumentTextIcon,
  LockClosedIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/solid";
import { settingsService } from "@/services/settings.service";
import { SchoolProfile } from "@/types/settings";

export default function LandingCards(): JSX.Element {
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchoolProfile = async () => {
      try {
        const profile = await settingsService.getSchoolProfile();
        setSchoolProfile(profile);
      } catch (error) {
        console.error('Failed to fetch school profile:', error);
        // Fallback to default values if API fails
      } finally {
        setLoading(false);
      }
    };

    fetchSchoolProfile();
  }, []);

  const address = schoolProfile?.address || "Poblacion, Daanbantayan, Cebu";
  const contactInfo = schoolProfile?.contactInfo || "(032) 123-4567";
  const email = schoolProfile?.email || "adsm@school.edu.ph";
  const officeHours = schoolProfile?.officeHours || "Mon–Fri, 7:00 AM – 4:00 PM";

  return (
    <section className="py-10 px-4 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* About the System */}
        <MotionCard>
          <div className="card-body">
            <h2 className="card-title text-gray-800">About the System</h2>
            <p className="text-gray-600 text-sm">
              The Multifunctional Classroom Management Tool (MCMT) helps Academia de
              San Martin securely manage and streamline academic evaluation.
              Teachers encode grades and attendance, students view progress, and
              admins monitor records in real time.
            </p>
          </div>
        </MotionCard>

        {/* Features Overview */}
        <MotionCard>
          <div className="card-body">
            <h2 className="card-title text-gray-800">Features Overview</h2>
            <ul className="space-y-4 text-gray-600 text-sm">
              <li className="flex gap-3 items-start">
                <AcademicCapIcon className="w-8 h-8 text-primary" />
                <div>
                  <strong>Grade Tracking:</strong> View and manage quarterly,
                  quarter, or yearly grades
                </div>
              </li>
              <li className="flex gap-3 items-start">
                <ClockIcon className="w-8 h-8 text-primary" />
                <div>
                  <strong>Attendance Monitoring:</strong> Record and review
                  attendance data with summaries
                </div>
              </li>
              <li className="flex gap-3 items-start">
                <DocumentTextIcon className="w-8 h-8 text-primary" />
                <div>
                  <strong>Report Generation:</strong> Printable performance and
                  attendance reports
                </div>
              </li>
              <li className="flex gap-3 items-start">
                <LockClosedIcon className="w-8 h-8 text-primary" />
                <div>
                  <strong>Secure Login:</strong> Role-based access for Admin,
                  Teacher, and Student
                </div>
              </li>
            </ul>
          </div>
        </MotionCard>

        {/* Contact & Support */}
        <MotionCard>
          <div className="card-body">
            <h2 className="card-title text-gray-800">Contact & Support</h2>
            <ul className="space-y-4 text-gray-600 text-sm">
              <li className="flex gap-3 items-start">
                <MapPinIcon className="w-5 h-5 text-primary" />
                <div>
                  <strong>Address:</strong> {address}
                </div>
              </li>
              <li className="flex gap-3 items-start">
                <PhoneIcon className="w-5 h-5 text-primary" />
                <div>
                  <strong>Phone:</strong> {contactInfo}
                </div>
              </li>
              <li className="flex gap-3 items-start">
                <EnvelopeIcon className="w-5 h-5 text-primary" />
                <div>
                  <strong>Email:</strong> {email}
                </div>
              </li>
              <li className="flex gap-3 items-start">
                <ClockIcon className="w-6 h-6 text-primary" />
                <div>
                  <strong>Office Hours:</strong> {officeHours}
                </div>
              </li>
            </ul>
          </div>
        </MotionCard>

        {/* Announcements */}
        <MotionCard>
          <div className="card-body">
            <h2 className="card-title text-gray-800">Announcements</h2>
            <p className="text-gray-600 text-sm">
              School notices, login issues, upcoming events.
            </p>
          </div>
        </MotionCard>
      </div>
    </section>
  );
}
