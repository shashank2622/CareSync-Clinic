import { PrismaClient, Role, Gender, AppointmentStatus, UrgencyLevel, LLMProcessingStatus, ReminderFrequency, DeliveryStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seeding...');

  // 1. Clean existing records in reverse dependency order
  await prisma.emailDelivery.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.calendarEvent.deleteMany();
  await prisma.googleOAuthToken.deleteMany();
  await prisma.medicationReminder.deleteMany();
  await prisma.medication.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.visitNote.deleteMany();
  await prisma.preVisitSummary.deleteMany();
  await prisma.symptomSubmission.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.slotHold.deleteMany();
  await prisma.doctorLeave.deleteMany();
  await prisma.doctorWorkingHour.deleteMany();
  await prisma.doctorProfile.deleteMany();
  await prisma.patientProfile.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned existing database records.');

  // Password hashes
  const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
  const doctorPasswordHash = await bcrypt.hash('Doctor@123', 10);
  const patientPasswordHash = await bcrypt.hash('Patient@123', 10);

  // 2. Create Admin User
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@clinic.com',
      passwordHash: adminPasswordHash,
      fullName: 'System Administrator',
      role: Role.ADMIN,
      phone: '+1-555-0100',
    },
  });
  console.log('👤 Created Admin: admin@clinic.com');

  // 3. Create Doctors & Profiles
  const doctorsData = [
    {
      email: 'dr.sarah@clinic.com',
      fullName: 'Dr. Sarah Jenkins, MD',
      phone: '+1-555-0201',
      specialization: 'Cardiology',
      licenseNumber: 'MD-CARD-88391',
      experienceYears: 14,
      bio: 'Board-certified cardiologist specializing in preventive cardiology, hypertension, and coronary artery disease management.',
      consultationFee: 120.00,
      slotDurationMinutes: 30,
    },
    {
      email: 'dr.david@clinic.com',
      fullName: 'Dr. David Patel, MD',
      phone: '+1-555-0202',
      specialization: 'Dermatology',
      licenseNumber: 'MD-DERM-44910',
      experienceYears: 9,
      bio: 'Clinical dermatologist with expertise in acne treatments, eczema, psoriasis, and dermatological surgery.',
      consultationFee: 95.00,
      slotDurationMinutes: 30,
    },
    {
      email: 'dr.emily@clinic.com',
      fullName: 'Dr. Emily Chen, MD',
      phone: '+1-555-0203',
      specialization: 'Pediatrics',
      licenseNumber: 'MD-PED-77218',
      experienceYears: 11,
      bio: 'Dedicated pediatrician providing comprehensive infant, child, and adolescent healthcare with empathetic guidance.',
      consultationFee: 85.00,
      slotDurationMinutes: 30,
    },
    {
      email: 'dr.marcus@clinic.com',
      fullName: 'Dr. Marcus Vance, MD',
      phone: '+1-555-0204',
      specialization: 'General Medicine',
      licenseNumber: 'MD-GEN-19302',
      experienceYears: 16,
      bio: 'Primary care physician focusing on holistic wellness, chronic disease management, and preventive health screenings.',
      consultationFee: 75.00,
      slotDurationMinutes: 30,
    },
  ];

  const createdDoctors: any[] = [];

  for (const doc of doctorsData) {
    const user = await prisma.user.create({
      data: {
        email: doc.email,
        passwordHash: doctorPasswordHash,
        fullName: doc.fullName,
        phone: doc.phone,
        role: Role.DOCTOR,
        doctorProfile: {
          create: {
            specialization: doc.specialization,
            licenseNumber: doc.licenseNumber,
            experienceYears: doc.experienceYears,
            bio: doc.bio,
            consultationFee: doc.consultationFee,
            slotDurationMinutes: doc.slotDurationMinutes,
          },
        },
      },
      include: {
        doctorProfile: true,
      },
    });

    createdDoctors.push(user.doctorProfile);

    // Create Monday-Friday 09:00 - 17:00 with Break 13:00 - 14:00
    for (let day = 1; day <= 5; day++) {
      await prisma.doctorWorkingHour.create({
        data: {
          doctorId: user.doctorProfile!.id,
          dayOfWeek: day,
          startTime: '09:00',
          endTime: '17:00',
          breakStartTime: '13:00',
          breakEndTime: '14:00',
          isAvailable: true,
        },
      });
    }

    // Saturday half-day for some doctors
    if (doc.specialization === 'General Medicine' || doc.specialization === 'Pediatrics') {
      await prisma.doctorWorkingHour.create({
        data: {
          doctorId: user.doctorProfile!.id,
          dayOfWeek: 6,
          startTime: '09:00',
          endTime: '13:00',
          isAvailable: true,
        },
      });
    }
  }
  console.log(`👨‍⚕️ Created ${createdDoctors.length} Doctors with working hours & breaks.`);

  // 4. Create Patients & Profiles
  const patientsData = [
    {
      email: 'alice@example.com',
      fullName: 'Alice Johnson',
      phone: '+1-555-0301',
      dob: new Date('1992-04-15'),
      gender: Gender.FEMALE,
      bloodGroup: 'A+',
      emergencyContact: 'Mark Johnson (Spouse): +1-555-0302',
      medicalHistorySummary: 'Mild seasonal allergies. No known drug allergies. Family history of hypertension.',
    },
    {
      email: 'bob@example.com',
      fullName: 'Bob Smith',
      phone: '+1-555-0303',
      dob: new Date('1985-11-28'),
      gender: Gender.MALE,
      bloodGroup: 'O+',
      emergencyContact: 'Helen Smith (Mother): +1-555-0304',
      medicalHistorySummary: 'Asthma in childhood, resolved. Penicillin allergy.',
    },
    {
      email: 'carol@example.com',
      fullName: 'Carol Martinez',
      phone: '+1-555-0305',
      dob: new Date('1998-07-09'),
      gender: Gender.FEMALE,
      bloodGroup: 'B-',
      emergencyContact: 'Carlos Martinez (Brother): +1-555-0306',
      medicalHistorySummary: 'No chronic conditions reported.',
    },
  ];

  const createdPatients: any[] = [];

  for (const pat of patientsData) {
    const user = await prisma.user.create({
      data: {
        email: pat.email,
        passwordHash: patientPasswordHash,
        fullName: pat.fullName,
        phone: pat.phone,
        role: Role.PATIENT,
        patientProfile: {
          create: {
            dob: pat.dob,
            gender: pat.gender,
            bloodGroup: pat.bloodGroup,
            emergencyContact: pat.emergencyContact,
            medicalHistorySummary: pat.medicalHistorySummary,
          },
        },
      },
      include: {
        patientProfile: true,
      },
    });
    createdPatients.push(user.patientProfile);
  }
  console.log(`🧑 Created ${createdPatients.length} Patients with medical profiles.`);

  // 5. Create Sample Appointments
  const doctorSarah = createdDoctors[0]; // Cardiology
  const doctorDavid = createdDoctors[1]; // Dermatology
  const patientAlice = createdPatients[0];
  const patientBob = createdPatients[1];

  // Appointment 1: Past Completed Visit with Full AI Summaries & Prescription
  const pastStartTime = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000); // 4 days ago
  pastStartTime.setUTCHours(10, 0, 0, 0);
  const pastEndTime = new Date(pastStartTime.getTime() + 30 * 60 * 1000);

  const pastAppointment = await prisma.appointment.create({
    data: {
      appointmentNumber: 'APT-20260820-001',
      doctorId: doctorSarah.id,
      patientId: patientAlice.id,
      slotStartTime: pastStartTime,
      slotEndTime: pastEndTime,
      status: AppointmentStatus.COMPLETED,
      symptomSubmission: {
        create: {
          chiefComplaint: 'Chest tightness and occasional palpitations after light exercise',
          symptomsText: 'Feeling rapid fluttering in the chest for 3 weeks, usually occurring after climbing stairs or in the afternoon.',
          duration: '3 weeks',
          severity: 6,
          additionalNotes: 'Caffeine intake ~3 cups of coffee daily. No dizziness.',
          submittedAt: new Date(pastStartTime.getTime() - 24 * 60 * 60 * 1000),
        },
      },
      preVisitSummary: {
        create: {
          urgencyLevel: UrgencyLevel.MEDIUM,
          chiefComplaintSummary: 'Exertional palpitations and mild chest tightness in a 34-year-old with family history of hypertension and high caffeine consumption.',
          suggestedQuestions: JSON.stringify([
            'Have you experienced any shortness of breath, lightheadedness, or fainting alongside the palpitations?',
            'Does reducing coffee or energy drink intake alter the frequency of the episodes?',
            'Is there any localized chest pain that radiates to the neck, jaw, or left arm?'
          ]),
          rawResponseText: '{"urgencyLevel":"Medium","chiefComplaint":"Exertional palpitations and mild chest tightness","suggestedQuestions":["Have you experienced shortness of breath?","Does reducing caffeine alter episodes?","Does pain radiate?"]}',
          status: LLMProcessingStatus.SUCCESS,
        },
      },
      visitNote: {
        create: {
          clinicalNotes: 'Normal S1/S2 heart sounds. Resting ECG shows normal sinus rhythm at 74 bpm. Blood pressure 128/82 mmHg. Likely benign sinus tachycardia exacerbated by caffeine and mild work-related stress. Holter monitor scheduled as a precaution.',
          diagnosis: 'Sinus Tachycardia (Benign / Caffeine-induced)',
          vitalSigns: { bp: '128/82', hr: 74, temp: '98.4F', spo2: '99%' },
          followUpInstructions: 'Reduce daily caffeine intake to maximum 1 cup. Maintain a symptom diary for 2 weeks. Return if symptoms worsen.',
          nextVisitRecommendedDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
      },
      prescription: {
        create: {
          doctorNotes: 'Maintain hydration and taper caffeine. Take Metoprolol only if persistent palpitations exceed 100 bpm at rest.',
          patientSummary: 'Dr. Sarah investigated your chest fluttering and confirmed your heart rhythm and resting ECG are currently normal. The symptoms are most likely caused by stress and high coffee intake. You have been prescribed a low-dose beta blocker for symptom control if needed, and should taper your caffeine.',
          aiStatus: LLMProcessingStatus.SUCCESS,
          medications: {
            create: [
              {
                name: 'Metoprolol Tartrate',
                dosage: '25mg',
                frequency: ReminderFrequency.ONCE_DAILY,
                durationDays: 14,
                instructions: 'Take 1 tablet in the morning with food as needed for rapid pulse.',
              },
              {
                name: 'Coenzyme Q10 (CoQ-10)',
                dosage: '100mg',
                frequency: ReminderFrequency.ONCE_DAILY,
                durationDays: 30,
                instructions: 'Take 1 capsule daily after lunch for general cardiovascular support.',
              },
            ],
          },
        },
      },
    },
    include: {
      prescription: {
        include: {
          medications: true,
        },
      },
    },
  });

  // Create medication reminder for Alice
  if (pastAppointment.prescription?.medications[0]) {
    await prisma.medicationReminder.create({
      data: {
        medicationId: pastAppointment.prescription.medications[0].id,
        patientId: patientAlice.id,
        scheduledTime: '08:00',
        frequency: ReminderFrequency.ONCE_DAILY,
        isActive: true,
      },
    });
  }

  // Appointment 2: Upcoming Confirmed Appointment with Pre-Visit Symptoms
  const futureStartTime = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // 2 days in future
  futureStartTime.setUTCHours(11, 0, 0, 0);
  const futureEndTime = new Date(futureStartTime.getTime() + 30 * 60 * 1000);

  await prisma.appointment.create({
    data: {
      appointmentNumber: 'APT-20260826-002',
      doctorId: doctorDavid.id,
      patientId: patientBob.id,
      slotStartTime: futureStartTime,
      slotEndTime: futureEndTime,
      status: AppointmentStatus.CONFIRMED,
      symptomSubmission: {
        create: {
          chiefComplaint: 'Red itchy rash on both forearms appearing after gardening',
          symptomsText: 'Erythematous papules and intense itching. Started 2 days ago after pruning shrubs. Over-the-counter hydrocortisone cream provided only minimal relief.',
          duration: '2 days',
          severity: 7,
          additionalNotes: 'Patient has a known penicillin allergy.',
        },
      },
      preVisitSummary: {
        create: {
          urgencyLevel: UrgencyLevel.LOW,
          chiefComplaintSummary: 'Acute pruritic contact dermatitis on bilateral forearms following outdoor plant exposure, refractory to low-potency topical steroids.',
          suggestedQuestions: JSON.stringify([
            'Did you come in contact with poison ivy, oak, or specific chemical weedkillers while gardening?',
            'Have you noticed any blistering, weeping, or signs of secondary bacterial infection like warmth or yellow crusting?',
            'Are you experiencing rash on any other body parts or facial swelling?'
          ]),
          rawResponseText: '{"urgencyLevel":"Low","chiefComplaint":"Acute pruritic contact dermatitis","suggestedQuestions":["Did you contact poison ivy/oak?","Any blistering or yellow crusting?","Any facial swelling?"]}',
          status: LLMProcessingStatus.SUCCESS,
        },
      },
    },
  });

  // 6. Create a Sample Doctor Leave record for Dr. David Patel (next week)
  const leaveStart = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const leaveEnd = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000);
  await prisma.doctorLeave.create({
    data: {
      doctorId: doctorDavid.id,
      startDate: leaveStart,
      endDate: leaveEnd,
      reason: 'Annual Dermatology Conference attendance',
      approvedById: adminUser.id,
    },
  });

  console.log('📅 Created sample appointments, pre-visit summaries, prescriptions, and leave records.');
  console.log('✅ Database seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
