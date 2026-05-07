const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const courses = [
  // 1st Year 1st Semester
  { code: 'CSE-1101', name: 'Structured Programming Language', type: 'Major', marks: 100, credit: 3, year: 1, semester: 1 },
  { code: 'CSEL-1102', name: 'Structured Programming Language Lab', type: 'Major', marks: 50, credit: 1.5, year: 1, semester: 1 },
  { code: 'CSER-1103', name: 'Math-I (Calculus)', type: 'Non-Major', marks: 100, credit: 3, year: 1, semester: 1 },
  { code: 'CSER-1105', name: 'Physics', type: 'Non-Major', marks: 100, credit: 3, year: 1, semester: 1 },
  { code: 'CSE-1107', name: 'Electrical Circuit Analysis', type: 'Major', marks: 100, credit: 3, year: 1, semester: 1 },
  { code: 'CSEL-1108', name: 'Electrical Circuit Analysis Lab', type: 'Major', marks: 50, credit: 1, year: 1, semester: 1 },
  { code: 'CSER-1109', name: 'English', type: 'Non-Major', marks: 100, credit: 3, year: 1, semester: 1 },
  { code: 'CSER-1111', name: 'History of the Liberation War of Bangladesh', type: 'Non-Major', marks: 100, credit: 3, year: 1, semester: 1 },

  // 1st Year 2nd Semester
  { code: 'CSE-1201', name: 'Object Oriented Programming-I', type: 'Major', marks: 100, credit: 3, year: 1, semester: 2 },
  { code: 'CSEL-1202', name: 'Object Oriented Programming-I Lab', type: 'Major', marks: 50, credit: 1.5, year: 1, semester: 2 },
  { code: 'CSE-1203', name: 'Data Structure', type: 'Major', marks: 100, credit: 3, year: 1, semester: 2 },
  { code: 'CSEL-1204', name: 'Data Structure Lab', type: 'Major', marks: 50, credit: 1, year: 1, semester: 2 },
  { code: 'CSE-1205', name: 'Basic Electronics', type: 'Major', marks: 100, credit: 3, year: 1, semester: 2 },
  { code: 'CSEL-1206', name: 'Basic Electronics Lab', type: 'Major', marks: 50, credit: 1, year: 1, semester: 2 },
  { code: 'CSER-1207', name: 'Math-II (Linear Algebra)', type: 'Non-Major', marks: 100, credit: 3, year: 1, semester: 2 },
  { code: 'CSE-1209', name: 'Discrete Mathematics', type: 'Major', marks: 100, credit: 3, year: 1, semester: 2 },
  { code: 'CSER-1211', name: 'Economics', type: 'Non-Major', marks: 50, credit: 2, year: 1, semester: 2 },
  { code: 'CSEV-1212', name: 'Viva-Voce', type: 'Major', marks: 50, credit: 1, year: 1, semester: 2 },

  // 2nd Year 1st Semester
  { code: 'CSE-2101', name: 'Object Oriented Programming-II', type: 'Major', marks: 100, credit: 3, year: 2, semester: 1 },
  { code: 'CSEL-2102', name: 'Object Oriented Programming-II Lab', type: 'Major', marks: 50, credit: 1.5, year: 2, semester: 1 },
  { code: 'CSE-2103', name: 'Digital Logic Design', type: 'Major', marks: 100, credit: 3, year: 2, semester: 1 },
  { code: 'CSEL-2104', name: 'Digital Logic Design Lab', type: 'Major', marks: 50, credit: 1, year: 2, semester: 1 },
  { code: 'CSER-2105', name: 'Math-III (Ordinary Differential Equation)', type: 'Non-Major', marks: 100, credit: 3, year: 2, semester: 1 },
  { code: 'CSER-2106', name: 'Introduction to Statistics and Probability', type: 'Non-Major', marks: 100, credit: 3, year: 2, semester: 1 },
  { code: 'CSE-2107', name: 'Data Communication', type: 'Major', marks: 100, credit: 3, year: 2, semester: 1 },
  { code: 'CSEL-2108', name: 'Data Communication Lab', type: 'Major', marks: 50, credit: 1, year: 2, semester: 1 },
  { code: 'CSER-2109', name: 'Financial and Managerial Accounting', type: 'Non-Major', marks: 100, credit: 3, year: 2, semester: 1 },

  // 2nd Year 2nd Semester
  { code: 'CSE-2201', name: 'Computer Architecture', type: 'Major', marks: 100, credit: 3, year: 2, semester: 2 },
  { code: 'CSEL-2202', name: 'Computer Architecture Lab', type: 'Major', marks: 50, credit: 1, year: 2, semester: 2 },
  { code: 'CSE-2203', name: 'Database Management System', type: 'Major', marks: 100, credit: 3, year: 2, semester: 2 },
  { code: 'CSEL-2204', name: 'Database Management System Lab', type: 'Major', marks: 50, credit: 1, year: 2, semester: 2 },
  { code: 'CSER-2205', name: 'Math-IV (Complex Variable, Fourier and Laplace Transform)', type: 'Non-Major', marks: 100, credit: 3, year: 2, semester: 2 },
  { code: 'CSER-2207', name: 'Numerical Analysis', type: 'Non-Major', marks: 50, credit: 2, year: 2, semester: 2 },
  { code: 'CSEL-2208', name: 'Numerical Analysis Lab', type: 'Non-Major', marks: 50, credit: 1, year: 2, semester: 2 },
  { code: 'CSE-2209', name: 'Design and Analysis of Algorithm', type: 'Major', marks: 100, credit: 3, year: 2, semester: 2 },
  { code: 'CSEL-2210', name: 'Design and Analysis of Algorithm Lab', type: 'Major', marks: 50, credit: 1.5, year: 2, semester: 2 },
  { code: 'CSEV-2211', name: 'Viva-Voce', type: 'Major', marks: 50, credit: 1, year: 2, semester: 2 },

  // 3rd Year 1st Semester
  { code: 'CSE-3101', name: 'Theory of Computation', type: 'Major', marks: 100, credit: 3, year: 3, semester: 1 },
  { code: 'CSE-3103', name: 'Mathematical Analysis for Computer Science', type: 'Major', marks: 100, credit: 3, year: 3, semester: 1 },
  { code: 'CSE-3105', name: 'Operating Systems', type: 'Major', marks: 100, credit: 3, year: 3, semester: 1 },
  { code: 'CSEL-3106', name: 'Operating Systems Lab', type: 'Major', marks: 50, credit: 1, year: 3, semester: 1 },
  { code: 'CSE-3107', name: 'Microprocessor and Assembly Language', type: 'Major', marks: 100, credit: 3, year: 3, semester: 1 },
  { code: 'CSEL-3108', name: 'Microprocessor and Assembly Language Lab', type: 'Major', marks: 50, credit: 1, year: 3, semester: 1 },
  { code: 'CSE-3109', name: 'Computer Networks', type: 'Major', marks: 100, credit: 3, year: 3, semester: 1 },
  { code: 'CSEL-3110', name: 'Computer Networks Lab', type: 'Major', marks: 50, credit: 1.5, year: 3, semester: 1 },
  { code: 'CSEP-3111', name: 'Internet and Web Programming (Project)', type: 'Major', marks: 50, credit: 1, year: 3, semester: 1 },

  // 3rd Year 2nd Semester
  { code: 'CSE-3201', name: 'Compiler Design and Construction', type: 'Major', marks: 100, credit: 3, year: 3, semester: 2 },
  { code: 'CSEL-3202', name: 'Compiler Design and Construction Lab', type: 'Major', marks: 50, credit: 1, year: 3, semester: 2 },
  { code: 'CSE-3203', name: 'Digital Signal Processing', type: 'Major', marks: 100, credit: 3, year: 3, semester: 2 },
  { code: 'CSEL-3204', name: 'Digital Signal Processing Lab', type: 'Major', marks: 50, credit: 1, year: 3, semester: 2 },
  { code: 'CSE-3205', name: 'Software Engineering', type: 'Major', marks: 100, credit: 3, year: 3, semester: 2 },
  { code: 'CSEL-3206', name: 'Software Engineering Lab', type: 'Major', marks: 50, credit: 1, year: 3, semester: 2 },
  { code: 'CSE-3207', name: 'Computer Peripherals and Interfacing', type: 'Major', marks: 100, credit: 3, year: 3, semester: 2 },
  { code: 'CSEL-3208', name: 'Computer Peripherals and Interfacing Lab', type: 'Major', marks: 50, credit: 1, year: 3, semester: 2 },
  { code: 'CSEP-3209', name: 'Application Design and Development (Project)', type: 'Major', marks: 50, credit: 1.5, year: 3, semester: 2 },
  { code: 'CSEV-3210', name: 'Viva-Voce', type: 'Major', marks: 50, credit: 1, year: 3, semester: 2 },

  // 4th Year 1st Semester
  { code: 'CSE-4101', name: 'Artificial Intelligence', type: 'Major', marks: 100, credit: 3, year: 4, semester: 1 },
  { code: 'CSEL-4102', name: 'Artificial Intelligence Lab', type: 'Major', marks: 50, credit: 1, year: 4, semester: 1 },
  { code: 'CSE-4103', name: 'Digital Image Processing', type: 'Major', marks: 100, credit: 3, year: 4, semester: 1 },
  { code: 'CSEL-4104', name: 'Digital Image Processing Lab', type: 'Major', marks: 50, credit: 1, year: 4, semester: 1 },
  { code: 'CSE-4105', name: 'Computer Graphics and Animation', type: 'Major', marks: 100, credit: 3, year: 4, semester: 1 },
  { code: 'CSEL-4106', name: 'Computer Graphics and Animation Lab', type: 'Major', marks: 50, credit: 1, year: 4, semester: 1 },
  { code: 'CSE-4107', name: 'Data Mining and Data Warehousing', type: 'Major', marks: 100, credit: 3, year: 4, semester: 1 },
  { code: 'CSEL-4108', name: 'Data Mining and Data Warehousing Lab', type: 'Major', marks: 50, credit: 1, year: 4, semester: 1 },
  { code: 'CSE-4109', name: 'Cryptography and Information Security', type: 'Major', marks: 100, credit: 3, year: 4, semester: 1 },
  { code: 'CSEL-4110', name: 'Cryptography and Information Security Lab', type: 'Major', marks: 50, credit: 1, year: 4, semester: 1 },

  // 4th Year 2nd Semester
  { code: 'CSET-4201', name: 'Thesis', type: 'Major', marks: 100, credit: 6, year: 4, semester: 2 },
  { code: 'CSEP-4201', name: 'Project', type: 'Major', marks: 100, credit: 6, year: 4, semester: 2 },
  { code: 'CSE-42**-Option-I', name: 'Option-I', type: 'Major', marks: 100, credit: 3, year: 4, semester: 2 },
  { code: 'CSEL-42**-Option-I', name: 'Option-I Lab', type: 'Major', marks: 50, credit: 1, year: 4, semester: 2 },
  { code: 'CSE-42**-Option-II', name: 'Option-II', type: 'Major', marks: 100, credit: 3, year: 4, semester: 2 },
  { code: 'CSEL-42**-Option-II', name: 'Option-II Lab', type: 'Major', marks: 50, credit: 1, year: 4, semester: 2 },
  { code: 'CSE-42**-Option-III', name: 'Option-III', type: 'Major', marks: 100, credit: 3, year: 4, semester: 2 },
  { code: 'CSEL-42**-Option-III', name: 'Option-III Lab', type: 'Major', marks: 50, credit: 1, year: 4, semester: 2 },
  { code: 'CSEV-42**', name: 'Viva', type: 'Major', marks: 50, credit: 1, year: 4, semester: 2 },
];

async function main() {
  console.log('Start seeding courses...');
  for (const c of courses) {
    const course = await prisma.course.upsert({
      where: { code: c.code },
      update: {
        name: c.name,
        type: c.type,
        marks: c.marks,
        credit: c.credit,
        year: c.year,
        semester: c.semester,
      },
      create: {
        code: c.code,
        name: c.name,
        type: c.type,
        marks: c.marks,
        credit: c.credit,
        year: c.year,
        semester: c.semester,
      },
    });
    console.log(`Upserted course: ${course.code} - ${course.name}`);
  }
  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
