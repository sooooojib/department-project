import nodemailer from 'nodemailer';

// Configure the transporter with Gmail
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // This must be a Google App Password
    },
});

export async function sendApprovalEmail(
    to: string,
    name: string,
    role: string,
    identifier: string,
    plainTextPassword: string
) {
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaeb; border-radius: 8px;">
            <h2 style="color: #333;">Welcome to CSE JnU EduPortal</h2>
            <p>Hello <strong>${name}</strong>,</p>
            <p>Your signup request for the EduPortal portal has been approved by the Admin! Your account is now active and ready to use.</p>
            
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #555;">Your Login Credentials</h3>
                <p style="margin: 5px 0;"><strong>Account Type:</strong> ${role}</p>
                <p style="margin: 5px 0;"><strong>Email (Use this to log in):</strong> ${identifier}</p>
                <p style="margin: 5px 0;"><strong>Password:</strong> <span style="font-family: monospace; background: #eee; padding: 2px 5px; border-radius: 4px;">${plainTextPassword}</span></p>
            </div>
            
            <p>Please log in at: <a href="${process.env.NEXTAUTH_URL || (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : 'http://localhost:3000')}/login" style="color: #22c55e;">${process.env.NEXTAUTH_URL || (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : 'http://localhost:3000')}/login</a></p>
            
            <p style="font-size: 0.9em; color: #666;">For security reasons, we highly recommend changing your password after your first login.</p>
            
            <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />
            <p style="font-size: 0.8em; color: #888;">Best regards,<br/>The EduPortal Admin Team</p>
        </div>
    `;

    try {
        const info = await transporter.sendMail({
            from: `"EduPortal Admin" <${process.env.EMAIL_USER}>`,
            to,
            subject: 'Welcome to CSE JnU EduPortal! Your account has been approved.',
            html: htmlContent,
        });

        console.log('Message sent: %s', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error };
    }
}
