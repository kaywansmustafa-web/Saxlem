/// Keeps a left-to-right value — a phone number, reference, code or version —
/// in its own order when it sits inside right-to-left Kurdish or Arabic text.
///
/// Wraps [value] in Unicode LEFT-TO-RIGHT ISOLATE (U+2066) and POP DIRECTIONAL
/// ISOLATE (U+2069). Harmless in English.
String ltrIsolate(String value) => value.isEmpty ? value : '\u2066$value\u2069';
