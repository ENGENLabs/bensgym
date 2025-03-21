import { useState } from 'react';
import { json, redirect } from '@remix-run/node';
import { useActionData, useNavigation } from '@remix-run/react';
import type { ActionFunctionArgs } from '@remix-run/node';
import CheckInForm from '~/components/check-in/CheckInForm';
import CheckInResult from '~/components/check-in/CheckInResult';
import Logo from '~/components/common/Logo';
import { verifyMembership } from '~/utils/square.server';
import { isSquareConfigured, getEnv } from '~/utils/env.server';
import { createSystemLog } from '~/models/system-log.server';
import { createCheckIn } from '~/models/check-in.server';
import { getCustomerByPhoneNumber, upsertCustomer } from '~/models/customer.server';
import type { CheckInResult as CheckInResultType } from '~/types';
import { formatPhoneNumberForApi } from '~/utils/formatters.server';

// Mock data for development when Square is not configured
const MOCK_SUCCESS_RESULT: CheckInResultType = {
  success: true,
  message: 'Check-in successful! Welcome back.',
  customerData: {
    id: 'mock-id',
    name: 'John Doe',
    membershipStatus: 'Active',
    expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    paymentStatus: 'Subscription Active'
  }
};

const MOCK_FAILURE_RESULT: CheckInResultType = {
  success: false,
  message: 'No active membership found',
  error: 'NO_ACTIVE_MEMBERSHIP',
  customerData: {
    id: 'mock-id',
    name: 'Jane Smith',
    membershipStatus: 'Inactive',
    paymentStatus: 'No active subscription or recent payment'
  }
};

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  let phoneNumber = formData.get('phoneNumber') as string;
  const env = getEnv();
  const locationId = env.SQUARE_LOCATION_ID || 'default-location';

  if (!phoneNumber) {
    await createSystemLog({
      message: 'Check-in attempt failed: Missing phone number',
      eventType: 'check_in_error',
      severity: 'warning',
      details: {
        error: 'MISSING_PHONE_NUMBER'
      }
    });
    
    return json({ 
      success: false, 
      message: 'Phone number is required',
      error: 'MISSING_PHONE_NUMBER'
    });
  }

  // Format the phone number for the Square API (E.164 format)
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // If it's a UK number starting with 0, convert to +44
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    phoneNumber = '+44' + cleaned.substring(1);
  }
  // If it already has the country code (44) but no +, add it
  else if (cleaned.startsWith('44') && cleaned.length === 12) {
    phoneNumber = '+' + cleaned;
  }
  // If it doesn't start with +, assume it's a UK number and add +44
  else if (!phoneNumber.startsWith('+')) {
    phoneNumber = '+44' + cleaned;
  }

  console.log('Formatted phone number:', phoneNumber);

  try {
    // Check if Square is configured
    if (!isSquareConfigured()) {
      console.log('Square not configured, using mock data');
      // Use mock data for development
      const mockResult = Math.random() > 0.3 ? MOCK_SUCCESS_RESULT : MOCK_FAILURE_RESULT;
      
      // Log the check-in to system logs with more details
      await createSystemLog({
        message: `Check-in ${mockResult.success ? 'successful' : 'failed'} for ${mockResult.customerData?.name}`,
        eventType: 'check_in',
        severity: mockResult.success ? 'info' : 'warning',
        details: {
          phoneNumber,
          customerId: mockResult.customerData?.id,
          success: mockResult.success,
          membershipStatus: mockResult.customerData?.membershipStatus,
          environment: 'development',
          mockData: true
        }
      });
      
      // In development, still store mock data in the database for testing
      if (mockResult.customerData) {
        // Upsert the customer
        const customer = await upsertCustomer({
          id: mockResult.customerData.id,
          name: mockResult.customerData.name,
          phoneNumber,
          membershipType: mockResult.customerData.membershipStatus
        });
        
        // Create check-in record if successful
        if (mockResult.success) {
          const checkIn = await createCheckIn({
            customerId: customer.id,
            customerName: customer.name,
            phoneNumber: customer.phoneNumber,
            membershipType: customer.membershipType,
            locationId
          });
          
          // Create a check-in record object
          const checkInRecord = {
            id: checkIn.id.toString(),
            timestamp: checkIn.checkInTime.toISOString(),
            customerName: customer.name,
            phoneNumber: customer.phoneNumber || '',
            success: true,
            membershipType: customer.membershipType || 'Unknown',
            message: `Check-in successful (${customer.membershipType === 'Active' ? 'Subscription' : 'Cash payment'})`,
            nextPayment: '',
            initials: customer.name
              .split(' ')
              .map(name => name[0])
              .join('')
              .substring(0, 2)
          };
          
          // Log the check-in event to the system logs for polling to pick up
          await createSystemLog({
            message: `Check-in successful for ${customer.name}`,
            eventType: 'check_in',
            severity: 'info',
            details: {
              ...checkInRecord,
              customerId: customer.id,
              locationId
            }
          });
        } else {
          // Create a failed check-in record object
          const checkInRecord = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            customerName: customer.name,
            phoneNumber: customer.phoneNumber || '',
            success: false,
            membershipType: customer.membershipType || 'Unknown',
            message: mockResult.message || 'Check-in failed',
            nextPayment: '',
            initials: customer.name
              .split(' ')
              .map(name => name[0])
              .join('')
              .substring(0, 2)
          };
          
          // Log the failed check-in event to the system logs for polling to pick up
          await createSystemLog({
            message: `Check-in failed for ${customer.name}: ${mockResult.message}`,
            eventType: 'check_in',
            severity: 'warning',
            details: {
              ...checkInRecord,
              customerId: customer.id,
              error: mockResult.error,
              locationId
            }
          });
        }
      }
      
      return json(mockResult);
    }

    // Verify membership with Square API
    const result = await verifyMembership(phoneNumber);
    
    // Log the check-in to system logs with more details
    await createSystemLog({
      message: `Check-in ${result.success ? 'successful' : 'failed'} for ${result.customerData?.name}`,
      eventType: 'check_in',
      severity: result.success ? 'info' : 'warning',
      details: {
        phoneNumber,
        customerId: result.customerData?.id,
        success: result.success,
        membershipStatus: result.customerData?.membershipStatus,
        environment: 'production',
        error: result.error
      }
    });
    
    // Store in database
    if (result.customerData) {
      // Upsert the customer
      const customer = await upsertCustomer({
        id: result.customerData.id,
        name: result.customerData.name,
        phoneNumber,
        membershipType: result.customerData.membershipStatus
      });
      
      // Create check-in record if successful
      if (result.success) {
        const checkIn = await createCheckIn({
          customerId: customer.id,
          customerName: customer.name,
          phoneNumber: customer.phoneNumber,
          membershipType: customer.membershipType,
          locationId
        });
        
        // Create a check-in record object
        const checkInRecord = {
          id: checkIn.id.toString(),
          timestamp: checkIn.checkInTime.toISOString(),
          customerName: customer.name,
          phoneNumber: customer.phoneNumber || '',
          success: true,
          membershipType: customer.membershipType || 'Unknown',
          message: `Check-in successful (${customer.membershipType === 'Active' ? 'Subscription' : 'Cash payment'})`,
          nextPayment: '',
          initials: customer.name
            .split(' ')
            .map(name => name[0])
            .join('')
            .substring(0, 2)
        };
        
        // Log the check-in event to the system logs for polling to pick up
        await createSystemLog({
          message: `Check-in successful for ${customer.name}`,
          eventType: 'check_in',
          severity: 'info',
          details: {
            ...checkInRecord,
            customerId: customer.id,
            locationId
          }
        });
      } else {
        // Create a failed check-in record object
        const checkInRecord = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          customerName: customer.name,
          phoneNumber: customer.phoneNumber || '',
          success: false,
          membershipType: customer.membershipType || 'Unknown',
          message: result.message || 'Check-in failed',
          nextPayment: '',
          initials: customer.name
            .split(' ')
            .map(name => name[0])
            .join('')
            .substring(0, 2)
        };
        
        // Log the failed check-in event to the system logs for polling to pick up
        await createSystemLog({
          message: `Check-in failed for ${customer.name}: ${result.message}`,
          eventType: 'check_in',
          severity: 'warning',
          details: {
            ...checkInRecord,
            customerId: customer.id,
            error: result.error,
            locationId
          }
        });
      }
    }
    
    return json(result);
  } catch (error) {
    console.error('Error in check-in action:', error);
    
    // Log the error with detailed information
    await createSystemLog({
      message: `Error during check-in: ${(error as Error).message}`,
      eventType: 'check_in_error',
      severity: 'error',
      details: {
        phoneNumber,
        error: (error as Error).stack,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      }
    });
    
    return json({ 
      success: false, 
      message: 'An unexpected error occurred. Please try again.',
      error: 'UNEXPECTED_ERROR'
    });
  }
}

export default function CheckInPage() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [showResult, setShowResult] = useState(false);

  const isSubmitting = navigation.state === 'submitting';

  // Show result when data is available and not submitting
  if (actionData && !isSubmitting && !showResult) {
    setShowResult(true);
  }

  // Reset when starting a new check-in
  const handleNewCheckIn = () => {
    setShowResult(false);
    // Reset the action data by redirecting to the check-in page
    window.location.href = '/check-in';
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center p-4">
      <div className="mb-8">
        <Logo />
      </div>
      
      <div className="w-full rounded-lg bg-white p-6 shadow-lg">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-800">
          {showResult ? 'Check-In Result' : 'Member Check-In'}
        </h1>
        
        {showResult && actionData ? (
          <CheckInResult 
            result={actionData as CheckInResultType} 
            onNewCheckIn={handleNewCheckIn} 
          />
        ) : (
          <CheckInForm 
            isSubmitting={isSubmitting} 
            onSubmit={() => {}} 
          />
        )}
      </div>
    </div>
  );
}
