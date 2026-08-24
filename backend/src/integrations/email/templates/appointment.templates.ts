import { renderBaseEmailTemplate } from './base.template.js';

export function renderBookingConfirmationEmail(data: {
  recipientName: string;
  isDoctor: boolean;
  patientName: string;
  doctorName: string;
  specialization: string;
  appointmentNumber: string;
  dateStr: string;
  timeStr: string;
  chiefComplaint?: string;
  frontendUrl: string;
}) {
  const title = `Appointment Confirmation - ${data.appointmentNumber}`;
  const body = `
    <h2>${data.isDoctor ? 'New Consultation Scheduled' : 'Your Appointment is Confirmed!'}</h2>
    <p>Dear ${data.recipientName},</p>
    <p>${
      data.isDoctor
        ? `A new appointment has been booked with patient <strong>${data.patientName}</strong>.`
        : `Your appointment with <strong>${data.doctorName}</strong> (${data.specialization}) has been successfully confirmed.`
    }</p>

    <div class="info-card">
      <div class="info-row">
        <span class="info-label">Appointment #:</span>
        <span class="info-value">${data.appointmentNumber}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Doctor:</span>
        <span class="info-value">${data.doctorName} (${data.specialization})</span>
      </div>
      <div class="info-row">
        <span class="info-label">Patient:</span>
        <span class="info-value">${data.patientName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Date:</span>
        <span class="info-value">${data.dateStr}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Time:</span>
        <span class="info-value">${data.timeStr} UTC</span>
      </div>
      ${
        data.chiefComplaint
          ? `
      <div class="info-row">
        <span class="info-label">Chief Complaint:</span>
        <span class="info-value">${data.chiefComplaint}</span>
      </div>
      `
          : ''
      }
    </div>

    <p style="text-align: center;">
      <a href="${data.frontendUrl}/dashboard" class="btn">View Appointment in Portal</a>
    </p>

    <p style="font-size: 13px; color: #64748b;">
      Please arrive or join 5 minutes before your scheduled slot time. If you need to reschedule or cancel, you can do so directly from your portal dashboard.
    </p>
  `;

  return renderBaseEmailTemplate(title, body);
}

export function renderCancellationEmail(data: {
  recipientName: string;
  appointmentNumber: string;
  doctorName: string;
  patientName: string;
  dateStr: string;
  timeStr: string;
  reason: string;
  cancelledBy: string;
  frontendUrl: string;
}) {
  const title = `Appointment Cancelled - ${data.appointmentNumber}`;
  const body = `
    <h2 style="color: #e11d48;">Appointment Cancelled</h2>
    <p>Dear ${data.recipientName},</p>
    <p>Please be advised that the following appointment has been cancelled by ${data.cancelledBy}.</p>

    <div class="info-card" style="border-left-color: #e11d48;">
      <div class="info-row">
        <span class="info-label">Appointment #:</span>
        <span class="info-value">${data.appointmentNumber}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Doctor:</span>
        <span class="info-value">${data.doctorName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Original Date:</span>
        <span class="info-value">${data.dateStr} at ${data.timeStr} UTC</span>
      </div>
      <div class="info-row">
        <span class="info-label">Reason:</span>
        <span class="info-value">${data.reason}</span>
      </div>
    </div>

    <p style="text-align: center;">
      <a href="${data.frontendUrl}/doctors" class="btn">Book Another Appointment</a>
    </p>
  `;

  return renderBaseEmailTemplate(title, body);
}

