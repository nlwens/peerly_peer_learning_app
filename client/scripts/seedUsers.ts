import { faker } from '@faker-js/faker';
import type { User, EducationLevel } from '../features/users/data/types';
import { addUser, clearUsers } from '../features/users/store/usersStore';

const staticUsers: User[] = [
  {
    id: '1',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    password: 'password123',
    major: 'Computer Science',
    education_level: 'WO',
    strengths: ['Programming', 'Math'],
    needs_help_with: ['Physics'],
    description: 'Experienced in coding and algorithms.',
    token_balance: 10,
    created_at: new Date().toISOString(),
    profile_image_url: 'https://www.themarysue.com/wp-content/uploads/2026/03/image_6f228e.png?resize=1200%2C800',
  },
  {
    id: '2',
    name: 'Bob Smith',
    email: 'bob@example.com',
    password: 'password123',
    major: 'Mathematics',
    education_level: 'Master WO',
    strengths: ['Math', 'Statistics'],
    needs_help_with: ['Programming'],
    description: 'Math enthusiast ready to help.',
    token_balance: 5,
    created_at: new Date().toISOString(),
    profile_image_url:
      'https://64.media.tumblr.com/b66d35cbf9839242b8ebbf96c1eaa57c/3f4c00e4e4941b42-a0/s1280x1920/57b59271d4a0ea00e7b5e15e6efe4270d71afe8e.png',
  },
  {
    id: '3',
    name: 'Charlie Brown',
    email: 'charlie@example.com',
    password: 'password123',
    major: 'Physics',
    education_level: 'HBO',
    strengths: ['Physics', 'Chemistry'],
    needs_help_with: ['English'],
    description: 'Science lover.',
    token_balance: 0,
    created_at: new Date().toISOString(),
    profile_image_url:
      'https://media.istockphoto.com/id/1466995518/photo/business-woman-and-worker-portrait-at-office-desk-as-administration-executive-company-manager.jpg?s=612x612&w=0&k=20&c=NvKeG6Fh0_VVfH_N0Ka-5j8284XJhL2VTJfe6IwDkWQ=',
  },
  {
    id: '4',
    name: 'Diana Prince',
    email: 'diana@example.com',
    password: 'password123',
    major: 'Engineering',
    education_level: 'Master HBO',
    strengths: ['Engineering', 'Math'],
    needs_help_with: ['History'],
    description: 'Engineer with a passion for teaching.',
    token_balance: 15,
    created_at: new Date().toISOString(),
    profile_image_url:
      'https://img.freepik.com/free-photo/close-up-portrait-curly-handsome-european-male_176532-8133.jpg?semt=ais_hybrid&w=740&q=80',
  },
  {
    id: '5',
    name: 'Eve Wilson',
    email: 'eve@example.com',
    password: 'password123',
    major: 'Psychology',
    education_level: 'WO',
    strengths: ['Psychology', 'English'],
    needs_help_with: ['Math'],
    description: 'Psychology student.',
    token_balance: 8,
    created_at: new Date().toISOString(),
    profile_image_url:
      'https://media.istockphoto.com/id/2172873491/photo/university-student-and-man-in-portrait-outdoor-on-campus-with-book-for-education-learning-and.jpg?s=612x612&w=0&k=20&c=0jJ62Pxg9qWg2DKCl0pVQmN1j618h01SXJ7DGdlpsZM=',
  },
];

export async function seedUsers() {
  // Clear existing users
  await clearUsers();

  // Add static users
  for (const user of staticUsers) {
    await addUser(user);
  }
}
