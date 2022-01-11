/**
 * KYC Certificate
 */

export const kycCertificateCheckResponse = {
  entityType: 'person',
  isWhitelisted: true,
  signature:
    '0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
};

export const kycCertificatePendingErrorResponse = {
  status: 500,
  message:
    'Something went wrong while completing the request. Error: 0x6df4088d614005b1083d739ccc9816b2f45414ee is pending verification.',
};

export const kycCertificateNotFoundErrorResponse = {
  status: 404,
  message:
    'Could not find user with id 0xe0e57a69ed8a7fc1935bb5b2bf51f40b22fbeb4e in org 6 while verifying.',
};
