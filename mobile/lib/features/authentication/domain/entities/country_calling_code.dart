class CountryCallingCode {
  const CountryCallingCode({required this.isoCode, required this.callingCode});
  final String isoCode;
  final String callingCode;
}

const supportedCallingCodes = <CountryCallingCode>[
  CountryCallingCode(isoCode: 'IQ', callingCode: '+964'),
  CountryCallingCode(isoCode: 'TR', callingCode: '+90'),
  CountryCallingCode(isoCode: 'SY', callingCode: '+963'),
  CountryCallingCode(isoCode: 'IR', callingCode: '+98'),
  CountryCallingCode(isoCode: 'JO', callingCode: '+962'),
];
