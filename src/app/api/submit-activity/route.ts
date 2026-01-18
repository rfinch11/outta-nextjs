import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

interface SubmitActivityRequest {
  email: string;
  title: string;
  description: string;
  address: string;
  parentTips: string;
  startDate: string;
  startTime: string;
  websiteUrl: string;
}

export async function POST(request: NextRequest) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const body: SubmitActivityRequest = await request.json();

    const {
      email,
      title,
      description,
      address,
      parentTips,
      startDate,
      startTime,
      websiteUrl,
    } = body;

    // Validate required fields
    if (!email || !title) {
      return NextResponse.json(
        { error: 'Email and title are required' },
        { status: 400 }
      );
    }

    // Format the email content
    const emailContent = `
New Activity Submission

Submitted by: ${email}

Activity Details
----------------
Title: ${title}

Description:
${description || 'Not provided'}

Address: ${address || 'Not provided'}

Parent Tips:
${parentTips || 'Not provided'}

Start Date: ${startDate || 'Not provided'}
Start Time: ${startTime || 'Not provided'}

Website: ${websiteUrl || 'Not provided'}
    `.trim();

    // Send email via Resend
    const { error } = await resend.emails.send({
      from: 'Outta <notifications@outta.events>',
      to: 'rfinch@outta.events',
      replyTo: email,
      subject: `Activity Submission: ${title}`,
      text: emailContent,
    });

    if (error) {
      console.error('Error sending email:', error);
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing submission:', error);
    return NextResponse.json(
      { error: 'Failed to process submission' },
      { status: 500 }
    );
  }
}
