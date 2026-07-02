import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { cookies } from 'next/headers';
import ExcelJS from 'exceljs';

// GET: Download formatted attendance sheet as native Excel .xlsx (Teacher only)
export async function GET(req: Request) {
    try {
                const payload = await getServerSession(authOptions);
        if (!payload || (payload?.user?.role !== 'TEACHER' && payload?.user?.role !== 'ADMIN')) {
            return NextResponse.json({ message: 'Forbidden: Only teachers can export attendance.' }, { status: 403 });
        }

        const url = new URL(req.url);
        const courseId = url.searchParams.get('courseId');
        if (!courseId) {
            return NextResponse.json({ message: 'courseId is required' }, { status: 400 });
        }

        // Fetch course info including teachers
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: {
                teachers: { select: { name: true } }
            }
        });

        if (!course) {
            return NextResponse.json({ message: 'Course not found' }, { status: 404 });
        }

        // Fetch all students in the course's year/semester
        const students = await prisma.user.findMany({
            where: {
                role: { in: ['STUDENT', 'CR'] },
                year: course.year ?? undefined,
                semester: course.semester ?? undefined,
            },
            select: { id: true, name: true, studentId: true },
            orderBy: { studentId: 'asc' }
        });

        // Fetch all attendance sessions for this course
        const sessions = await prisma.attendanceSession.findMany({
            where: { courseId },
            include: {
                records: {
                    select: { studentId: true, status: true }
                }
            },
            orderBy: { date: 'asc' }
        });

        const totalSessions = sessions.length;

        // Compute per-student attendance
        const studentStats = students.map((student, index) => {
            let presentCount = 0;
            const presences = sessions.map(session => {
                const record = session.records.find(r => r.studentId === student.id);
                if (record && record.status === 'PRESENT') {
                    presentCount++;
                    return '✓';
                }
                return 'x';
            });
            const percentage = totalSessions > 0
                ? Math.round((presentCount / totalSessions) * 100)
                : 0;
            return {
                serial: index + 1,
                roll: student.studentId || 'N/A',
                name: student.name,
                presences,
                percentage,
            };
        });

        const ordinals = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
        const yearLabel = ordinals[course.year ?? 0] ? `${ordinals[course.year ?? 0]} Year` : `Year ${course.year}`;
        const semLabel = ordinals[course.semester ?? 0] ? `${ordinals[course.semester ?? 0]} Semester` : `Semester ${course.semester}`;
        const currentYear = new Date().getFullYear();
        const teacherName = course.teachers[0]?.name ?? 'N/A';
        const credit = course.credit ?? 3.0;

        // Create a new Excel workbook
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Attendance', {
            views: [{ showGridLines: false }]
        });

        const totalCols = 4 + totalSessions;

        // Define columns
        const columns: Partial<ExcelJS.Column>[] = [
            { key: 'serial', width: 8 },
            { key: 'roll', width: 18 },
            { key: 'name', width: 35 }
        ];
        sessions.forEach((_, idx) => {
            columns.push({ key: `date_${idx}`, width: 10 });
        });
        columns.push({ key: 'percentage', width: 15 });
        sheet.columns = columns;

        // Row 1: University header merged across all columns
        sheet.mergeCells(1, 1, 1, totalCols);
        const headerCell = sheet.getCell(1, 1);
        headerCell.value = {
            richText: [
                { font: { name: 'Arial', size: 14, bold: true }, text: 'Jagannath University, Dhaka\n' },
                { font: { name: 'Arial', size: 12, bold: true }, text: 'Department of Computer Science and Engineering\n' },
                { font: { name: 'Arial', size: 12, bold: true }, text: `Attendance (${yearLabel} ${semLabel}-${currentYear})\n` },
                { font: { name: 'Arial', size: 11, bold: false }, text: `Course: ${course.code} (${course.name})        Credit: ${credit.toFixed(1)}        Teacher: ${teacherName}` }
            ]
        };
        headerCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        headerCell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
        sheet.getRow(1).height = 80;

        // Empty row
        sheet.addRow([]);

        // Row 3: Column Headers
        const headerStrings = ['Serial', 'Roll', 'Name'];
        sessions.forEach(s => {
            const d = new Date(s.date);
            headerStrings.push(`${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`);
        });
        headerStrings.push('Attendance %');

        const headerRow = sheet.addRow(headerStrings);
        headerRow.eachCell((cell) => {
            cell.font = { bold: true };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFEFEFEF' }
            };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
            cell.alignment = { horizontal: 'center' };
        });

        // Data rows
        studentStats.forEach(stat => {
            const rowData = [stat.serial, stat.roll, stat.name, ...stat.presences, `${stat.percentage}%`];
            const row = sheet.addRow(rowData);
            row.eachCell((cell, colNumber) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
                if (colNumber !== 3) {
                    cell.alignment = { horizontal: 'center' };
                }
                // Color ✓ green, x red
                if (cell.value === '✓') {
                    cell.font = { color: { argb: 'FF16A34A' }, bold: true };
                } else if (cell.value === 'x') {
                    cell.font = { color: { argb: 'FFE11D48' }, bold: true };
                }
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const filename = `attendance_${course.code}_${new Date().toISOString().slice(0, 10)}.xlsx`;

        return new Response(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error('Teacher attendance export error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