export function renderRescheduleEmail(data: {
  recipientName: string;
  appointmentNumber: string;
  doctorName: string;
  patientName: string;
  newDateStr: string;
  newTimeStr: string;
  reason?: string;
  frontendUrl: string;
}) {
  const title = `Appointment Rescheduled - ${data.appointmentNumber}`;
  const body = `
    <h2 style="color: #0d9488;">Appointment Rescheduled</h2>
    <p>Dear ${data.recipientName},</p>
    <p>Your appointment has been successfully rescheduled to a new date and time.</p>

    <div class="info-card">
      <div class="info-row">
        <span class="info-label">Appointment #:</span>
        <span class="info-value">${data.appointmentNumber}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Doctor:</span>
        <span class="info-value">${data.doctorName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">New Date:</span>
        <span class="info-value"><strong>${data.newDateStr}</strong></span>
      </div>
      <div class="info-row">
        <span class="info-label">New Time:</span>
        <span class="info-value"><strong>${data.newTimeStr} UTC</strong></span>
      </div>
      ${
        data.reason
          ? `
      <div class="info-row">
        <span class="info-label">Note:</span>
        <span class="info-value">${data.reason}</span>
      </div>
      `
          : ''
      }
    </div>

    <p style="text-align: center;">
      <a href="${data.frontendUrl}/dashboard" class="btn">View Updated Details</a>
    </p>
  `;

  return renderBaseEmailTemplate(title, body);
}

export function renderDoctorLeaveAlertEmail(data: {
  patientName: string;
  doctorName: string;
  specialization: string;
  appointmentNumber: string;
  dateStr: string;
  timeStr: string;
  leaveReason?: string;
  frontendUrl: string;
}) {
  const title = `Action Required: Doctor on Leave - ${data.appointmentNumber}`;
  const body = `
    <h2 style="color: #d97706;">Action Required: Consultation Reschedule</h2>
    <p>Dear ${data.patientName},</p>
    <p>We are reaching out to inform you that <strong>${data.doctorName}</strong> (${data.specialization}) will be unavailable on <strong>${data.dateStr}</strong> due to scheduled clinical leave (${data.leaveReason || 'Administrative leave'}).</p>

    <div class="info-card" style="border-left-color: #d97706;">
      <div class="info-row">
        <span class="info-label">Affected Appointment:</span>
        <span class="info-value">${data.appointmentNumber}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Doctor:</span>
        <span class="info-value">${data.doctorName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Original Time:</span>
        <span class="info-value">${data.dateStr} at ${data.timeStr} UTC</span>
      </div>
    </div>

    <p>Your appointment has been released so you can immediately choose a new slot or an alternative specialist with priority availability.</p>

    <p style="text-align: center;">
      <a href="${data.frontendUrl}/appointments/${data.appointmentNumber}/reschedule" class="btn" style="background-color: #d97706;">1-Click Reschedule Now</a>
    </p>

    <p style="font-size: 13px; color: #64748b;">We sincerely apologize for any inconvenience and are committed to ensuring your healthcare needs are promptly met.</p>
  `;

  return renderBaseEmailTemplate(title, body);
}

export function renderAppointmentReminderEmail(data: {
  patientName: string;
  doctorName: string;
  specialization: string;
  appointmentNumber: string;
  dateStr: string;
  timeStr: string;
  frontendUrl: string;
}) {
  const title = `Reminder: Upcoming Consultation Tomorrow - ${data.appointmentNumber}`;
  const body = `
    <h2>Upcoming Medical Consultation Reminder</h2>
    <p>Dear ${data.patientName},</p>
    <p>This is a friendly reminder of your upcoming consultation with <strong>${data.doctorName}</strong> scheduled for tomorrow.</p>

    <div class="info-card">
      <div class="info-row">
        <span class="info-label">Appointment #:</span>
        <span class="info-value">${data.appointmentNumber}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Doctor:</span>
        <span class="info-value">${data.doctorName} (${data.specialization})</span>
      </div>
      <div class="info-row">
        <span class="info-label">Date:</span>
        <span class="info-value">${data.dateStr}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Time:</span>
        <span class="info-value">${data.timeStr} UTC</span>
      </div>
    </div>

    <p>If you have any updated symptoms to share with the doctor before your visit, please update your symptom form in the portal.</p>

    <p style="text-align: center;">
      <a href="${data.frontendUrl}/dashboard" class="btn">Open Consultation Details</a>
    </p>
  `;

  return renderBaseEmailTemplate(title, body);
}
