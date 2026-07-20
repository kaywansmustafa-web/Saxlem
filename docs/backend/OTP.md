# OTP Security

OTP challenges accept normalized `+9647...` numbers, expire after five minutes,
store purpose-separated HMAC-SHA256 hashes only, allow five verification attempts,
and lock after the limit. Secure unbiased integer generation creates the six-digit
code. Transactional locks make replacement, failed-attempt increments, and final
consumption atomic, so one challenge can create at most one session. Cleanup is
supported by expiry indexes; no background worker is introduced.

The development delivery provider can be constructed only in development/test.
Production and unknown environments fail closed because no production delivery
provider exists yet. Development responses may expose the OTP; production never can.
