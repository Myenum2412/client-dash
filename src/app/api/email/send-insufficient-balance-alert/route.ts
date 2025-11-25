import { NextRequest, NextResponse } from 'next/server';
import { sendInsufficientBalanceAlertEmail } from '@/lib/email';
import { createClient } from '@/lib/supabase/server';

/**
 * API route to send insufficient balance alert emails to admins
 * Usage: POST /api/email/send-insufficient-balance-alert
 * Body: { staffName: string, amount: number, branch: string, currentBalance: number }
 */
export async function POST(request: NextRequest) {
  try {
    const { staffName, amount, branch, currentBalance } = await request.json();

    if (!staffName || amount === undefined || !branch || currentBalance === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: staffName, amount, branch, and currentBalance' },
        { status: 400 }
      );
    }

    // Fetch all admin emails
    const supabase = await createClient();
    const { data: admins, error } = await supabase
      .from('admins')
      .select('email');

    if (error) {
      console.error('Error fetching admin emails:', error);
      return NextResponse.json(
        { error: 'Failed to fetch admin emails' },
        { status: 500 }
      );
    }

    const emailsToSend = (admins || [])
      .map(admin => admin.email)
      .filter((email): email is string => Boolean(email));

    if (emailsToSend.length === 0) {
      console.warn('[send-insufficient-balance-alert] No admin emails found for insufficient balance alert', {
        staffName,
        amount,
        branch,
        currentBalance,
      });
      return NextResponse.json(
        { error: 'No admin emails found' },
        { status: 400 }
      );
    }

    // Send email to all admins
    const result = await sendInsufficientBalanceAlertEmail(
      staffName,
      amount,
      branch,
      currentBalance,
      emailsToSend
    );

    return NextResponse.json({
      success: true,
      message: 'Insufficient balance alert email sent successfully',
      result,
      details: {
        staffName,
        amount,
        branch,
        currentBalance,
        recipients: emailsToSend.length
      }
    });
  } catch (error) {
    console.error('Error sending insufficient balance alert email:', error);
    return NextResponse.json(
      {
        error: 'Failed to send insufficient balance alert email',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

