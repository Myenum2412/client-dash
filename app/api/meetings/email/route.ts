import { NextRequest } from 'next/server'
import { createSuccessResponse, createErrorResponse, handleApiError } from '@/lib/api/utils'
import nodemailer from 'nodemailer'

interface MeetingEmailRequest {
  title: string
  dateTime: string
  description: string
  member: string
  projectId?: string
  projectNumber?: string
  projectName?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: MeetingEmailRequest = await request.json()
    const { title, dateTime, description, member, projectId, projectNumber, projectName } = body

    if (!title || !dateTime || !description) {
      return createErrorResponse('Missing required fields: title, dateTime, or description', 400)
    }

    // Create transporter - using Gmail SMTP
    // Set EMAIL_USER and EMAIL_PASSWORD in your .env.local file
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn('Email credentials not configured. Email will not be sent.')
      // In development, you can use Ethereal Email for testing
      // For production, you must set EMAIL_USER and EMAIL_PASSWORD
      const testAccount = await nodemailer.createTestAccount()
      const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      })
      
      const projectText = projectName || projectNumber 
        ? `\nProject: ${projectName || ''}${projectNumber ? ` (${projectNumber})` : ''}`
        : ''

      // Send to client
      const clientInfo = await transporter.sendMail({
        from: testAccount.user,
        to: 'myenumam@gmail.com',
        subject: `Meeting Scheduled: ${title}`,
        text: `Meeting: ${title}\nDate: ${new Date(dateTime).toLocaleString()}\nMember: ${member}${projectText}\nDescription: ${description}`,
      })
      
      // Send to admin
      const adminInfo = await transporter.sendMail({
        from: testAccount.user,
        to: 'sathish@proultima.com',
        subject: `Meeting Scheduled: ${title}`,
        text: `Meeting: ${title}\nDate: ${new Date(dateTime).toLocaleString()}\nMember: ${member}${projectText}\nDescription: ${description}`,
      })
      
      const clientTestUrl = nodemailer.getTestMessageUrl(clientInfo)
      const adminTestUrl = nodemailer.getTestMessageUrl(adminInfo)
      console.log('Test emails sent. Client preview URL:', clientTestUrl)
      console.log('Test emails sent. Admin preview URL:', adminTestUrl)
      
      return createSuccessResponse(
        {
          sent: true,
          clientEmail: 'myenumam@gmail.com',
          adminEmail: 'sathish@proultima.com',
          testMode: true,
          clientPreviewUrl: clientTestUrl,
          adminPreviewUrl: adminTestUrl,
        },
        'Meeting notification emails sent (test mode). Check console for preview URLs.'
      )
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    })

    // Format the date
    const meetingDate = new Date(dateTime)
    const formattedDate = meetingDate.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

    // Email content template
    const projectSection = projectName || projectNumber ? `
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 15px; border-radius: 8px; margin: 15px 0; color: white;">
        <p style="margin: 0; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Related Project</p>
        ${projectName ? `<p style="margin: 5px 0 0 0; font-size: 16px; font-weight: 500;">${projectName}</p>` : ''}
        ${projectNumber ? `<p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Project #${projectNumber}</p>` : ''}
      </div>
    ` : ''

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Meeting Scheduled</h1>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px;">
            <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 25px; border-radius: 12px; border-left: 4px solid #10b981; margin-bottom: 20px;">
              <h2 style="color: #065f46; margin: 0 0 15px 0; font-size: 20px; font-weight: 600;">${title}</h2>
              <div style="color: #047857; margin-top: 15px;">
                <p style="margin: 8px 0; font-size: 14px;">
                  <strong style="display: inline-block; width: 120px;">📅 Date & Time:</strong>
                  <span style="font-weight: 500;">${formattedDate}</span>
                </p>
                <p style="margin: 8px 0; font-size: 14px;">
                  <strong style="display: inline-block; width: 120px;">👤 Member:</strong>
                  <span style="font-weight: 500;">${member}</span>
                </p>
              </div>
            </div>
            
            ${projectSection}
            
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #374151; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">Description</h3>
              <p style="color: #6b7280; margin: 0; white-space: pre-wrap; line-height: 1.6;">${description}</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                This is an automated notification from <strong style="color: #10b981;">Proultima</strong>
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
    
    const projectText = projectName || projectNumber 
      ? `\nRelated Project: ${projectName || ''}${projectNumber ? ` (${projectNumber})` : ''}\n`
      : ''

    const emailText = `
New Meeting Scheduled

Title: ${title}
Date & Time: ${formattedDate}
Member: ${member}${projectText}
Description:
${description}

This is an automated notification from Proultima.
    `

    // Send email to client
    let clientInfo = null
    let clientError = null
    try {
      clientInfo = await transporter.sendMail({
        from: process.env.EMAIL_USER || 'noreply@proultima.com',
        to: 'myenumam@gmail.com',
        subject: `Meeting Scheduled: ${title}`,
        html: emailHtml,
        text: emailText,
      })
    } catch (error: any) {
      clientError = error.message
      console.error('Error sending email to client:', error)
    }

    // Send email to admin (try even if client email failed)
    let adminInfo = null
    let adminError = null
    try {
      adminInfo = await transporter.sendMail({
        from: process.env.EMAIL_USER || 'noreply@proultima.com',
        to: 'sathish@proultima.com',
        subject: `Meeting Scheduled: ${title}`,
        html: emailHtml,
        text: emailText,
      })
    } catch (error: any) {
      adminError = error.message
      console.error('Error sending email to admin:', error)
    }

    // If both emails failed, return error
    if (clientError && adminError) {
      return createErrorResponse(
        `Failed to send emails to both recipients. Client: ${clientError}, Admin: ${adminError}`,
        500
      )
    }

    // If one email failed, return partial success
    if (clientError || adminError) {
      return createSuccessResponse(
        {
          sent: true,
          clientEmail: 'myenumam@gmail.com',
          adminEmail: 'sathish@proultima.com',
          clientSent: !clientError,
          adminSent: !adminError,
          clientError: clientError || null,
          adminError: adminError || null,
          clientMessageId: clientInfo?.messageId || null,
          adminMessageId: adminInfo?.messageId || null,
        },
        `Meeting notification emails sent with partial success. ${clientError ? 'Client email failed. ' : ''}${adminError ? 'Admin email failed.' : ''}`
      )
    }

    // Both emails sent successfully
    return createSuccessResponse(
      {
        sent: true,
        clientEmail: 'myenumam@gmail.com',
        adminEmail: 'sathish@proultima.com',
        clientMessageId: clientInfo?.messageId,
        adminMessageId: adminInfo?.messageId,
      },
      'Meeting notification emails sent successfully to client and admin'
    )
  } catch (error: any) {
    console.error('Error sending meeting email:', error)
    return handleApiError(error)
  }
}

